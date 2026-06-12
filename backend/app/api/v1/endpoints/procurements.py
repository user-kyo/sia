# pyright: ignore[reportMissingImports]
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    status,
)
from typing import Optional, List
from app.schemas.procurements import ProcurementCreate, ProcurementResponse, SubmitInvoiceRequest
from app.db.supabase import supabase_client
from app.api.deps import get_current_user
from app.core.audit import log_audit_event
from app.core.mailer import send_po_approval_email
import uuid

router = APIRouter()

def _check_admin(user: dict):
    if user.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

def _generate_po_number() -> str:
    return f"PO-{str(uuid.uuid4())[:8].upper()}"

@router.get("", response_model=List[ProcurementResponse])
def list_procurements(
    status_filter: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    q = supabase_client.table("procurements").select("*").eq("company_id", current_user["company_id"])
    if status_filter:
        q = q.eq("status", status_filter)
        
    result = q.order("created_at", desc=True).execute()
    return result.data

@router.post("", response_model=ProcurementResponse, status_code=status.HTTP_201_CREATED)
def create_procurement(procurement: ProcurementCreate, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    # Verify supplier exists
    supplier = supabase_client.table("suppliers").select("id, name").eq("id", procurement.supplier_id).eq("company_id", current_user["company_id"]).execute()
    if not supplier.data:
        raise HTTPException(status_code=404, detail="Supplier not found")

    payload = procurement.model_dump()
    payload["company_id"] = current_user["company_id"]
    payload["po_number"] = _generate_po_number()
    payload["requested_by"] = current_user.get("username", "unknown")
    
    # Items must be JSON serializable dicts
    payload["items"] = [item for item in payload["items"]]

    result = supabase_client.table("procurements").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create procurement")
        
    created_po = result.data[0]
    
    log_audit_event(
        company_id=current_user["company_id"],
        user_id=current_user["id"],
        username=current_user.get("username", current_user.get("email", "unknown")),
        action="CREATE",
        module="Procurement",
        description=f"Created Purchase Order {created_po['po_number']} for supplier {supplier.data[0]['name']}"
    )
    
    return created_po

@router.get("/public/{po_id}", response_model=ProcurementResponse)
def get_public_procurement(po_id: str):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    result = supabase_client.table("procurements").select("*").eq("id", po_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return result.data[0]

@router.put("/public/{po_id}/submit-invoice", response_model=ProcurementResponse)
def submit_public_invoice(po_id: str, payload: SubmitInvoiceRequest):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    existing = supabase_client.table("procurements").select("*").eq("id", po_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    po = existing.data[0]
    if po["status"] not in ["approved", "invoice_received"]:
        raise HTTPException(status_code=400, detail="Can only submit invoice for approved POs")

    items = [item.model_dump() for item in payload.items]

    # Process cost updates
    try:
        supplier_id = po.get("supplier_id")
        supplier_name = "Supplier"
        if supplier_id:
            supplier_res = supabase_client.table("suppliers").select("name").eq("id", supplier_id).execute()
            if supplier_res.data:
                supplier_name = supplier_res.data[0]["name"]

        company_id = po.get("company_id")
        
        for po_item in items:
            product_id = po_item.get("product_id")
            new_cost = float(po_item.get("unit_price", 0))
            if product_id and new_cost is not None:
                inv_res = supabase_client.table("inventory").select("cost, name").eq("id", product_id).execute()
                if inv_res.data:
                    old_cost = float(inv_res.data[0].get("cost") or 0)
                    product_name = inv_res.data[0].get("name")
                    if old_cost != new_cost:
                        supabase_client.table("inventory").update({"cost": new_cost, "updated_at": "now()"}).eq("id", product_id).execute()
                        
                        notif_msg = f"Product cost updated: {product_name} changed from ₱{old_cost:.2f} to ₱{new_cost:.2f} based on {supplier_name}'s submitted invoice."
                        metadata = {
                            "product_id": product_id,
                            "old_cost": old_cost,
                            "new_cost": new_cost,
                            "supplier_name": supplier_name
                        }
                        supabase_client.table("notifications").insert({
                            "company_id": company_id,
                            "type": "cost_updated",
                            "title": "Cost Updated from Invoice",
                            "message": notif_msg,
                            "metadata": metadata
                        }).execute()
    except Exception as e:
        print("Error processing cost updates:", e)


    update_payload = {
        "status": "invoice_received",
        "items": items,
        "invoice_url": payload.invoice_url,
        "updated_at": "now()"
    }

    result = supabase_client.table("procurements").update(update_payload).eq("id", po_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit invoice")
        
    return result.data[0]

@router.put("/{po_id}/status", response_model=ProcurementResponse)
def update_procurement_status(
    po_id: str, 
    background_tasks: BackgroundTasks,
    new_status: str = Query(..., pattern="^(approved|received|cancelled|invoice_received)$"),
    reason: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    _check_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    existing = supabase_client.table("procurements").select("*").eq("id", po_id).eq("company_id", current_user["company_id"]).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    po = existing.data[0]
    if po["status"] == new_status:
        raise HTTPException(status_code=400, detail=f"Purchase Order is already {new_status}")
    if po["status"] in ["cancelled", "received"]:
        raise HTTPException(status_code=400, detail=f"Cannot change status of a {po['status']} PO")
        
    if new_status == "received" and po["status"] not in ["approved", "invoice_received"]:
        raise HTTPException(status_code=400, detail="Can only receive an approved or invoiced PO")

    update_payload = {"status": new_status, "updated_at": "now()"}
    if new_status == "cancelled" and reason:
        update_payload["cancel_reason"] = reason

    result = supabase_client.table("procurements").update(update_payload).eq("id", po_id).eq("company_id", current_user["company_id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail=f"Failed to mark PO as {new_status}")
        
    updated_po = result.data[0]
    
    # Auto-Restock Logic
    if new_status == "received":
        supplier_id = updated_po.get("supplier_id")
        supplier_name = "Supplier"
        if supplier_id:
            supplier_res = supabase_client.table("suppliers").select("name").eq("id", supplier_id).execute()
            if supplier_res.data:
                supplier_name = supplier_res.data[0]["name"]
                
        for item in updated_po["items"]:
            if item.get("product_id"):
                # Fetch current stock
                inv = supabase_client.table("inventory").select("quantity, cost, name").eq("id", item["product_id"]).eq("company_id", current_user["company_id"]).execute()
                if inv.data:
                    current_qty = inv.data[0]["quantity"]
                    new_qty = current_qty + item["quantity"]
                    
                    old_cost = float(inv.data[0].get("cost") or 0)
                    new_cost = float(item.get("unit_price", 0))
                    product_name = inv.data[0].get("name")
                    
                    update_data = {"quantity": new_qty, "updated_at": "now()"}
                    if old_cost != new_cost and new_cost > 0:
                        update_data["cost"] = new_cost
                        
                    supabase_client.table("inventory").update(update_data).eq("id", item["product_id"]).execute()
                    
                    if old_cost != new_cost and new_cost > 0:
                        notif_msg = f"Product cost updated: {product_name} changed from ₱{old_cost:.2f} to ₱{new_cost:.2f} upon receiving PO."
                        metadata = {
                            "product_id": item["product_id"],
                            "old_cost": old_cost,
                            "new_cost": new_cost,
                            "supplier_name": supplier_name
                        }
                        try:
                            supabase_client.table("notifications").insert({
                                "company_id": current_user["company_id"],
                                "type": "cost_updated",
                                "title": "Cost Updated from PO",
                                "message": notif_msg,
                                "metadata": metadata
                            }).execute()
                        except Exception as e:
                            print("Error inserting notification:", e)

    # Email notification for approval
    if new_status == "approved":
        supplier = supabase_client.table("suppliers").select("name, email").eq("id", updated_po["supplier_id"]).eq("company_id", current_user["company_id"]).execute()
        if supplier.data and supplier.data[0].get("email"):
            company = supabase_client.table("companies").select("name, smtp_email, smtp_password").eq("id", current_user["company_id"]).execute()
            company_name = company.data[0]["name"] if company.data else "Your Company"
            smtp_email = company.data[0].get("smtp_email") if company.data else None
            smtp_password = company.data[0].get("smtp_password") if company.data else None
            portal_link = f"http://localhost:5173/supplier/po/{updated_po['id']}"
            background_tasks.add_task(
                send_po_approval_email,
                to_email=supplier.data[0]["email"],
                supplier_name=supplier.data[0]["name"],
                po_number=updated_po["po_number"],
                items=updated_po["items"],
                company_name=company_name,
                portal_link=portal_link,
                custom_smtp_user=smtp_email,
                custom_smtp_password=smtp_password
            )

    log_audit_event(
        company_id=current_user["company_id"],
        user_id=current_user["id"],
        username=current_user.get("username", current_user.get("email", "unknown")),
        action="UPDATE_STATUS",
        module="Procurement",
        description=f"Marked Purchase Order {po['po_number']} as {new_status.upper()}" + (f" - Reason: {reason}" if reason else "")
    )
    
    return updated_po

@router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_completed_procurement(po_id: str, current_user: dict = Depends(get_current_user)):
    _check_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    existing = (
        supabase_client.table("procurements")
        .select("*")
        .eq("id", po_id)
        .eq("company_id", current_user["company_id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    po = existing.data[0]
    if po["status"] != "received":
        raise HTTPException(status_code=400, detail="Only completed purchase orders can be deleted")

    result = (
        supabase_client.table("procurements")
        .delete()
        .eq("id", po_id)
        .eq("company_id", current_user["company_id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to delete purchase order")

    log_audit_event(
        company_id=current_user["company_id"],
        user_id=current_user["id"],
        username=current_user.get("username", current_user.get("email", "unknown")),
        action="DELETE",
        module="Procurement",
        description=f"Deleted completed Purchase Order {po['po_number']}"
    )

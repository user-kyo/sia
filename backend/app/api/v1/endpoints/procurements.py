from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Optional, List
from app.schemas.procurements import ProcurementCreate, ProcurementUpdate, ProcurementResponse
from app.db.supabase import supabase_client
from app.api.deps import get_current_user
from app.core.audit import log_audit_event
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

@router.put("/{po_id}/status", response_model=ProcurementResponse)
def update_procurement_status(
    po_id: str, 
    new_status: str = Query(..., regex="^(approved|received|cancelled)$"),
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
        
    if new_status == "received" and po["status"] != "approved":
        raise HTTPException(status_code=400, detail="Can only receive an approved PO")

    update_payload = {"status": new_status, "updated_at": "now()"}
    if new_status == "cancelled" and reason:
        update_payload["cancel_reason"] = reason

    result = supabase_client.table("procurements").update(update_payload).eq("id", po_id).eq("company_id", current_user["company_id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail=f"Failed to mark PO as {new_status}")
        
    updated_po = result.data[0]
    
    # Auto-Restock Logic
    if new_status == "received":
        for item in updated_po["items"]:
            if item.get("product_id"):
                # Fetch current stock
                inv = supabase_client.table("inventory").select("quantity").eq("id", item["product_id"]).eq("company_id", current_user["company_id"]).execute()
                if inv.data:
                    current_qty = inv.data[0]["quantity"]
                    new_qty = current_qty + item["quantity"]
                    supabase_client.table("inventory").update({"quantity": new_qty, "updated_at": "now()"}).eq("id", item["product_id"]).execute()

    log_audit_event(
        company_id=current_user["company_id"],
        user_id=current_user["id"],
        username=current_user.get("username", current_user.get("email", "unknown")),
        action="UPDATE_STATUS",
        module="Procurement",
        description=f"Marked Purchase Order {po['po_number']} as {new_status.upper()}" + (f" - Reason: {reason}" if reason else "")
    )
    
    return updated_po

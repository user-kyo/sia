from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Optional, List
from app.schemas.suppliers import SupplierCreate, SupplierUpdate, SupplierResponse
from app.db.supabase import supabase_client
from app.api.deps import get_current_user

router = APIRouter()

def _check_admin(user: dict):
    if user.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

@router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    include_deleted: bool = Query(False),
    current_user: dict = Depends(get_current_user),
):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    q = supabase_client.table("suppliers").select("*").eq("company_id", current_user["company_id"])
    
    if status_filter:
        q = q.eq("status", status_filter)
    elif not include_deleted:
        q = q.neq("status", "deleted")
    if search:
        q = q.ilike("name", f"%{search}%")
        
    result = q.order("name").execute()
    return result.data

@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    _check_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    payload = supplier.model_dump(exclude_unset=True)
    payload["company_id"] = current_user["company_id"]

    result = supabase_client.table("suppliers").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create supplier")
        
    return result.data[0]

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: str, supplier: SupplierUpdate, current_user: dict = Depends(get_current_user)):
    _check_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    payload = supplier.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    payload["updated_at"] = "now()"

    result = supabase_client.table("suppliers").update(payload).eq("id", supplier_id).eq("company_id", current_user["company_id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Supplier not found or not updated")
        
    return result.data[0]

@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    _check_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    supplier = (
        supabase_client.table("suppliers")
        .select("id")
        .eq("id", supplier_id)
        .eq("company_id", current_user["company_id"])
        .limit(1)
        .execute()
    )
    if not supplier.data:
        raise HTTPException(status_code=404, detail="Supplier not found")

    linked_procurement = (
        supabase_client.table("procurements")
        .select("id")
        .eq("supplier_id", supplier_id)
        .eq("company_id", current_user["company_id"])
        .limit(1)
        .execute()
    )

    if linked_procurement.data:
        supabase_client.table("suppliers").update({
            "status": "deleted",
            "updated_at": "now()",
        }).eq("id", supplier_id).eq("company_id", current_user["company_id"]).execute()
        return

    supabase_client.table("suppliers").delete().eq("id", supplier_id).eq("company_id", current_user["company_id"]).execute()

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.db.supabase import supabase_client
from app.api.deps import get_current_user

from pydantic import BaseModel

class BrandUpdate(BaseModel):
    new_name: str

router = APIRouter()


@router.get("", response_model=List[str])
def get_brands(current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    result = supabase_client.table("inventory").select("brand").eq("company_id", current_user["company_id"]).execute()

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))

    brands = sorted(list(set(
        item["brand"] for item in result.data if item.get("brand")
    )))
    return brands


@router.put("/{brand_name}")
def update_brand(brand_name: str, brand_data: BrandUpdate, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    new_name = brand_data.new_name.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Brand name cannot be empty")

    result = supabase_client.table("inventory").update({"brand": new_name}).eq("brand", brand_name).eq("company_id", current_user["company_id"]).execute()

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))

    return {"message": "Brand updated successfully", "updated_count": len(result.data) if result.data else 0}


@router.delete("/{brand_name}")
def delete_brand(brand_name: str, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    result = supabase_client.table("inventory").update({"brand": None}).eq("brand", brand_name).eq("company_id", current_user["company_id"]).execute()

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))

    return {"message": "Brand removed from all products successfully", "updated_count": len(result.data) if result.data else 0}

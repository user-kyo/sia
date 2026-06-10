from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.db.supabase import supabase_client
from app.api.deps import get_current_user

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

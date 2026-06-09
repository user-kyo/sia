from fastapi import APIRouter, HTTPException
from typing import List
from app.db.supabase import supabase_client

router = APIRouter()


@router.get("/", response_model=List[str])
def get_categories():
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    result = supabase_client.table("inventory").select("category").execute()

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))

    categories = sorted(list(set(
        item["category"] for item in result.data if item.get("category")
    )))
    return categories

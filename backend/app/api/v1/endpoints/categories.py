from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.db.supabase import supabase_client
from app.api.deps import get_current_user
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter()

@router.get("", response_model=List[str])
def get_categories(current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    result = supabase_client.table("categories").select("name").eq("company_id", current_user["company_id"]).execute()

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))

    categories = sorted(list(set(
        item["name"] for item in result.data if item.get("name")
    )))
    return categories

@router.post("", response_model=CategoryResponse)
def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    data = {
        "name": category.name.strip(),
        "company_id": current_user["company_id"]
    }

    result = supabase_client.table("categories").insert(data).execute()

    if hasattr(result, "error") and result.error:
        if "categories_company_id_name_key" in str(result.error) or "unique constraint" in str(result.error).lower():
            raise HTTPException(status_code=400, detail="Category already exists.")
        raise HTTPException(status_code=400, detail=str(result.error))

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create category.")

    return result.data[0]

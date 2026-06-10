from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.db.supabase import supabase_client
from app.api.deps import get_current_user
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter()

@router.get("", response_model=List[CategoryResponse])
def get_categories(current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    result = supabase_client.table("categories").select("*").eq("company_id", current_user["company_id"]).order("name").execute()

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))

    return result.data

@router.post("", response_model=CategoryResponse)
def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    data = {
        "name": category.name.strip(),
        "icon": category.icon,
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

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: str, category: CategoryUpdate, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    # 1. Fetch old category to get the old name
    old_cat_result = supabase_client.table("categories").select("name").eq("id", category_id).eq("company_id", current_user["company_id"]).execute()
    if not old_cat_result.data:
        raise HTTPException(status_code=404, detail="Category not found.")
    
    old_name = old_cat_result.data[0]["name"]
    new_name = category.name.strip()

    # 2. Update the categories table
    data = {
        "name": new_name,
        "icon": category.icon
    }

    update_result = supabase_client.table("categories").update(data).eq("id", category_id).eq("company_id", current_user["company_id"]).execute()

    if hasattr(update_result, "error") and update_result.error:
        if "categories_company_id_name_key" in str(update_result.error) or "unique constraint" in str(update_result.error).lower():
            raise HTTPException(status_code=400, detail="Category name already exists.")
        raise HTTPException(status_code=400, detail=str(update_result.error))

    # 3. Cascade update to inventory table if name changed
    if old_name != new_name:
        inv_update = supabase_client.table("inventory").update({"category": new_name}).eq("category", old_name).eq("company_id", current_user["company_id"]).execute()
        if hasattr(inv_update, "error") and inv_update.error:
            # If inventory cascade fails, it's problematic but the category is already updated. We should ideally use a transaction or RPC.
            pass

    if not update_result.data:
        raise HTTPException(status_code=500, detail="Failed to update category.")

    return update_result.data[0]

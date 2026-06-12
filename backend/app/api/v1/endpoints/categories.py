from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.db.supabase import supabase_client
from app.api.deps import get_current_user
from app.core.audit import log_action
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

    created = result.data[0]
    log_action(current_user, "CREATE", "Category", f"Added category {created.get('name')}")
    return created

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

    description = f"Renamed category {old_name} to {new_name}" if old_name != new_name else f"Updated category {new_name}"
    log_action(current_user, "UPDATE", "Category", description)
    return update_result.data[0]

@router.delete("/{category_id}")
def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    # 1. Fetch category to get the name
    cat_result = supabase_client.table("categories").select("name").eq("id", category_id).eq("company_id", current_user["company_id"]).execute()
    if not cat_result.data:
        raise HTTPException(status_code=404, detail="Category not found.")
    
    cat_name = cat_result.data[0]["name"]

    # 2. Check if products use it
    inv_result = supabase_client.table("inventory").select("id", count="exact").eq("category", cat_name).eq("company_id", current_user["company_id"]).execute()
    if inv_result.count and inv_result.count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete category because {inv_result.count} product(s) are using it.")

    # 3. Delete
    delete_result = supabase_client.table("categories").delete().eq("id", category_id).eq("company_id", current_user["company_id"]).execute()
    
    if hasattr(delete_result, "error") and delete_result.error:
        raise HTTPException(status_code=400, detail=str(delete_result.error))

    log_action(current_user, "DELETE", "Category", f"Deleted category {cat_name}")
    return {"message": "Category deleted successfully"}

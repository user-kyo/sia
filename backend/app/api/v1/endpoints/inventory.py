from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.inventory import InventoryItemCreate, InventoryItemResponse
from app.db.supabase import supabase_client

router = APIRouter()

@router.post("/", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item: InventoryItemCreate):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    # Collision Detection: Check if an item with the same SKU or Name already exists
    # We query Supabase to see if there's any matching record
    existing = supabase_client.table('inventory').select('*').eq('sku', item.sku).execute()
    if existing.data and len(existing.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate entry collision: An item with SKU '{item.sku}' already exists."
        )
        
    existing_name = supabase_client.table('inventory').select('*').eq('name', item.name).execute()
    if existing_name.data and len(existing_name.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate entry collision: An item with Name '{item.name}' already exists."
        )

    # Insert the new item
    item_dict = item.model_dump()
    result = supabase_client.table('inventory').insert(item_dict).execute()
    
    if hasattr(result, 'error') and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))
        
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create item")
        
    return result.data[0]

@router.get("/", response_model=List[InventoryItemResponse])
def get_inventory():
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    result = supabase_client.table('inventory').select('*').execute()
    
    if hasattr(result, 'error') and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))
        
    return result.data

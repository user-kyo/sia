import uuid
from fastapi import APIRouter, HTTPException, status, Query, UploadFile, File
from typing import Optional
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse,
    StockAdjustment, InventoryListResponse,
)
from app.db.supabase import supabase_client

router = APIRouter()

LIMIT = 20


def _generate_sku() -> str:
    return f"PRD-{str(uuid.uuid4())[:8].upper()}"


@router.get("", response_model=InventoryListResponse)
def list_inventory(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    stock_status: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    limit: int = Query(LIMIT, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    ascending = sort_order == "asc"
    needs_python_filter = stock_status in ("low_stock", "in_stock")

    def _build_base(with_count: bool):
        q = supabase_client.table("inventory").select("*", count="exact" if with_count else None)
        if search:
            q = q.or_(f"name.ilike.%{search}%,sku.ilike.%{search}%,category.ilike.%{search}%")
        if category:
            q = q.eq("category", category)
        if min_price is not None:
            q = q.gte("price", min_price)
        if max_price is not None:
            q = q.lte("price", max_price)
        return q

    if not needs_python_filter:
        q = _build_base(with_count=True)
        if stock_status == "out_of_stock":
            q = q.eq("quantity", 0)
        q = q.order(sort_by, desc=not ascending).range(offset, offset + limit - 1)
        result = q.execute()
        if hasattr(result, "error") and result.error:
            raise HTTPException(status_code=400, detail=str(result.error))
        total = result.count or 0
        return {"data": result.data, "total": total, "has_more": offset + limit < total}

    # Python-level filtering for low_stock / in_stock
    q = _build_base(with_count=False).order(sort_by, desc=not ascending)
    result = q.execute()
    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))

    items = result.data
    if stock_status == "low_stock":
        items = [i for i in items if 0 < i["quantity"] <= i["reorder_point"]]
    elif stock_status == "in_stock":
        items = [i for i in items if i["quantity"] > i["reorder_point"]]

    total = len(items)
    return {"data": items[offset: offset + limit], "total": total, "has_more": offset + limit < total}


@router.get("/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(item_id: str):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    result = supabase_client.table("inventory").select("*").eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return result.data[0]


@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item: InventoryItemCreate):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    sku = item.sku or _generate_sku()

    # Uniqueness checks
    if supabase_client.table("inventory").select("id").eq("sku", sku).execute().data:
        raise HTTPException(status_code=409, detail=f"SKU '{sku}' already exists.")
    if supabase_client.table("inventory").select("id").eq("name", item.name).execute().data:
        raise HTTPException(status_code=409, detail=f"Product name '{item.name}' already exists.")

    payload = item.model_dump()
    payload["sku"] = sku
    try:
        result = supabase_client.table("inventory").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create item — the inventory table may be missing required columns (category, reorder_point, description, unit). Please add them in Supabase.")
    return result.data[0]


@router.put("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(item_id: str, item: InventoryItemUpdate):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    if not supabase_client.table("inventory").select("id").eq("id", item_id).execute().data:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = item.model_dump(exclude_none=True)
    if "sku" in update_data:
        conflict = supabase_client.table("inventory").select("id").eq("sku", update_data["sku"]).neq("id", item_id).execute()
        if conflict.data:
            raise HTTPException(status_code=409, detail=f"SKU '{update_data['sku']}' already exists.")

    result = supabase_client.table("inventory").update(update_data).eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update item")
    return result.data[0]


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(item_id: str):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    if not supabase_client.table("inventory").select("id").eq("id", item_id).execute().data:
        raise HTTPException(status_code=404, detail="Item not found")
    supabase_client.table("inventory").delete().eq("id", item_id).execute()


@router.post("/{item_id}/adjust-stock", response_model=InventoryItemResponse)
def adjust_stock(item_id: str, adjustment: StockAdjustment):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    existing = supabase_client.table("inventory").select("*").eq("id", item_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Item not found")

    current_qty = existing.data[0]["quantity"]
    t = adjustment.adjustment_type

    if t == "add":
        new_qty = current_qty + adjustment.quantity
    elif t == "remove":
        new_qty = max(0, current_qty - adjustment.quantity)
    elif t == "set":
        new_qty = adjustment.quantity
    else:
        raise HTTPException(status_code=400, detail="adjustment_type must be 'add', 'remove', or 'set'")

    result = supabase_client.table("inventory").update({"quantity": new_qty}).eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to adjust stock")
    return result.data[0]

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database connection error")
        
    try:
        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        
        file_bytes = await file.read()
        res = supabase_client.storage.from_("product-images").upload(
            file_name, 
            file_bytes, 
            file_options={"content-type": file.content_type}
        )
        
        public_url = supabase_client.storage.from_("product-images").get_public_url(file_name)
        
        return {"image_url": public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

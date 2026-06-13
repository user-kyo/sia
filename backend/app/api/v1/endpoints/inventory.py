import uuid
from fastapi import APIRouter, HTTPException, status, Query, UploadFile, File, Depends
from typing import Optional
from datetime import datetime
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse,
    StockAdjustment, InventoryListResponse,
)
from app.db.supabase import supabase_client
from app.api.deps import get_current_user
from app.core.audit import log_action

router = APIRouter()

LIMIT = 20


def _generate_sku() -> str:
    return f"PRD-{str(uuid.uuid4())[:8].upper()}"


# Human-readable labels for product fields shown in audit descriptions.
_FIELD_LABELS = {
    "name": "name",
    "sku": "SKU",
    "price": "price",
    "quantity": "quantity",
    "category": "category",
    "brand": "brand",
    "reorder_point": "reorder point",
    "currency": "currency",
    "description": "description",
    "supplier_id": "supplier",
    "image_url": "image",
}


def _fmt_value(value) -> str:
    if value is None or value == "":
        return "none"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _supplier_name(company_id: str, supplier_id) -> str:
    if not supplier_id:
        return "none"
    try:
        res = supabase_client.table("suppliers").select("name").eq("id", supplier_id).eq("company_id", company_id).limit(1).execute()
        if res.data:
            return res.data[0].get("name") or "Unknown"
    except Exception:
        pass
    return "Unknown"


def _summarize_inventory_changes(old: dict, update_data: dict, company_id: str) -> list[str]:
    """Build a list of 'field old → new' strings for the fields that changed."""
    changes: list[str] = []
    for key, new_val in update_data.items():
        old_val = old.get(key)
        if old_val == new_val:
            continue
        label = _FIELD_LABELS.get(key, key.replace("_", " "))
        if key == "image_url":
            changes.append("image updated")
        elif key == "description":
            changes.append("description updated")
        elif key == "supplier_id":
            changes.append(
                f"supplier {_supplier_name(company_id, old_val)} → {_supplier_name(company_id, new_val)}"
            )
        else:
            changes.append(f"{label} {_fmt_value(old_val)} → {_fmt_value(new_val)}")
    return changes


def _load_inventory_summary(company_id: str) -> dict:
    categories: dict[str, dict] = {}
    page_size = 1000
    offset = 0

    while True:
        result = (
            supabase_client.table("inventory")
            .select("category,quantity,price,currency")
            .eq("company_id", company_id)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = result.data or []

        for row in rows:
            category = row.get("category") or "Uncategorized"
            quantity = int(row.get("quantity") or 0)
            price = float(row.get("price") or 0)
            currency = row.get("currency") or "PHP"
            entry = categories.setdefault(
                category,
                {
                    "category": category,
                    "product_count": 0,
                    "stock_quantity": 0,
                    "value_by_currency": {},
                },
            )
            entry["product_count"] += 1
            entry["stock_quantity"] += quantity
            entry["value_by_currency"][currency] = (
                entry["value_by_currency"].get(currency, 0.0) + (price * quantity)
            )

        if len(rows) < page_size:
            break
        offset += page_size

    return {
        "category_breakdown": sorted(
            categories.values(),
            key=lambda category: category["stock_quantity"],
            reverse=True,
        )
    }


@router.get("", response_model=InventoryListResponse)
def list_inventory(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    has_image: Optional[bool] = Query(None),
    stock_status: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    supplier_id: Optional[str] = Query(None),
    created_from: Optional[datetime] = Query(None),
    created_to: Optional[datetime] = Query(None),
    include_summary: bool = Query(False),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    limit: int = Query(20, ge=1, le=100000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    category_list = category.split(",") if category else []
    brand_list = brand.split(",") if brand else []
    stock_status_list = stock_status.split(",") if stock_status else []

    ascending = sort_order == "asc"
    needs_python_filter = "low_stock" in stock_status_list or "in_stock" in stock_status_list

    def _build_base(with_count: bool):
        q = supabase_client.table("inventory").select("*", count="exact" if with_count else None).eq("company_id", current_user["company_id"])
        if search:
            q = q.or_(f"name.ilike.%{search}%,sku.ilike.%{search}%,category.ilike.%{search}%")
        if category_list:
            q = q.in_("category", category_list)
        if brand_list:
            q = q.in_("brand", brand_list)
        if has_image is not None:
            if has_image:
                q = q.not_.is_("image_url", "null")
            else:
                q = q.is_("image_url", "null")
        if min_price is not None:
            q = q.gte("price", min_price)
        if max_price is not None:
            q = q.lte("price", max_price)
        if supplier_id is not None:
            q = q.eq("supplier_id", supplier_id)
        if created_from is not None:
            q = q.gte("created_at", created_from.isoformat())
        if created_to is not None:
            q = q.lt("created_at", created_to.isoformat())
        return q

    if not needs_python_filter:
        q = _build_base(with_count=True)
        if "out_of_stock" in stock_status_list:
            q = q.eq("quantity", 0)
        q = q.order(sort_by, desc=not ascending).range(offset, offset + limit - 1)
        result = q.execute()
        if hasattr(result, "error") and result.error:
            raise HTTPException(status_code=400, detail=str(result.error))
        total = result.count or 0
        response = {"data": result.data, "total": total, "has_more": offset + limit < total}
        if include_summary:
            response["summary"] = _load_inventory_summary(current_user["company_id"])
        return response

    # Python-level filtering for low_stock / in_stock
    q = _build_base(with_count=False).order(sort_by, desc=not ascending)
    result = q.execute()
    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))

    items = result.data
    filtered_items = []
    
    for i in items:
        is_match = False
        if "out_of_stock" in stock_status_list and i["quantity"] == 0:
            is_match = True
        elif "low_stock" in stock_status_list and 0 < i["quantity"] <= i["reorder_point"]:
            is_match = True
        elif "in_stock" in stock_status_list and i["quantity"] > i["reorder_point"]:
            is_match = True
            
        if is_match:
            filtered_items.append(i)

    total = len(filtered_items)
    response = {"data": filtered_items[offset: offset + limit], "total": total, "has_more": offset + limit < total}
    if include_summary:
        response["summary"] = _load_inventory_summary(current_user["company_id"])
    return response


@router.get("/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    result = supabase_client.table("inventory").select("*").eq("id", item_id).eq("company_id", current_user["company_id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return result.data[0]


@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    sku = item.sku or _generate_sku()

    # Uniqueness checks scoped to company
    if supabase_client.table("inventory").select("id").eq("sku", sku).eq("company_id", current_user["company_id"]).execute().data:
        raise HTTPException(status_code=409, detail=f"SKU '{sku}' already exists.")
    if supabase_client.table("inventory").select("id").eq("name", item.name).eq("company_id", current_user["company_id"]).execute().data:
        raise HTTPException(status_code=409, detail=f"Product name '{item.name}' already exists.")

    payload = item.model_dump()
    payload["sku"] = sku
    payload["company_id"] = current_user["company_id"]
    try:
        result = supabase_client.table("inventory").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create item — the inventory table may be missing required columns (category, reorder_point, description, brand). Please add them in Supabase.")

    created = result.data[0]
    log_action(current_user, "CREATE", "Inventory", f"Added product {created.get('name')} ({created.get('sku')})")
    return created


@router.put("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(item_id: str, item: InventoryItemUpdate, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    old_result = supabase_client.table("inventory").select("*").eq("id", item_id).eq("company_id", current_user["company_id"]).execute()
    if not old_result.data:
        raise HTTPException(status_code=404, detail="Item not found")
    old_item = old_result.data[0]

    update_data = item.model_dump(exclude_none=True)
    if "supplier_id" in item.model_fields_set and item.supplier_id is None:
        update_data["supplier_id"] = None
    if "sku" in update_data:
        conflict = supabase_client.table("inventory").select("id").eq("sku", update_data["sku"]).neq("id", item_id).eq("company_id", current_user["company_id"]).execute()
        if conflict.data:
            raise HTTPException(status_code=409, detail=f"SKU '{update_data['sku']}' already exists.")

    result = supabase_client.table("inventory").update(update_data).eq("id", item_id).eq("company_id", current_user["company_id"]).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update item")

    updated = result.data[0]
    changes = _summarize_inventory_changes(old_item, update_data, current_user["company_id"])
    base = f"Updated product {updated.get('name')} ({updated.get('sku')})"
    # The diff is appended as a fallback in case the structured `changes` column
    # isn't present yet; the UI strips it from the description for display.
    description = f"{base}: {', '.join(changes)}" if changes else base
    log_action(current_user, "UPDATE", "Inventory", description, changes=changes)
    return updated


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    existing = supabase_client.table("inventory").select("name, sku").eq("id", item_id).eq("company_id", current_user["company_id"]).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Item not found")
    supabase_client.table("inventory").delete().eq("id", item_id).eq("company_id", current_user["company_id"]).execute()

    deleted = existing.data[0]
    log_action(current_user, "DELETE", "Inventory", f"Deleted product {deleted.get('name')} ({deleted.get('sku')})")


@router.post("/{item_id}/adjust-stock", response_model=InventoryItemResponse)
def adjust_stock(item_id: str, adjustment: StockAdjustment, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    existing = supabase_client.table("inventory").select("*").eq("id", item_id).eq("company_id", current_user["company_id"]).execute()
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

    result = supabase_client.table("inventory").update({"quantity": new_qty}).eq("id", item_id).eq("company_id", current_user["company_id"]).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to adjust stock")

    adjusted = result.data[0]
    log_action(
        current_user,
        "ADJUST_STOCK",
        "Inventory",
        f"Adjusted stock for {adjusted.get('name')} ({adjusted.get('sku')}): {current_qty} → {new_qty}",
    )
    return adjusted

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
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

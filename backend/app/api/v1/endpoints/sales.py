import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.db.supabase import supabase_client
from app.schemas.sales import (
    SalesTransactionCreate,
    SalesTransactionListResponse,
    SalesTransactionResponse,
)

router = APIRouter()


def _table_missing_error(error: Exception) -> bool:
    message = str(error).lower()
    return (
        "sales_transactions" in message
        and ("schema cache" in message or "does not exist" in message or "could not find" in message)
    )


def _generate_transaction_code() -> str:
    return f"TXN-{str(uuid.uuid4())[:8].upper()}"


def _parse_datetime(value) -> datetime | None:
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _format_day_label(day) -> str:
    return f"{day.strftime('%b')} {day.day}"


def _load_inventory_category_lookup(company_id: str) -> tuple[dict[str, str], dict[str, str]]:
    by_id: dict[str, str] = {}
    by_sku: dict[str, str] = {}
    page_size = 1000
    offset = 0

    while True:
        result = (
            supabase_client.table("inventory")
            .select("id,sku,category")
            .eq("company_id", company_id)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = result.data or []

        for row in rows:
            category = row.get("category") or "Uncategorized"
            if row.get("id"):
                by_id[row["id"]] = category
            if row.get("sku"):
                by_sku[row["sku"]] = category

        if len(rows) < page_size:
            break
        offset += page_size

    return by_id, by_sku


def _load_revenue_by_currency(company_id: str) -> dict[str, float]:
    revenue_by_currency: dict[str, float] = {}
    page_size = 1000
    offset = 0

    while True:
        result = (
            supabase_client.table("sales_transactions")
            .select("total_amount,currency")
            .eq("company_id", company_id)
            .order("created_at")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = result.data or []

        for row in rows:
            currency = row.get("currency") or "PHP"
            revenue_by_currency[currency] = revenue_by_currency.get(currency, 0.0) + float(row.get("total_amount") or 0)

        if len(rows) < page_size:
            break
        offset += page_size

    return revenue_by_currency


def _load_sales_summary(company_id: str, summary_from: datetime | None, summary_to: datetime | None) -> dict:
    summary_to = summary_to or datetime.now(timezone.utc)
    if summary_to.tzinfo is None:
        summary_to = summary_to.replace(tzinfo=timezone.utc)
    summary_to = summary_to.astimezone(timezone.utc)

    summary_from = summary_from or (summary_to - timedelta(days=30))
    if summary_from.tzinfo is None:
        summary_from = summary_from.replace(tzinfo=timezone.utc)
    summary_from = summary_from.astimezone(timezone.utc)

    revenue_by_currency = _load_revenue_by_currency(company_id)
    top_products_by_key: dict[str, dict] = {}
    categories_by_key: dict[str, dict] = {}
    category_by_id, category_by_sku = _load_inventory_category_lookup(company_id)
    trend_by_day: dict[str, dict] = {}
    cursor = summary_from.date()
    end_date = summary_to.date()

    while cursor <= end_date:
        key = cursor.isoformat()
        trend_by_day[key] = {
            "date": key,
            "label": _format_day_label(cursor),
            "orders": 0,
            "revenue_by_currency": {},
        }
        cursor += timedelta(days=1)

    page_size = 1000
    offset = 0

    while True:
        query = (
            supabase_client.table("sales_transactions")
            .select("total_amount,currency,items,created_at")
            .eq("company_id", company_id)
            .gte("created_at", summary_from.isoformat())
            .lt("created_at", summary_to.isoformat())
            .order("created_at")
        )
        result = query.range(offset, offset + page_size - 1).execute()
        rows = result.data or []

        for row in rows:
            transaction_currency = row.get("currency") or "PHP"
            transaction_total = float(row.get("total_amount") or 0)
            created_at = _parse_datetime(row.get("created_at"))
            day_key = created_at.date().isoformat() if created_at else None

            if day_key and day_key in trend_by_day:
                trend = trend_by_day[day_key]
                trend["orders"] += 1
                trend["revenue_by_currency"][transaction_currency] = (
                    trend["revenue_by_currency"].get(transaction_currency, 0.0) + transaction_total
                )

            items = row.get("items") or []
            if not isinstance(items, list):
                items = []

            for item in items:
                if not isinstance(item, dict):
                    continue

                name = item.get("name") or "Unknown Product"
                product_id = item.get("product_id")
                sku = item.get("sku")
                category = (
                    item.get("category")
                    or (category_by_id.get(product_id) if product_id else None)
                    or (category_by_sku.get(sku) if sku else None)
                    or "Uncategorized"
                )
                key = product_id or sku or name
                quantity = int(item.get("quantity") or 0)
                item_currency = item.get("currency") or transaction_currency
                line_total = item.get("line_total")
                if line_total is None:
                    line_total = float(item.get("unit_price") or 0) * quantity

                product = top_products_by_key.setdefault(
                    key,
                    {
                        "product_id": product_id,
                        "sku": sku,
                        "name": name,
                        "category": category,
                        "quantity": 0,
                        "revenue_by_currency": {},
                    },
                )
                product["quantity"] += quantity
                product["revenue_by_currency"][item_currency] = (
                    product["revenue_by_currency"].get(item_currency, 0.0) + float(line_total or 0)
                )

                category_entry = categories_by_key.setdefault(
                    category,
                    {
                        "category": category,
                        "quantity": 0,
                        "revenue_by_currency": {},
                    },
                )
                category_entry["quantity"] += quantity
                category_entry["revenue_by_currency"][item_currency] = (
                    category_entry["revenue_by_currency"].get(item_currency, 0.0) + float(line_total or 0)
                )

        if len(rows) < page_size:
            break
        offset += page_size

    top_products = sorted(
        top_products_by_key.values(),
        key=lambda product: product["quantity"],
        reverse=True,
    )[:10]
    category_performance = sorted(
        categories_by_key.values(),
        key=lambda category: category["quantity"],
        reverse=True,
    )

    return {
        "revenue_by_currency": revenue_by_currency,
        "top_products": top_products,
        "category_performance": category_performance,
        "daily_trends": list(trend_by_day.values()),
    }


@router.get("", response_model=SalesTransactionListResponse)
def list_sales_transactions(
    limit: int = Query(6, ge=1, le=100),
    offset: int = Query(0, ge=0),
    summary_from: datetime | None = Query(None),
    summary_to: datetime | None = Query(None),
    current_user: dict = Depends(get_current_user),
):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    try:
        result = (
            supabase_client.table("sales_transactions")
            .select("*", count="exact")
            .eq("company_id", current_user["company_id"])
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        summary = _load_sales_summary(current_user["company_id"], summary_from, summary_to)
    except Exception as e:
        if _table_missing_error(e):
            return {
                "data": [],
                "total": 0,
                "has_more": False,
                "summary": {
                    "revenue_by_currency": {},
                    "top_products": [],
                    "category_performance": [],
                    "daily_trends": [],
                },
            }
        raise HTTPException(status_code=500, detail=f"Failed to load sales transactions: {str(e)}")

    total = result.count or 0
    return {
        "data": result.data or [],
        "total": total,
        "has_more": offset + limit < total,
        "summary": summary,
    }


@router.post("", response_model=SalesTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_sales_transaction(
    transaction: SalesTransactionCreate,
    current_user: dict = Depends(get_current_user),
):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    item_count = sum(item.quantity for item in transaction.items)
    payload = {
        "transaction_code": _generate_transaction_code(),
        "company_id": current_user["company_id"],
        "total_amount": transaction.total_amount,
        "currency": transaction.currency,
        "item_count": item_count,
        "items": [item.model_dump() for item in transaction.items],
    }

    try:
        result = supabase_client.table("sales_transactions").insert(payload).execute()
    except Exception as e:
        if _table_missing_error(e):
            raise HTTPException(
                status_code=500,
                detail="Sales transactions table is missing. Run backend/sql/create_sales_transactions.sql in Supabase.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to record sales transaction: {str(e)}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to record sales transaction")

    return result.data[0]

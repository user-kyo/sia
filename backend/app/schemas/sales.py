from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class SalesTransactionItem(BaseModel):
    product_id: Optional[str] = None
    sku: Optional[str] = None
    name: str
    category: Optional[str] = None
    quantity: int = Field(..., ge=1)
    unit_price: float = Field(..., ge=0.0)
    line_total: float = Field(..., ge=0.0)
    currency: str = "PHP"


class SalesTransactionCreate(BaseModel):
    total_amount: float = Field(..., ge=0.0)
    currency: str = "PHP"
    items: list[SalesTransactionItem]


class SalesTransactionResponse(BaseModel):
    id: str
    transaction_code: str
    company_id: str
    total_amount: float
    currency: str = "PHP"
    item_count: int
    items: list[dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True


class SalesTopProduct(BaseModel):
    product_id: Optional[str] = None
    sku: Optional[str] = None
    name: str
    quantity: int
    revenue_by_currency: dict[str, float] = Field(default_factory=dict)


class SalesCategoryPerformance(BaseModel):
    category: str
    quantity: int
    revenue_by_currency: dict[str, float] = Field(default_factory=dict)


class SalesDailyTrend(BaseModel):
    date: str
    label: str
    orders: int
    revenue_by_currency: dict[str, float] = Field(default_factory=dict)


class SalesTransactionSummary(BaseModel):
    revenue_by_currency: dict[str, float] = Field(default_factory=dict)
    top_products: list[SalesTopProduct] = Field(default_factory=list)
    category_performance: list[SalesCategoryPerformance] = Field(default_factory=list)
    daily_trends: list[SalesDailyTrend] = Field(default_factory=list)


class SalesTransactionListResponse(BaseModel):
    data: list[SalesTransactionResponse]
    total: int
    has_more: bool
    summary: SalesTransactionSummary = Field(default_factory=SalesTransactionSummary)

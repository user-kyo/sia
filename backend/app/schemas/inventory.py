from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InventoryItemCreate(BaseModel):
    name: str = Field(..., description="Product name")
    sku: Optional[str] = Field(None, description="SKU — auto-generated if omitted")
    category: str = Field(..., description="Product category")
    quantity: int = Field(default=0, ge=0)
    price: float = Field(default=0.0, ge=0.0)
    currency: str = Field(default="PHP", description="ISO 4217 currency code the price is denominated in")
    reorder_point: int = Field(default=10, ge=0, description="Low-stock threshold")
    description: Optional[str] = None
    unit: str = Field(default="pcs")
    image_url: Optional[str] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0.0)
    currency: Optional[str] = None
    reorder_point: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None


class StockAdjustment(BaseModel):
    adjustment_type: str = Field(..., description="add | remove | set")
    quantity: int = Field(..., ge=0)
    note: Optional[str] = None


class InventoryItemResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    quantity: int
    price: float
    currency: str = "PHP"
    reorder_point: int
    description: Optional[str] = None
    unit: str
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryListResponse(BaseModel):
    data: list[InventoryItemResponse]
    total: int
    has_more: bool

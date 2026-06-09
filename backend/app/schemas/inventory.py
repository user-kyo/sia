from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InventoryItemBase(BaseModel):
    name: str = Field(..., description="The name of the inventory item")
    sku: str = Field(..., description="Stock Keeping Unit identifier")
    quantity: int = Field(default=0, ge=0, description="Current stock quantity")
    price: float = Field(default=0.0, ge=0.0, description="Price per unit")

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0.0)

class InventoryItemResponse(InventoryItemBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

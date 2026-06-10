from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class CategoryCreate(BaseModel):
    name: str = Field(..., description="Category name")
    icon: Optional[str] = Field("Package", description="Category icon name")

class CategoryUpdate(BaseModel):
    name: str = Field(..., description="Category name")
    icon: Optional[str] = Field("Package", description="Category icon name")

class CategoryResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    icon: str
    created_at: datetime

    class Config:
        from_attributes = True

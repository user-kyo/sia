from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class CategoryCreate(BaseModel):
    name: str = Field(..., description="Category name")

class CategoryResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

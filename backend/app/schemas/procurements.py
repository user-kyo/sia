# pyright: ignore[reportMissingImports]
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProcurementItem(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    line_total: float = Field(ge=0)
    currency: str = "PHP"

class ProcurementBase(BaseModel):
    supplier_id: str
    total_amount: float = Field(ge=0)
    currency: str = "PHP"
    status: Optional[str] = "draft"
    remarks: Optional[str] = None
    items: List[ProcurementItem] = Field(default_factory=list)

class ProcurementCreate(ProcurementBase):
    pass

class SubmitInvoiceRequest(BaseModel):
    items: List[ProcurementItem]
    invoice_url: str

class ProcurementUpdate(BaseModel):
    supplier_id: Optional[str] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    items: Optional[List[ProcurementItem]] = None

class ProcurementResponse(ProcurementBase):
    id: str
    company_id: str
    po_number: str
    requested_by: str
    cancel_reason: Optional[str] = None
    invoice_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

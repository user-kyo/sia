from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    company_id: str
    last_active: Optional[datetime] = None

class UserUpdateStatus(BaseModel):
    status: str = Field(..., description="Approved, Pending, or Revoked")

class UserUpdateRole(BaseModel):
    role: str = Field(..., description="super_admin, admin, or staff")

class UserInviteRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="staff")
    name: Optional[str] = None

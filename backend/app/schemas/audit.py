from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    company_id: str
    user_id: str
    username: str
    # Friendly display name resolved from the user's profile. Falls back to the
    # stored username when the user can no longer be found.
    name: Optional[str] = None
    action: str
    module: str
    description: str
    # Optional list of human-readable change strings (e.g. "cost 750 → 850")
    # shown in their own column on the audit log UI.
    changes: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

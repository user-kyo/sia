# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Depends
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.db.supabase import supabase_client
from app.api.deps import get_current_user

router = APIRouter()

class NotificationResponse(BaseModel):
    id: str
    company_id: str
    type: str
    title: str
    message: str
    metadata: Optional[dict] = None
    is_read: bool
    is_dismissed: bool
    created_at: datetime

@router.get("", response_model=List[NotificationResponse])
def get_notifications(current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    result = supabase_client.table("notifications")\
        .select("*")\
        .eq("company_id", current_user["company_id"])\
        .eq("is_dismissed", False)\
        .order("created_at", desc=True)\
        .execute()
        
    return result.data

@router.put("/{notification_id}/read")
def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    result = supabase_client.table("notifications")\
        .update({"is_read": True})\
        .eq("id", notification_id)\
        .eq("company_id", current_user["company_id"])\
        .execute()
        
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return result.data[0]

@router.put("/read-all")
def mark_all_read(current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    result = supabase_client.table("notifications")\
        .update({"is_read": True})\
        .eq("company_id", current_user["company_id"])\
        .eq("is_read", False)\
        .execute()
        
    return {"message": "All notifications marked as read"}

@router.put("/{notification_id}/dismiss")
def dismiss_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    result = supabase_client.table("notifications")\
        .update({"is_dismissed": True})\
        .eq("id", notification_id)\
        .eq("company_id", current_user["company_id"])\
        .execute()
        
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return result.data[0]

@router.put("/dismiss-all")
def dismiss_all_notifications(current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    result = supabase_client.table("notifications")\
        .update({"is_dismissed": True})\
        .eq("company_id", current_user["company_id"])\
        .eq("is_dismissed", False)\
        .execute()
        
    return {"message": "All notifications dismissed"}

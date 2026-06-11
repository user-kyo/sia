from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ...deps import get_current_user
from ....core.mailer import send_security_email

router = APIRouter()

class SecurityEventRequest(BaseModel):
    event_type: str

@router.post("/notify-security")
def notify_security_event(request: SecurityEventRequest, current_user: dict = Depends(get_current_user)):
    """
    Trigger a security email notification (e.g. password_changed).
    """
    valid_events = ["password_changed"]
    
    if request.event_type not in valid_events:
        raise HTTPException(status_code=400, detail="Invalid event type")

    # Get user email
    user_email = current_user.get("email")
    if not user_email:
        raise HTTPException(status_code=400, detail="User email not found")

    # Send the email
    success = send_security_email(to_email=user_email, event_type=request.event_type)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send notification email. Please check server logs.")
        
    return {"message": "Notification sent successfully"}

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import supabase_client

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the Supabase JWT and returns the user object,
    including their company_id from user_metadata.
    """
    token = credentials.credentials
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    try:
        # Verify the JWT token with Supabase Auth
        response = supabase_client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = response.user
        company_id = user.user_metadata.get("company_id")
        
        if not company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not belong to any company."
            )
            
        return {
            "id": user.id,
            "email": user.email,
            "role": user.user_metadata.get("role"),
            "company_id": company_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

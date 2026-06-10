from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.db.supabase import supabase_client

router = APIRouter()

class CompanyResponse(BaseModel):
    id: str
    name: str
    created_at: datetime

class CompanyCreateRequest(BaseModel):
    company_name: str = Field(..., min_length=2)
    admin_name: str = Field(..., min_length=2)
    admin_email: str
    admin_password: str = Field(..., min_length=6)

@router.get("", response_model=List[CompanyResponse])
def get_companies():
    """Get all companies for the registration dropdown."""
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    result = supabase_client.table("companies").select("id, name, created_at").order("name").execute()
    
    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))
        
    return result.data

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(request: CompanyCreateRequest):
    """Create a company and seed the initial super_admin account."""
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    # Check if company name already exists
    existing_company = supabase_client.table("companies").select("id").ilike("name", request.company_name).execute()
    if existing_company.data and len(existing_company.data) > 0:
        raise HTTPException(status_code=409, detail=f"Company name '{request.company_name}' is already taken.")
        
    # 1. Create the company
    try:
        company_result = supabase_client.table("companies").insert({
            "name": request.company_name
        }).execute()
        
        if not company_result.data:
            raise HTTPException(status_code=500, detail="Failed to create company")
            
        company = company_result.data[0]
        company_id = company["id"]
    except Exception as e:
        error_str = str(e)
        if "23505" in error_str:
            raise HTTPException(status_code=409, detail=f"Company name '{request.company_name}' is already taken.")
        raise HTTPException(status_code=500, detail=f"Database error creating company: {error_str}")

    # 2. Create the super_admin user
    try:
        # Note: auth.admin.create_user requires the service_role key to be configured in Supabase client
        # which should be the case if SUPABASE_KEY in .env is the service role key.
        user_response = supabase_client.auth.admin.create_user({
            "email": request.admin_email,
            "password": request.admin_password,
            "email_confirm": True, # Automatically confirm email
            "user_metadata": {
                "full_name": request.admin_name,
                "role": "super_admin",
                "status": "approved", # Automatically approve super admin
                "company_id": company_id
            }
        })
    except Exception as e:
        # If user creation fails, we should ideally rollback the company creation
        supabase_client.table("companies").delete().eq("id", company_id).execute()
        
        error_msg = str(e).lower()
        if "already registered" in error_msg or "already exists" in error_msg:
            raise HTTPException(status_code=400, detail="Email is already registered.")
        if "password" in error_msg:
            raise HTTPException(status_code=400, detail="Password is too weak or invalid.")
            
        raise HTTPException(status_code=500, detail=f"Failed to create super admin account: {str(e)}")
        
    return company

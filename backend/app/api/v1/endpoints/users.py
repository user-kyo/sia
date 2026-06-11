from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.db.supabase import supabase_client
from app.api.deps import get_current_user
from app.schemas.users import UserResponse, UserUpdateStatus, UserUpdateRole, UserInviteRequest

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def get_users(current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    result = supabase_client.table("users_view").select("*").eq("company_id", current_user["company_id"]).execute()
    
    if hasattr(result, "error") and result.error:
        # If the view doesn't exist yet, return a clean error
        if "relation \"public.users_view\" does not exist" in str(result.error):
            raise HTTPException(status_code=500, detail="Database view 'users_view' is missing. Please run the SQL migration script.")
        raise HTTPException(status_code=400, detail=str(result.error))
        
    return result.data

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    result = supabase_client.table("users_view").select("*").eq("id", user_id).execute()
    
    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=400, detail=str(result.error))
        
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user = result.data[0]
    
    # Security: Ensure user belongs to the same company
    if user["company_id"] != current_user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
        
    return user

@router.put("/{user_id}/status", response_model=UserResponse)
def update_user_status(user_id: str, request: UserUpdateStatus, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    # Security: Ensure current_user is admin or super_admin
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update user status")
        
    # Ensure target user belongs to same company
    target = supabase_client.table("profiles").select("company_id").eq("id", user_id).execute()
    if not target.data or target.data[0]["company_id"] != current_user["company_id"]:
        raise HTTPException(status_code=404, detail="User not found in your company")
        
    # Update profile status
    update_res = supabase_client.table("profiles").update({"status": request.status}).eq("id", user_id).execute()
    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to update status")
        
    # Also update the user's auth metadata so it reflects in JWT
    try:
        # We need to fetch current metadata first so we don't overwrite other fields
        user_data = supabase_client.auth.admin.get_user_by_id(user_id)
        current_meta = user_data.user.user_metadata if user_data and user_data.user else {}
        current_meta["status"] = request.status
        supabase_client.auth.admin.update_user_by_id(user_id, {"user_metadata": current_meta})
    except Exception as e:
        print(f"Warning: Failed to update auth metadata for status: {e}")
        
    # Fetch updated view record
    res = supabase_client.table("users_view").select("*").eq("id", user_id).execute()
    return res.data[0]

@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: str, request: UserUpdateRole, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    # Security: Ensure current_user is super_admin
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can change user roles")
        
    # Ensure target user belongs to same company
    target = supabase_client.table("profiles").select("company_id").eq("id", user_id).execute()
    if not target.data or target.data[0]["company_id"] != current_user["company_id"]:
        raise HTTPException(status_code=404, detail="User not found in your company")
        
    # Update profile role
    update_res = supabase_client.table("profiles").update({"role": request.role}).eq("id", user_id).execute()
    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to update role")
        
    # Also update the user's auth metadata so it reflects in JWT
    try:
        user_data = supabase_client.auth.admin.get_user_by_id(user_id)
        current_meta = user_data.user.user_metadata if user_data and user_data.user else {}
        current_meta["role"] = request.role
        supabase_client.auth.admin.update_user_by_id(user_id, {"user_metadata": current_meta})
    except Exception as e:
        print(f"Warning: Failed to update auth metadata for role: {e}")
        
    # Fetch updated view record
    res = supabase_client.table("users_view").select("*").eq("id", user_id).execute()
    return res.data[0]

@router.post("/{user_id}/transfer-ownership", response_model=UserResponse)
def transfer_ownership(user_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    # Security: Ensure current_user is super_admin
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can transfer ownership")
        
    # Ensure target user belongs to same company
    target = supabase_client.table("profiles").select("company_id, status").eq("id", user_id).execute()
    if not target.data or target.data[0]["company_id"] != current_user["company_id"]:
        raise HTTPException(status_code=404, detail="User not found in your company")
        
    if target.data[0]["status"] != "approved":
        raise HTTPException(status_code=400, detail="Cannot transfer ownership to a user who is not approved")

    # 1. Promote target user to super_admin
    supabase_client.table("profiles").update({"role": "super_admin"}).eq("id", user_id).execute()
    try:
        user_data = supabase_client.auth.admin.get_user_by_id(user_id)
        current_meta = user_data.user.user_metadata if user_data and user_data.user else {}
        current_meta["role"] = "super_admin"
        supabase_client.auth.admin.update_user_by_id(user_id, {"user_metadata": current_meta})
    except Exception as e:
        print(f"Warning: Failed to update auth metadata for new super admin: {e}")

    # 2. Demote current user to admin
    supabase_client.table("profiles").update({"role": "admin"}).eq("id", current_user["id"]).execute()
    try:
        current_user_data = supabase_client.auth.admin.get_user_by_id(current_user["id"])
        my_meta = current_user_data.user.user_metadata if current_user_data and current_user_data.user else {}
        my_meta["role"] = "admin"
        supabase_client.auth.admin.update_user_by_id(current_user["id"], {"user_metadata": my_meta})
    except Exception as e:
        print(f"Warning: Failed to update auth metadata for demoted super admin: {e}")

    # Fetch updated view record for the target user
    res = supabase_client.table("users_view").select("*").eq("id", user_id).execute()
    return res.data[0]

@router.post("/invite", response_model=UserResponse)
def invite_user(request: UserInviteRequest, current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    # Security: Ensure current_user is admin or super_admin
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to invite users")

    # Super Admins can invite anyone up to Admin. Admins can only invite Staff.
    if current_user.get("role") == "admin" and request.role != "staff":
        raise HTTPException(status_code=403, detail="Admins can only invite staff members")
    if current_user.get("role") == "super_admin" and request.role == "super_admin":
        raise HTTPException(status_code=400, detail="Cannot invite a user directly as super_admin. Transfer ownership instead.")

    # Check if user already exists
    existing_user = supabase_client.table("users_view").select("id").eq("email", request.email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    try:
        # Prepare metadata for the handle_new_user trigger
        user_meta_data = {
            "role": request.role,
            "status": "pending",
            "company_id": current_user["company_id"],
        }
        if request.name:
            user_meta_data["full_name"] = request.name

        # Invite the user via Supabase Auth Admin API
        response = supabase_client.auth.admin.invite_user_by_email(
            request.email,
            options={"data": user_meta_data}
        )
        
        # Wait for the trigger to insert the profile, then fetch the view
        # We need to use the newly created user's ID
        new_user_id = response.user.id
        
        # In a real async environment we might need a small delay for the trigger, 
        # but Supabase functions typically run synchronously within the transaction.
        res = supabase_client.table("users_view").select("*").eq("id", new_user_id).execute()
        if not res.data:
            # Fallback if view hasn't updated yet (sometimes true for instant read-after-write with triggers)
            return {
                "id": new_user_id,
                "name": request.name or "",
                "email": request.email,
                "role": request.role,
                "status": "pending",
                "company_id": current_user["company_id"]
            }
            
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

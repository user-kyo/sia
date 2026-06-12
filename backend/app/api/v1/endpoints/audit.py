from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from app.schemas.audit import AuditLogResponse
from app.db.supabase import supabase_client
from app.api.deps import get_current_user

router = APIRouter()


def _cutoff_iso(days: int) -> str:
    """ISO timestamp for 'days' ago in UTC, used to scope queries to a window."""
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def _check_admin(user: dict):
    if user.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")


def _check_super_admin(user: dict):
    # Deleting audit logs destroys the accountability trail, so it is reserved
    # for the company owner (super_admin) only.
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Only the owner can delete audit logs")


def _prettify_email(value: str) -> str:
    """Turn an email like 'super.admin@lc.com' into 'Super Admin' as a last
    resort when no real name is available."""
    if not value:
        return "Unknown User"
    local = value.split("@")[0]
    words = [w for w in local.replace(".", " ").replace("_", " ").replace("-", " ").split() if w]
    if not words:
        return value
    return " ".join(word.capitalize() for word in words)


def _resolve_display_name(log: dict, names_by_id: dict) -> str:
    """Prefer the user's current profile name, then a stored non-email
    username, then a prettified email."""
    profile_name = names_by_id.get(log.get("user_id"))
    if profile_name:
        return profile_name
    stored = log.get("username") or ""
    if stored and "@" not in stored:
        return stored
    return _prettify_email(stored)


def _table_missing_error(error: Exception) -> bool:
    message = str(error).lower()
    return "audit_logs" in message and (
        "schema cache" in message
        or "does not exist" in message
        or "could not find" in message
    )


@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    search: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    days: Optional[int] = Query(None, ge=1, description="Only logs from the last N days"),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    _check_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    q = supabase_client.table("audit_logs").select("*").eq("company_id", current_user["company_id"])
    if action:
        q = q.eq("action", action)
    if module:
        q = q.eq("module", module)
    if search:
        q = q.ilike("description", f"%{search}%")
    if days:
        q = q.gte("created_at", _cutoff_iso(days))

    try:
        result = q.order("created_at", desc=True).limit(limit).execute()
    except Exception as error:
        if _table_missing_error(error):
            raise HTTPException(
                status_code=500,
                detail="Table 'audit_logs' is missing. Please run the SQL migration script.",
            )
        raise

    logs = result.data or []

    # Resolve current display names so the feed shows people, not raw emails.
    names_by_id: dict = {}
    try:
        users_res = (
            supabase_client.table("users_view")
            .select("id, name")
            .eq("company_id", current_user["company_id"])
            .execute()
        )
        names_by_id = {
            u["id"]: u["name"]
            for u in (users_res.data or [])
            if u.get("name")
        }
    except Exception as error:  # users_view may be missing; degrade gracefully
        print(f"Failed to resolve audit log display names: {error}")

    for log in logs:
        log["name"] = _resolve_display_name(log, names_by_id)

    return logs


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_audit_logs(
    days: Optional[int] = Query(None, ge=1, description="Only delete logs from the last N days; omit to delete all"),
    current_user: dict = Depends(get_current_user),
):
    _check_super_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    q = supabase_client.table("audit_logs").delete().eq("company_id", current_user["company_id"])
    if days:
        q = q.gte("created_at", _cutoff_iso(days))
    q.execute()
    return None


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audit_log(log_id: str, current_user: dict = Depends(get_current_user)):
    _check_super_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    existing = (
        supabase_client.table("audit_logs")
        .select("id")
        .eq("id", log_id)
        .eq("company_id", current_user["company_id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Audit log not found")

    supabase_client.table("audit_logs").delete().eq("id", log_id).eq(
        "company_id", current_user["company_id"]
    ).execute()
    return None

from app.db.supabase import supabase_client

def log_audit_event(company_id: str, user_id: str, username: str, action: str, module: str, description: str):
    if not supabase_client:
        return
    try:
        supabase_client.table("audit_logs").insert({
            "company_id": company_id,
            "user_id": user_id,
            "username": username,
            "action": action,
            "module": module,
            "description": description
        }).execute()
    except Exception as e:
        print(f"Failed to log audit event: {e}")

from app.db.supabase import supabase_client

def log_audit_event(company_id: str, user_id: str, username: str, action: str, module: str, description: str, changes=None):
    if not supabase_client:
        return

    payload = {
        "company_id": company_id,
        "user_id": user_id,
        "username": username,
        "action": action,
        "module": module,
        "description": description,
    }
    if changes:
        payload["changes"] = changes

    try:
        supabase_client.table("audit_logs").insert(payload).execute()
    except Exception as e:
        # The optional 'changes' column may not exist yet — retry without it so
        # the event is still recorded rather than lost entirely.
        if "changes" in payload:
            payload.pop("changes")
            try:
                supabase_client.table("audit_logs").insert(payload).execute()
                return
            except Exception as e2:
                print(f"Failed to log audit event: {e2}")
                return
        print(f"Failed to log audit event: {e}")


def log_action(current_user: dict, action: str, module: str, description: str, changes=None):
    """Convenience wrapper that derives the actor fields from the current user.

    `changes` is an optional list of human-readable change strings
    (e.g. ["cost 750 → 850"]) stored separately so the UI can show them
    in their own column. Never raises — auditing must not break the action
    it is recording.
    """
    log_audit_event(
        company_id=current_user.get("company_id"),
        user_id=current_user.get("id"),
        username=current_user.get("name") or current_user.get("email", "unknown"),
        action=action,
        module=module,
        description=description,
        changes=changes,
    )

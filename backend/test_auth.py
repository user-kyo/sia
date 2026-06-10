import asyncio
from app.db.supabase import supabase_client

async def test():
    help(supabase_client.auth.admin.invite_user_by_email)

if __name__ == "__main__":
    asyncio.run(test())

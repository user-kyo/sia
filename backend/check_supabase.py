import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("SUPABASE_URL="):
                url = line.split("=")[1].strip()
            elif line.startswith("SUPABASE_KEY="):
                key = line.split("=")[1].strip()

supabase = create_client(url, key)
response = supabase.table("inventory").select("*").limit(1).execute()
print(response.data)

import os
import json
import urllib.request
from urllib.error import HTTPError

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    with open("/app/.env", "r") as f:
        for line in f:
            if line.startswith("SUPABASE_URL="): url = line.split("=")[1].strip()
            if line.startswith("SUPABASE_KEY="): key = line.split("=")[1].strip()

# Create bucket
try:
    data = json.dumps({"id": "product-images", "name": "product-images", "public": True}).encode("utf-8")
    req = urllib.request.Request(f"{url}/storage/v1/bucket", data=data, headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")
    urllib.request.urlopen(req)
    print("Bucket created successfully.")
except HTTPError as e:
    if e.code == 400 and b"already exists" in e.read():
        print("Bucket already exists.")
    else:
        raise

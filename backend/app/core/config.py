import os
from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sales Inventory Analysis API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5199",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
        "https://sia-system.vercel.app",
    ]

    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

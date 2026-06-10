from fastapi import APIRouter
from app.api.v1.endpoints import inventory, categories, companies, users, brands

api_router = APIRouter()
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(brands.router, prefix="/brands", tags=["brands"])

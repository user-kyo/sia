from fastapi import APIRouter
from app.api.v1.endpoints import inventory, categories

api_router = APIRouter()
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])

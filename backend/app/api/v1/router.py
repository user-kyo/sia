# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from app.api.v1.endpoints import inventory, categories, companies, users, brands, auth, sales, suppliers, procurements, audit
from app.api.v1.endpoints import inventory, categories, companies, users, brands, auth, sales, suppliers, procurements, notifications, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(brands.router, prefix="/brands", tags=["brands"])
api_router.include_router(sales.router, prefix="/sales-transactions", tags=["sales-transactions"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(procurements.router, prefix="/procurements", tags=["procurements"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

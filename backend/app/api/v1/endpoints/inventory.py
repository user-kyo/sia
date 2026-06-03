from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_inventory():
    return {"message": "Inventory endpoint placeholder"}

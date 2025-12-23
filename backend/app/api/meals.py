from fastapi import APIRouter
from app.controllers import meal_controller

router = APIRouter()
router.include_router(meal_controller.router, prefix="")


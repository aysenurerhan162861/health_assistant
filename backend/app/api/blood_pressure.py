from fastapi import APIRouter
from app.controllers import blood_pressure_controller

router = APIRouter()
router.include_router(blood_pressure_controller.router, prefix="")


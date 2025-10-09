from fastapi import APIRouter
from app.controllers import doctor_controller

router = APIRouter()
router.include_router(doctor_controller.router, prefix="")

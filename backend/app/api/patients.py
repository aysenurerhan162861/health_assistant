from fastapi import APIRouter
from app.controllers import patient_controller

router = APIRouter()
router.include_router(patient_controller.router, prefix="")

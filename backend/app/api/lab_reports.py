from fastapi import APIRouter
from app.controllers import lab_report_controller

router = APIRouter()
router.include_router(lab_report_controller.router, prefix="")

from fastapi import APIRouter
from app.controllers import step_record_controller

router = APIRouter()
router.include_router(step_record_controller.router, prefix="")

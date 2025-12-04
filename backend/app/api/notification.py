from fastapi import APIRouter
from app.controllers import notification_controller

router = APIRouter()
router.include_router(notification_controller.router, prefix="")

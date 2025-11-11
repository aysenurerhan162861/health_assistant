from fastapi import APIRouter
from app.controllers import assistant_controller

router = APIRouter()
router.include_router(assistant_controller.router, prefix="")

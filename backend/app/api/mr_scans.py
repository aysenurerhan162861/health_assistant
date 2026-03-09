from fastapi import APIRouter
from app.controllers import mr_controller

router = APIRouter()
router.include_router(mr_controller.router, prefix="")
from fastapi import APIRouter
from app.controllers import chat_socket_controller

router = APIRouter()
router.include_router(chat_socket_controller.router, prefix="")

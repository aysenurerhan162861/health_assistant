# backend/app/api/chat.py
from fastapi import APIRouter
from app.controllers import chat_controller

router = APIRouter()
router.include_router(chat_controller.router, prefix="")


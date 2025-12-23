# backend/app/controllers/chat_controller.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import traceback
from app.database import get_db
from app.services.user_service import get_current_user
from app.models.user import User
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.chat_service import (
    get_patient_health_summary,
    format_health_summary_for_ai,
    get_chat_history,
    save_chat_message,
)
from app.gemini_client import get_chat_response

router = APIRouter(tags=["Chat"])


@router.post("/send", response_model=ChatResponse)
def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcı mesajını alır, sağlık verilerini toplar ve AI'dan cevap alır.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mesaj boş olamaz."
        )
    
    try:
        # 1. Kullanıcının sağlık verilerini topla ve özetle
        health_summary = get_patient_health_summary(db, current_user.id)
        formatted_summary = format_health_summary_for_ai(health_summary)
        
        # 2. Önceki sohbet geçmişini al
        chat_history = get_chat_history(db, current_user.id, limit=10)
        
        # 3. AI'dan cevap al
        ai_response = get_chat_response(
            user_message=request.message.strip(),
            health_summary=formatted_summary,
            chat_history=chat_history,
        )
        
        # 4. Mesajı veritabanına kaydet
        chat_message = save_chat_message(
            db=db,
            user_id=current_user.id,
            message=request.message.strip(),
            response=ai_response,
        )
        
        return ChatResponse(
            id=chat_message.id,
            user_id=chat_message.user_id,
            message=chat_message.message,
            response=chat_message.response,
            created_at=chat_message.created_at,
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Detaylı hata loglama
        error_traceback = traceback.format_exc()
        print(f"Chat servisi hatası: {str(e)}")
        print(f"Traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat servisi hatası: {str(e)}"
        )


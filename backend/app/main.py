from fastapi import FastAPI
from app.api import users, doctors, patients, assistants, lab_reports, notification, chat_socket, meals, blood_pressure, chat
from app.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.staticfiles import StaticFiles
from app.api import gemini_api

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploads/lab_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users")
app.include_router(doctors.router, prefix="/api/doctors")
app.include_router(patients.router, prefix="/api/patients")
app.include_router(assistants.router, prefix="/api/assistants")
app.include_router(lab_reports.router, prefix="/api/lab_reports")
app.include_router(meals.router, prefix="/api/meals")
app.include_router(blood_pressure.router, prefix="/api/blood_pressure")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(gemini_api.router, prefix="/api/gemini_api")
app.include_router(notification.router, prefix="/api/notification")
app.include_router(chat_socket.router, prefix="")
app.include_router(chat.router, prefix="/api/chat")

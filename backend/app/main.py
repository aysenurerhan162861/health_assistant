from fastapi import FastAPI
from app.api import users, doctors, patients, assistants, lab_reports, notification
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users")
app.include_router(doctors.router, prefix="/api/doctors")
app.include_router(patients.router, prefix="/api/patients")
app.include_router(assistants.router, prefix="/api/assistants")
app.include_router(lab_reports.router, prefix="/api/lab_reports")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(gemini_api.router, prefix="/api/gemini_api")
app.include_router(notification.router, prefix="/api/notification")
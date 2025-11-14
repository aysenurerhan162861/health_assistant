from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os

# Docker ortamında çalışacak şekilde DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dev:dev@postgres:5432/healthapp")

# SQLAlchemy engine ve session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class
Base = declarative_base()

# Dependency: FastAPI endpointlerinde kullanmak için
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# database.py içinde en alta ekle
from app.models import user, doctor_patient, doctor_team, lab_report, assistant_patient_permission


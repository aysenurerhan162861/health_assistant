from fastapi import FastAPI
from app.api import users, doctors, patients, assistants, lab_reports
from app.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

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


from fastapi import APIRouter
from pydantic import BaseModel
from app.gemini_client import get_health_comment

router = APIRouter()

class TestResults(BaseModel):
    testResults: list

@router.post("/comment")
def generate_comment(data: TestResults):
    comment = get_health_comment(data.testResults)
    return {"comment": comment}

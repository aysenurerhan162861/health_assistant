from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class LabTest(Base):
    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True, index=True)
    lab_report_id = Column(Integer, ForeignKey("lab_reports.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    normal_range = Column(String, nullable=True)
    viewed_by_doctor = Column(Boolean, default=False)

    lab_report = relationship("LabReport", back_populates="tests")

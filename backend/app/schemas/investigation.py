from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any
from app.schemas.attack import AttackResponse

class InvestigationNoteBase(BaseModel):
    content: str

class InvestigationNoteCreate(InvestigationNoteBase):
    pass

class InvestigationNoteResponse(InvestigationNoteBase):
    id: int
    investigation_id: int
    author: str
    timestamp: datetime

    class Config:
        from_attributes = True

class InvestigationStatusUpdate(BaseModel):
    status: str

class InvestigationBase(BaseModel):
    attack_id: int
    ai_analysis: Optional[Any] = None

class InvestigationCreate(InvestigationBase):
    pass

class InvestigationResponse(InvestigationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: str
    analyst_id: Optional[int]
    notes: List[InvestigationNoteResponse] = []
    attack: Optional[AttackResponse] = None

    class Config:
        from_attributes = True

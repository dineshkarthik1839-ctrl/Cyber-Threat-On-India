from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AttackBase(BaseModel):
    indicator: str
    indicator_type: str
    source: str
    source_country: Optional[str] = "Unknown"
    source_country_code: Optional[str] = "--"
    target_country: Optional[str] = "India"
    target_state: Optional[str] = "Unspecified"
    attack_type: Optional[str] = "Suspicious Activity"
    severity: Optional[str] = "Medium"
    confidence: Optional[int] = 50
    mitre_tactic: Optional[str] = "T0000"
    description: Optional[str] = ""
    is_confirmed_india_target: Optional[bool] = False

class AttackCreate(AttackBase):
    timestamp: Optional[datetime] = None

class AttackResponse(AttackBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Schemas for API dashboard aggregates
class CountryStats(BaseModel):
    country: str
    code: str
    count: int

class StateStats(BaseModel):
    state: str
    count: int
    share: float

class TimelineStats(BaseModel):
    time: str
    attacks: int

class SeverityStats(BaseModel):
    severity: str
    count: int
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AttackBase(BaseModel):
    indicator: str
    indicator_type: str
    source: str
    source_type: Optional[str] = "INTELLIGENCE"
    event_classification: Optional[str] = "LIVE_INTELLIGENCE"
    source_country: Optional[str] = "Unknown"
    source_country_code: Optional[str] = "--"
    source_asn: Optional[str] = None
    source_organization: Optional[str] = None
    source_latitude: Optional[float] = None
    source_longitude: Optional[float] = None
    sensor_id: Optional[str] = None
    destination_ip: Optional[str] = None
    destination_port: Optional[int] = None
    destination_protocol: Optional[str] = None
    target_country: Optional[str] = "India"
    target_state: Optional[str] = "Unspecified"
    target_city: Optional[str] = None
    attack_type: Optional[str] = "Suspicious Activity"
    severity: Optional[str] = "Medium"
    confidence: Optional[int] = 50
    risk_score: Optional[int] = None
    mitre_tactic: Optional[str] = "T0000"
    description: Optional[str] = ""
    classification_reason: Optional[str] = None
    raw_event_reference: Optional[str] = None
    is_confirmed_india_target: Optional[bool] = False


class AttackCreate(AttackBase):
    timestamp: Optional[datetime] = None


class AttackResponse(AttackBase):
    id: int
    event_uuid: Optional[str] = None
    timestamp: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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
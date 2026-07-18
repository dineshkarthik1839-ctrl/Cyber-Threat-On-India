from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SensorCreate(BaseModel):
    name: str
    location_country: Optional[str] = "India"
    location_state: str
    location_city: Optional[str] = None
    public_ip: Optional[str] = None
    provider: Optional[str] = None
    sensor_type: Optional[str] = "honeypot"


class SensorResponse(BaseModel):
    id: int
    sensor_uuid: str
    name: str
    location_country: str
    location_state: str
    location_city: Optional[str] = None
    public_ip: Optional[str] = None
    provider: Optional[str] = None
    sensor_type: str
    status: str
    events_today: int
    last_seen: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SensorTokenResponse(BaseModel):
    sensor: SensorResponse
    api_token: str  # Only returned once upon registration


class SensorEventIngest(BaseModel):
    timestamp: Optional[datetime] = None
    source_ip: str
    destination_port: Optional[int] = None
    protocol: Optional[str] = "tcp"
    event_type: str
    raw_payload: Optional[str] = None


class SensorHeartbeat(BaseModel):
    status: Optional[str] = "ONLINE"

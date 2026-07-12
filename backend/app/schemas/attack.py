from pydantic import BaseModel
from datetime import datetime

class AttackBase(BaseModel):
    source_country: str
    target_country: str
    target_state: str
    attack_type: str
    severity: str
    source_ip: str
    destination_ip: str
    port: int


class AttackCreate(AttackBase):
    pass


class AttackResponse(AttackBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
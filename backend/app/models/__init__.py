from pydantic import BaseModel
from datetime import datetime

class Attack(BaseModel):
    id: int
    timestamp: datetime
    source_country: str
    target_country: str
    target_state: str
    attack_type: str
    severity: str
    source_ip: str
    destination_ip: str
    port: int
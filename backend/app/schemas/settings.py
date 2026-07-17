from pydantic import BaseModel
from typing import Optional

class CollectorSettings(BaseModel):
    abuseipdb_enabled: bool = True
    otx_enabled: bool = True
    threatfox_enabled: bool = True
    urlhaus_enabled: bool = True
    cisa_enabled: bool = True
    abuseipdb_key: Optional[str] = ""
    otx_key: Optional[str] = ""
    poll_interval_minutes: int = 10
    simulation_mode: bool = True

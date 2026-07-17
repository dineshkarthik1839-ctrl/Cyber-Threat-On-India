from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.database.database import Base

class Attack(Base):
    __tablename__ = "attacks"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    indicator = Column(String(500), nullable=False)
    indicator_type = Column(String(50), nullable=False)  # ip, domain, url, hash, cve
    source = Column(String(50), nullable=False)          # abuseipdb, otx, threatfox, urlhaus, cisa
    source_country = Column(String(100), default="Unknown")
    source_country_code = Column(String(10), default="--")
    target_country = Column(String(100), default="India")
    target_state = Column(String(100), default="Unspecified")
    attack_type = Column(String(150), default="Suspicious Activity")
    severity = Column(String(50), default="Medium")
    confidence = Column(Integer, default=50)
    mitre_tactic = Column(String(100), default="T0000")
    description = Column(String(2000), default="")
    is_confirmed_india_target = Column(Boolean, default=False)
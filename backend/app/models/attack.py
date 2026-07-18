from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from datetime import datetime
import uuid
from app.database.database import Base


class Attack(Base):
    __tablename__ = "attacks"

    id = Column(Integer, primary_key=True, index=True)
    event_uuid = Column(String(64), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # === Source Classification (CRITICAL: explicit, never inferred from strings) ===
    source_type = Column(String(50), default="INTELLIGENCE", index=True)
    # Values: SIMULATOR, INTELLIGENCE, SENSOR
    event_classification = Column(String(80), default="LIVE_INTELLIGENCE", index=True)
    # Values: SIMULATED, LIVE_INTELLIGENCE, INDIA_RELEVANT_INTELLIGENCE,
    #         LIVE_SENSOR, CONFIRMED_INDIA_TARGET

    # === Indicator / Source ===
    indicator = Column(String(500), nullable=False)
    indicator_type = Column(String(50), nullable=False)  # ip, domain, url, hash, cve
    source = Column(String(50), nullable=False)           # abuseipdb, otx, threatfox, urlhaus, cisa, simulator, sensor
    source_country = Column(String(100), default="Unknown")
    source_country_code = Column(String(10), default="--")
    source_asn = Column(String(100), nullable=True)
    source_organization = Column(String(200), nullable=True)
    source_latitude = Column(Float, nullable=True)
    source_longitude = Column(Float, nullable=True)

    # === Sensor Context ===
    sensor_id = Column(String(64), nullable=True, index=True)

    # === Destination / Target ===
    destination_ip = Column(String(100), nullable=True)
    destination_port = Column(Integer, nullable=True)
    destination_protocol = Column(String(20), nullable=True)
    target_country = Column(String(100), default="India")
    target_state = Column(String(100), default="Unspecified")
    target_city = Column(String(100), nullable=True)

    # === Threat Classification ===
    attack_type = Column(String(150), default="Suspicious Activity")
    severity = Column(String(50), default="Medium")
    confidence = Column(Integer, default=50)
    risk_score = Column(Integer, nullable=True)
    mitre_tactic = Column(String(100), default="T0000")
    description = Column(String(2000), default="")
    classification_reason = Column(String(500), nullable=True)
    raw_event_reference = Column(String(500), nullable=True)

    # === Verification ===
    is_confirmed_india_target = Column(Boolean, default=False)

    # === Timestamps ===
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
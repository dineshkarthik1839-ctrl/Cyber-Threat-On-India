from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
import uuid
from app.database.database import Base


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    sensor_uuid = Column(String(64), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False, unique=True)
    api_token_hash = Column(String(255), nullable=False)

    # Registered location (authoritative — never trust client-supplied location)
    location_country = Column(String(100), default="India")
    location_state = Column(String(100), nullable=False)
    location_city = Column(String(100), nullable=True)

    public_ip = Column(String(100), nullable=True)
    provider = Column(String(200), nullable=True)
    sensor_type = Column(String(50), default="honeypot")  # honeypot, ids, firewall, custom
    status = Column(String(50), default="OFFLINE")        # ONLINE, DEGRADED, OFFLINE

    events_today = Column(Integer, default=0)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

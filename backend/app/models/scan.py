from sqlalchemy import Column, String, Integer, DateTime, JSON, Float, Boolean, Text
from datetime import datetime
import uuid
from app.database.database import Base

class DomainScan(Base):
    __tablename__ = "domain_scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_uuid = Column(String(64), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    domain = Column(String(255), index=True, nullable=False)
    
    # Overview
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False) # Critical, High, Medium, Low
    
    # Intelligence Data
    ip_addresses = Column(JSON, default=list) # List of resolved IPs
    dns_records = Column(JSON, default=dict)
    ssl_info = Column(JSON, default=dict)
    security_headers = Column(JSON, default=dict)
    otx_pulses = Column(Integer, default=0)
    
    # Flags
    has_malicious_reputation = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # The full raw JSON response cached
    raw_data = Column(JSON, default=dict)

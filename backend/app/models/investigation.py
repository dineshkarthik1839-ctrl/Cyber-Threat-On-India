from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    attack_id = Column(Integer, ForeignKey("attacks.id"), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(50), default="NEW") # NEW, TRIAGE, INVESTIGATING, MONITORING, RESOLVED, FALSE POSITIVE
    analyst_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Store dynamic AI analysis or custom IOC mapping directly on the investigation
    ai_analysis = Column(JSON, nullable=True) 
    
    # Relationships
    attack = relationship("Attack", backref="investigation")
    notes = relationship("InvestigationNote", back_populates="investigation", cascade="all, delete-orphan")


class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"))
    author = Column(String(100), default="Analyst")
    timestamp = Column(DateTime, default=datetime.utcnow)
    content = Column(Text, nullable=False)

    investigation = relationship("Investigation", back_populates="notes")

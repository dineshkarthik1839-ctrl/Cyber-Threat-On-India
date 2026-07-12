from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


class Attack(Base):

    __tablename__ = "attacks"

    id = Column(Integer, primary_key=True, index=True)

    timestamp = Column(DateTime, default=datetime.utcnow)

    source_country = Column(String(100))

    target_country = Column(String(100))

    target_state = Column(String(100))

    attack_type = Column(String(100))

    severity = Column(String(50))

    source_ip = Column(String(50))

    destination_ip = Column(String(50))

    port = Column(Integer)
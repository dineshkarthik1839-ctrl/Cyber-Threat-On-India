from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.orm import Session
from datetime import datetime
import secrets
import hashlib

from app.database.dependencies import get_db
from app.models.sensor import Sensor
from app.schemas.sensor import SensorCreate, SensorResponse, SensorTokenResponse, SensorEventIngest, SensorHeartbeat
from app.services.normalizer import normalize_sensor_event
from app.services.enrichment import enrich_sensor_event
from app.services.security import get_current_user
from app.models.user import User
from app.services.websocket_manager import manager

router = APIRouter(prefix="/sensors", tags=["Sensors"])

def get_sensor_by_token(token: str, db: Session) -> Sensor:
    if not token:
        raise HTTPException(status_code=401, detail="Missing Sensor-Token header")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    sensor = db.query(Sensor).filter(Sensor.api_token_hash == token_hash).first()
    if not sensor:
        raise HTTPException(status_code=401, detail="Invalid Sensor-Token")
    return sensor

@router.post("/register", response_model=SensorTokenResponse)
def register_sensor(
    sensor_in: SensorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin-only endpoint to register a new sensor and obtain its API token."""
    existing = db.query(Sensor).filter(Sensor.name == sensor_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Sensor name already exists")

    # Generate secure token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    db_sensor = Sensor(
        name=sensor_in.name,
        location_country=sensor_in.location_country,
        location_state=sensor_in.location_state,
        location_city=sensor_in.location_city,
        public_ip=sensor_in.public_ip,
        provider=sensor_in.provider,
        sensor_type=sensor_in.sensor_type,
        api_token_hash=token_hash
    )
    db.add(db_sensor)
    db.commit()
    db.refresh(db_sensor)

    return {"sensor": db_sensor, "api_token": raw_token}

@router.post("/events", status_code=202)
def ingest_sensor_event(
    event: SensorEventIngest,
    background_tasks: BackgroundTasks,
    sensor_token: str = Header(..., alias="Sensor-Token"),
    db: Session = Depends(get_db)
):
    """Secure endpoint for authorized sensors to push telemetry."""
    sensor = get_sensor_by_token(sensor_token, db)

    # Update sensor stats
    sensor.events_today += 1
    sensor.last_seen = datetime.utcnow()
    sensor.status = "ONLINE"
    
    # Normalize raw event into unified Attack model
    db_attack = normalize_sensor_event(sensor, event)
    
    db.add(db_attack)
    db.commit()
    db.refresh(db_attack)

    # Initial fast broadcast
    ws_event = {
        "id": f"sensor-{db_attack.id}",
        "eventUuid": db_attack.event_uuid,
        "indicator": db_attack.indicator,
        "indicatorType": db_attack.indicator_type,
        "source": db_attack.source,
        "sourceType": db_attack.source_type,
        "eventClassification": db_attack.event_classification,
        "sourceIp": db_attack.indicator,
        "sourceCountry": db_attack.source_country,
        "countryCode": db_attack.source_country_code,
        "targetCountry": db_attack.target_country,
        "targetState": db_attack.target_state,
        "targetCity": db_attack.target_city,
        "destinationPort": db_attack.destination_port,
        "protocol": db_attack.destination_protocol,
        "attackType": db_attack.attack_type,
        "severity": db_attack.severity,
        "confidence": db_attack.confidence,
        "mitre": db_attack.mitre_tactic,
        "description": db_attack.description,
        "timestamp": db_attack.timestamp.isoformat() + "Z",
        "isConfirmedIndiaTarget": db_attack.is_confirmed_india_target,
        "sensor": {"id": sensor.sensor_uuid, "name": sensor.name}
    }
    
    background_tasks.add_task(manager.broadcast, ws_event)
    
    # Trigger background enrichment (e.g. AbuseIPDB reputation)
    background_tasks.add_task(enrich_sensor_event, db_attack.id)

    return {"status": "accepted", "event_id": db_attack.event_uuid}

@router.post("/heartbeat")
def sensor_heartbeat(
    heartbeat: SensorHeartbeat,
    sensor_token: str = Header(..., alias="Sensor-Token"),
    db: Session = Depends(get_db)
):
    sensor = get_sensor_by_token(sensor_token, db)
    sensor.last_seen = datetime.utcnow()
    sensor.status = heartbeat.status
    db.commit()
    return {"status": "ok"}

@router.get("", response_model=list[SensorResponse])
def list_sensors(db: Session = Depends(get_db)):
    """List all registered sensors (public dashboard data)."""
    return db.query(Sensor).all()

@router.get("/{sensor_id}", response_model=SensorResponse)
def get_sensor(sensor_id: str, db: Session = Depends(get_db)):
    sensor = db.query(Sensor).filter(Sensor.sensor_uuid == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor

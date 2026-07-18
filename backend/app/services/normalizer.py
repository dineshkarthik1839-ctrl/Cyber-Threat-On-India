from datetime import datetime
from app.models.sensor import Sensor
from app.models.attack import Attack
from app.schemas.sensor import SensorEventIngest
from app.services.detection import classify_event

def normalize_sensor_event(sensor: Sensor, event: SensorEventIngest) -> Attack:
    """
    Normalizes a raw sensor event into the common Attack schema.
    Authoritative location is pulled from the Sensor record, NOT the event payload.
    Classification is strictly LIVE_SENSOR and CONFIRMED_INDIA_TARGET.
    """
    
    attack_type, severity, mitre_tactic, classification_reason = classify_event(
        event_type=event.event_type,
        port=event.destination_port,
        payload=event.raw_payload
    )

    db_attack = Attack(
        indicator=event.source_ip,
        indicator_type="ip",
        source=f"sensor-{sensor.name}",
        source_type="SENSOR",
        event_classification="LIVE_SENSOR",
        source_country="Unknown", # Will be updated by async enrichment
        source_country_code="--",
        sensor_id=sensor.sensor_uuid,
        destination_port=event.destination_port,
        destination_protocol=event.protocol,
        target_country=sensor.location_country,
        target_state=sensor.location_state,
        target_city=sensor.location_city,
        attack_type=attack_type,
        severity=severity,
        confidence=100, # 100% confidence because it was observed on our sensor
        mitre_tactic=mitre_tactic,
        description=f"Direct observation on {sensor.name}. Port: {event.destination_port}/{event.protocol}",
        classification_reason=classification_reason,
        raw_event_reference=event.raw_payload[:450] if event.raw_payload else None,
        is_confirmed_india_target=True, # Proved by sensor location
        timestamp=event.timestamp or datetime.utcnow()
    )

    return db_attack

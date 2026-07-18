import asyncio
import requests
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.attack import Attack
from app.crud.settings import get_collector_settings
from app.services.websocket_manager import manager

async def enrich_sensor_event(attack_id: int):
    """
    Asynchronous enrichment pipeline.
    Runs after the initial sensor event is persisted and broadcasted,
    ensuring that the real-time pipeline is never blocked by slow external APIs.
    """
    db: Session = SessionLocal()
    try:
        attack = db.query(Attack).filter(Attack.id == attack_id).first()
        if not attack or attack.indicator_type != "ip":
            return

        settings = get_collector_settings(db)
        enriched = False

        # 1. AbuseIPDB Enrichment
        if settings.abuseipdb_enabled and settings.abuseipdb_key:
            headers = {
                "Key": settings.abuseipdb_key,
                "Accept": "application/json",
            }
            params = {"ipAddress": attack.indicator, "maxAgeInDays": 30}
            try:
                # Use a short timeout so we don't hang
                response = requests.get("https://api.abuseipdb.com/api/v2/check", headers=headers, params=params, timeout=5)
                if response.status_code == 200:
                    data = response.json().get("data", {})
                    attack.source_country = data.get("countryName", attack.source_country)
                    attack.source_country_code = data.get("countryCode", attack.source_country_code)
                    attack.source_asn = str(data.get("isp", ""))
                    
                    confidence = data.get("abuseConfidenceScore", 0)
                    
                    if confidence > 0:
                        attack.risk_score = confidence
                        # Upgrade classification reason to include intelligence match
                        old_reason = attack.classification_reason or ""
                        attack.classification_reason = f"{old_reason} | ENRICHMENT: Matched in AbuseIPDB with {confidence}% confidence."
                        
                        if confidence > 80 and attack.severity != "Critical":
                            attack.severity = "High"
                            
                    enriched = True
            except Exception as e:
                print(f"Enrichment error (AbuseIPDB) for {attack.indicator}: {e}")

        # Save updates
        if enriched:
            db.commit()
            db.refresh(attack)
            
            # Broadcast update so frontend can display the enriched data
            event = {
                "id": f"sensor-{attack.id}",
                "eventUuid": attack.event_uuid,
                "indicator": attack.indicator,
                "indicatorType": attack.indicator_type,
                "source": attack.source,
                "sourceType": attack.source_type,
                "eventClassification": attack.event_classification,
                "sourceIp": attack.indicator,
                "sourceCountry": attack.source_country,
                "countryCode": attack.source_country_code,
                "targetCountry": attack.target_country,
                "targetState": attack.target_state,
                "targetCity": attack.target_city,
                "destinationPort": attack.destination_port,
                "protocol": attack.destination_protocol,
                "attackType": attack.attack_type,
                "severity": attack.severity,
                "confidence": attack.confidence,
                "mitre": attack.mitre_tactic,
                "description": attack.description,
                "timestamp": attack.timestamp.isoformat() + "Z",
                "isConfirmedIndiaTarget": attack.is_confirmed_india_target,
                "sensor": None
            }
            
            await manager.broadcast(event)

    except Exception as e:
        print(f"Background enrichment failed for attack {attack_id}: {e}")
    finally:
        db.close()

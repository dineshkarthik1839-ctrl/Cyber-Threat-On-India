import asyncio
from sqlalchemy.orm import Session
from datetime import datetime

from app.crud.settings import get_collector_settings
from app.collectors.abuseipdb import fetch_abuseipdb_indicators
from app.collectors.otx import fetch_otx_indicators
from app.collectors.threatfox import fetch_threatfox_indicators
from app.collectors.urlhaus import fetch_urlhaus_indicators
from app.collectors.cisa_kev import fetch_cisa_kev_indicators
from app.models.attack import Attack
from app.services.websocket_manager import manager


def collect_and_save_all(db: Session) -> int:
    """Execute all active intelligence collectors, normalize feeds, save and broadcast.

    All intelligence-sourced events are tagged:
        source_type = INTELLIGENCE
        event_classification = LIVE_INTELLIGENCE (or INDIA_RELEVANT_INTELLIGENCE)
    """
    settings = get_collector_settings(db)
    new_threats = []

    # 1. AbuseIPDB (needs API key)
    if settings.abuseipdb_enabled and settings.abuseipdb_key:
        print("Threat Collector: Ingesting AbuseIPDB...")
        new_threats.extend(fetch_abuseipdb_indicators(settings.abuseipdb_key, limit=20))

    # 2. AlienVault OTX
    if settings.otx_enabled:
        print("Threat Collector: Ingesting AlienVault OTX...")
        new_threats.extend(fetch_otx_indicators(settings.otx_key, limit=20))

    # 3. ThreatFox
    if settings.threatfox_enabled:
        print("Threat Collector: Ingesting ThreatFox...")
        new_threats.extend(fetch_threatfox_indicators(limit=20))

    # 4. URLHaus
    if settings.urlhaus_enabled:
        print("Threat Collector: Ingesting URLHaus...")
        new_threats.extend(fetch_urlhaus_indicators(limit=20))

    # 5. CISA KEV
    if settings.cisa_enabled:
        print("Threat Collector: Ingesting CISA KEV...")
        new_threats.extend(fetch_cisa_kev_indicators(limit=10))

    saved_count = 0
    print(f"Threat Collector: Fetched {len(new_threats)} indicators. Filtering duplicates...")

    for threat_dict in new_threats:
        # Prevent exact indicator + source duplicates
        existing = db.query(Attack).filter(
            Attack.indicator == threat_dict["indicator"],
            Attack.source == threat_dict["source"]
        ).first()

        if not existing:
            db_threat = Attack(**threat_dict)
            db.add(db_threat)
            db.commit()
            db.refresh(db_threat)
            saved_count += 1

            # Build standardized WebSocket message with explicit classification
            event = {
                "id": f"intel-{db_threat.id}",
                "eventUuid": db_threat.event_uuid,
                "indicator": db_threat.indicator,
                "indicatorType": db_threat.indicator_type,
                "source": db_threat.source,
                "sourceType": db_threat.source_type or "INTELLIGENCE",
                "eventClassification": db_threat.event_classification or "LIVE_INTELLIGENCE",
                "sourceIp": db_threat.indicator if db_threat.indicator_type == "ip" else "N/A",
                "sourceCountry": db_threat.source_country,
                "countryCode": db_threat.source_country_code,
                "targetCountry": db_threat.target_country,
                "targetState": db_threat.target_state,
                "targetCity": db_threat.target_city,
                "destinationPort": db_threat.destination_port,
                "protocol": db_threat.destination_protocol,
                "attackType": db_threat.attack_type,
                "severity": db_threat.severity,
                "confidence": db_threat.confidence,
                "mitre": db_threat.mitre_tactic,
                "description": db_threat.description,
                "timestamp": db_threat.timestamp.isoformat() + "Z" if db_threat.timestamp else datetime.utcnow().isoformat() + "Z",
                "isConfirmedIndiaTarget": db_threat.is_confirmed_india_target,
                "sensor": None
            }

            # Safely attempt to broadcast via WebSocket loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(manager.broadcast(event))
            except Exception:
                # If scheduler is in a separate background thread without running event loop
                pass

    print(f"Threat Collector Finished: Saved {saved_count} new threat indicators.")
    return saved_count
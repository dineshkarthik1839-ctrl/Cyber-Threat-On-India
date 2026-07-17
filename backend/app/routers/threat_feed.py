from datetime import datetime, UTC
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.collectors.abuseipdb import fetch_abuseipdb_indicators
from app.database.dependencies import get_db
from app.models.attack import Attack
from app.services.demo_telemetry import demo_india_events
from app.crud.settings import get_collector_settings
from app.config import ABUSEIPDB_API_KEY

router = APIRouter(prefix="/threats", tags=["Threat Intelligence"])

@router.get("/abuseipdb")
def get_abuseipdb_feed(
    limit: int = Query(default=40, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Raw reputation indicators. These are not destination-verified attacks."""
    settings = get_collector_settings(db)
    api_key = settings.abuseipdb_key or ABUSEIPDB_API_KEY
    return fetch_abuseipdb_indicators(api_key, limit)

@router.get("/live")
def get_live_feed(
    limit: int = Query(default=40, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return India-destination events, or labelled sample telemetry for development."""
    attacks = (
        db.query(Attack)
        .filter(Attack.target_country.ilike("india"))
        .order_by(Attack.timestamp.desc())
        .limit(limit)
        .all()
    )

    if not attacks:
        return {
            "items": demo_india_events(),
            "meta": {
                "mode": "demo",
                "sources": ["Demonstration India telemetry"],
                "refreshed_at": datetime.now(UTC).isoformat(),
            },
        }

    return {
        "items": [
            {
                "id": f"india-{attack.id}",
                "sourceIp": attack.indicator,
                "sourceCountry": attack.source_country or "Unknown",
                "countryCode": attack.source_country_code or "--",
                "targetState": attack.target_state or "India",
                "attackType": attack.attack_type or "Suspicious activity",
                "severity": attack.severity or "Medium",
                "confidence": attack.confidence or 50,
                "timestamp": attack.timestamp.replace(tzinfo=UTC).isoformat() if attack.timestamp else "Unknown",
                "mitre": attack.mitre_tactic or "Unclassified",
            }
            for attack in attacks
        ],
        "meta": {
            "mode": "live",
            "sources": ["India-destination telemetry"],
            "refreshed_at": datetime.now(UTC).isoformat(),
        },
    }

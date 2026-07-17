import json
from sqlalchemy.orm import Session
from app.models.settings import SystemSetting
from app.schemas.settings import CollectorSettings
from app.config import ABUSEIPDB_API_KEY, OTX_API_KEY

def get_setting(db: Session, key: str, default: str = "") -> str:
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if db_setting:
        return db_setting.value
    return default

def set_setting(db: Session, key: str, value: str) -> SystemSetting:
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if db_setting:
        db_setting.value = value
    else:
        db_setting = SystemSetting(key=key, value=value)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

def get_collector_settings(db: Session) -> CollectorSettings:
    # Read settings from DB, falling back to environment config or defaults
    return CollectorSettings(
        abuseipdb_enabled=get_setting(db, "abuseipdb_enabled", "true") == "true",
        otx_enabled=get_setting(db, "otx_enabled", "true") == "true",
        threatfox_enabled=get_setting(db, "threatfox_enabled", "true") == "true",
        urlhaus_enabled=get_setting(db, "urlhaus_enabled", "true") == "true",
        cisa_enabled=get_setting(db, "cisa_enabled", "true") == "true",
        abuseipdb_key=get_setting(db, "abuseipdb_key", ABUSEIPDB_API_KEY),
        otx_key=get_setting(db, "otx_key", OTX_API_KEY),
        poll_interval_minutes=int(get_setting(db, "poll_interval_minutes", "10")),
        simulation_mode=get_setting(db, "simulation_mode", "true") == "true",
    )

def update_collector_settings(db: Session, settings: CollectorSettings) -> CollectorSettings:
    set_setting(db, "abuseipdb_enabled", "true" if settings.abuseipdb_enabled else "false")
    set_setting(db, "otx_enabled", "true" if settings.otx_enabled else "false")
    set_setting(db, "threatfox_enabled", "true" if settings.threatfox_enabled else "false")
    set_setting(db, "urlhaus_enabled", "true" if settings.urlhaus_enabled else "false")
    set_setting(db, "cisa_enabled", "true" if settings.cisa_enabled else "false")
    set_setting(db, "abuseipdb_key", settings.abuseipdb_key or "")
    set_setting(db, "otx_key", settings.otx_key or "")
    set_setting(db, "poll_interval_minutes", str(settings.poll_interval_minutes))
    set_setting(db, "simulation_mode", "true" if settings.simulation_mode else "false")
    return settings

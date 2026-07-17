import random
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.attack import Attack
from app.services.websocket_manager import manager
from app.crud.settings import get_collector_settings

# Realistic threat vectors and configurations
ATTACK_VECTORS = [
    ("Credential Stuffing", "Critical", "T1110", [22, 3389, 80, 443]),
    ("Malware Beaconinging", "High", "T1071", [443, 8080, 445]),
    ("Exploit Attempt", "High", "T1190", [80, 443, 8080]),
    ("Reconnaissance Scan", "Medium", "T1595", [80, 22, 21, 445, 1433]),
    ("Port Sweep", "Low", "T1046", [22, 23, 80, 443, 3389, 8080]),
    ("DDoS Flood", "Critical", "T1498", [80, 443, 53, 123]),
    ("SQL Injection", "High", "T1190", [80, 443, 8080]),
    ("Ransomware Payload", "Critical", "T1486", [445, 139, 3389]),
    ("Phishing Redirection", "Medium", "T1566", [80, 443])
]

COUNTRIES = [
    ("Russia", "RU", ["185.220.101.45", "5.188.206.14", "95.213.15.8", "195.206.105.11"]),
    ("China", "CN", ["103.145.67.19", "222.186.30.22", "61.177.172.45", "112.85.42.18"]),
    ("United States", "US", ["45.155.205.33", "66.249.66.1", "104.244.42.1", "54.239.27.1"]),
    ("Germany", "DE", ["89.248.165.79", "46.166.139.12", "78.46.90.15", "138.201.20.10"]),
    ("Netherlands", "NL", ["91.92.241.12", "82.197.202.4", "185.244.25.10", "31.220.1.1"]),
    ("Turkey", "TR", ["5.188.206.14", "88.255.45.12", "176.240.100.8", "94.54.12.2"]),
    ("Brazil", "BR", ["186.208.10.15", "200.147.67.9", "177.105.20.12", "45.230.120.4"]),
    ("United Kingdom", "GB", ["82.165.19.45", "109.74.195.12", "5.10.22.44", "185.120.44.11"]),
    ("Ukraine", "UA", ["193.109.244.8", "91.240.118.15", "176.104.20.4", "93.180.12.85"]),
    ("Singapore", "SG", ["45.116.12.18", "128.199.112.5", "103.28.15.4", "178.128.48.9"])
]

STATES = ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat", "Kerala", "West Bengal", "Uttar Pradesh", "Andhra Pradesh"]

async def run_telemetry_simulator():
    """Continuously generate simulated attack events when simulation_mode is enabled."""
    print("Telemetry Simulator: Waiting 5 seconds before starting...")
    await asyncio.sleep(5)
    print("Telemetry Simulator Loop active.")
    
    while True:
        db = SessionLocal()
        try:
            settings = get_collector_settings(db)
            if not settings.simulation_mode:
                db.close()
                await asyncio.sleep(5)
                continue
            
            # Generate random attack
            country, country_code, ips = random.choice(COUNTRIES)
            ip = random.choice(ips)
            state = random.choice(STATES)
            attack_type, severity, mitre, ports = random.choice(ATTACK_VECTORS)
            port = random.choice(ports)
            confidence = random.randint(70, 99)
            
            db_attack = Attack(
                indicator=ip,
                indicator_type="ip",
                source="simulator",
                source_country=country,
                source_country_code=country_code,
                target_country="India",
                target_state=state,
                attack_type=attack_type,
                severity=severity,
                confidence=confidence,
                mitre_tactic=mitre,
                description=f"Simulated live ingress event: {attack_type} targeting {state}, India. Source port: {port}.",
                is_confirmed_india_target=True, # In simulator mode we present it as simulated live traffic targeting India
                timestamp=datetime.utcnow()
            )
            
            db.add(db_attack)
            db.commit()
            db.refresh(db_attack)
            
            # Broadcast the event immediately
            event = {
                "id": f"event-sim-{db_attack.id}",
                "indicator": db_attack.indicator,
                "indicatorType": db_attack.indicator_type,
                "source": "simulator",
                "sourceIp": db_attack.indicator,
                "sourceCountry": db_attack.source_country,
                "countryCode": db_attack.source_country_code,
                "targetCountry": db_attack.target_country,
                "targetState": db_attack.target_state,
                "attackType": db_attack.attack_type,
                "severity": db_attack.severity,
                "confidence": db_attack.confidence,
                "mitre": db_attack.mitre_tactic,
                "description": db_attack.description,
                "timestamp": db_attack.timestamp.isoformat() + "Z",
                "isConfirmed": True
            }
            
            await manager.broadcast(event)
            
        except Exception as e:
            print(f"Error in telemetry simulator loop: {e}")
        finally:
            db.close()
            
        # Random sleep between 2 and 6 seconds to feel natural
        await asyncio.sleep(random.uniform(2.0, 6.0))

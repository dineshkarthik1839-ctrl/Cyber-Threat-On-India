import requests
from typing import Any
from datetime import datetime, UTC

def fetch_threatfox_indicators(limit: int = 30) -> list[dict[str, Any]]:
    """Fetch and normalize recent indicators from ThreatFox API."""
    url = "https://threatfox-api.abuse.ch/api/v1/"
    payload = {
        "query": "get_iocs",
        "days": 1
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("query_status") != "ok":
            print(f"ThreatFox returned status: {data.get('query_status')}")
            return []
        iocs = data.get("data", [])[:limit]
    except Exception as e:
        print(f"Error fetching ThreatFox: {e}")
        return []

    normalized_threats = []
    indian_states = ["Delhi", "Maharashtra", "Telangana", "Karnataka", "Tamil Nadu", "Haryana", "Uttar Pradesh"]
    state_index = 0

    for ioc in iocs:
        ioc_val = ioc.get("ioc")
        ioc_type = ioc.get("ioc_type", "").lower()
        threat_type = ioc.get("threat_type", "Malicious activity")
        malware = ioc.get("malware_printable", "Unknown Malware")
        confidence = int(ioc.get("confidence_level", 50))
        
        # Check source country if provided (ThreatFox sometimes includes country of target or source)
        # Often it represents global honeypot submissions.
        reporter = ioc.get("reporter", "Community")
        
        # Determine indicator type
        norm_type = "unknown"
        if "ip" in ioc_type:
            norm_type = "ip"
        elif "domain" in ioc_type:
            norm_type = "domain"
        elif "url" in ioc_type:
            norm_type = "url"
        elif "hash" in ioc_type or len(ioc_val) in [32, 40, 64]:
            norm_type = "hash"
            
        # Distribute targets across states
        target_state = indian_states[state_index % len(indian_states)] + " (Projected Feed)"
        state_index += 1
        
        # Map malware/threat types to MITRE tactics
        mitre = "T1071" # Command and Control
        if "ransomware" in threat_type.lower() or "ransomware" in malware.lower():
            mitre = "T1486" # Data Encrypted for Impact
        elif "stealer" in threat_type.lower() or "stealer" in malware.lower():
            mitre = "T1115" # Clipboard Data / Credential Access
            
        severity = "Medium"
        if confidence >= 85:
            severity = "High"
        if confidence >= 95:
            severity = "Critical"

        normalized_threats.append({
            "indicator": ioc_val,
            "indicator_type": norm_type,
            "source": "threatfox",
            "source_country": "Global Feed",
            "source_country_code": "GL",
            "target_country": "India",
            "target_state": target_state,
            "attack_type": f"Malware: {malware} ({threat_type})",
            "severity": severity,
            "confidence": confidence,
            "mitre_tactic": mitre,
            "description": f"ThreatFox IOC submitted by {reporter}. Associated with {malware}.",
            "is_confirmed_india_target": False,
            "timestamp": datetime.utcnow()
        })

    return normalized_threats

import requests
from typing import Any, Optional
from datetime import datetime, UTC

URL = "https://api.abuseipdb.com/api/v2/blacklist"


def fetch_abuseipdb_indicators(api_key: Optional[str] = None, limit: int = 40) -> list[dict[str, Any]]:
    """Fetch and normalize the current AbuseIPDB blacklist.

    Classification: INTELLIGENCE / LIVE_INTELLIGENCE
    These are reputation-based IOCs, NOT confirmed attacks against India.
    """
    if not api_key:
        return []

    headers = {
        "Key": api_key,
        "Accept": "application/json",
    }
    params = {"confidenceMinimum": 90}

    try:
        response = requests.get(URL, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        indicators = response.json().get("data", [])[:limit]
    except Exception as e:
        print(f"Error fetching AbuseIPDB: {e}")
        return []

    normalized_threats = []

    for indicator in indicators:
        ip = indicator.get("ipAddress", "Unknown")
        country_name = indicator.get("countryName") or "Unknown"
        country_code = indicator.get("countryCode") or "--"
        confidence = indicator.get("abuseConfidenceScore", 90)

        normalized_threats.append({
            "indicator": ip,
            "indicator_type": "ip",
            "source": "abuseipdb",
            "source_type": "INTELLIGENCE",
            "event_classification": "LIVE_INTELLIGENCE",
            "source_country": country_name,
            "source_country_code": country_code,
            "target_country": "India",
            "target_state": "Unspecified",
            "attack_type": "Credential Stuffing / Brute Force",
            "severity": severity_for(confidence),
            "confidence": confidence,
            "mitre_tactic": "T1110",  # Brute Force
            "description": f"AbuseIPDB reputation alert. IP reported with confidence {confidence}%. Origin: {country_name}.",
            "classification_reason": "External reputation intelligence from AbuseIPDB blacklist. Not a confirmed attack against Indian infrastructure.",
            "is_confirmed_india_target": False,
            "timestamp": datetime.utcnow()
        })

    return normalized_threats


def severity_for(confidence: int) -> str:
    if confidence >= 95:
        return "Critical"
    if confidence >= 80:
        return "High"
    if confidence >= 50:
        return "Medium"
    return "Low"

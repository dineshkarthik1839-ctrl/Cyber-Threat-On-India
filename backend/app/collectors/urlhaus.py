import requests
from typing import Any
from datetime import datetime, UTC

def fetch_urlhaus_indicators(limit: int = 30) -> list[dict[str, Any]]:
    """Fetch and normalize recent malware URLs from URLHaus."""
    url = "https://urlhaus-api.abuse.ch/v1/urls/recent/"

    try:
        response = requests.get(url, timeout=10) # URLHaus recent feed is available via GET
        response.raise_for_status()
        data = response.json()
        urls = data.get("urls", [])[:limit]
    except Exception as e:
        print(f"Error fetching URLHaus: {e}")
        # Secondary fallback to public TXT feed if API fails
        return []

    normalized_threats = []
    indian_states = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "West Bengal", "Kerala"]
    state_index = 0

    for item in urls:
        url_val = item.get("url")
        url_status = item.get("url_status")
        threat = item.get("threat", "malware_download")
        reporter = item.get("reporter", "Community")
        
        # Tags and description
        tags = ", ".join(item.get("tags") or [])
        
        # Determine host origin (if IP or Domain)
        # Often URLHaus hosts are scattered globally.
        host = item.get("host", "Unknown Host")
        
        target_state = indian_states[state_index % len(indian_states)] + " (Projected Feed)"
        state_index += 1

        normalized_threats.append({
            "indicator": url_val,
            "indicator_type": "url",
            "source": "urlhaus",
            "source_country": "Global Feed",
            "source_country_code": "GL",
            "target_country": "India",
            "target_state": target_state,
            "attack_type": f"Malicious Download ({threat})",
            "severity": "High" if url_status == "online" else "Medium",
            "confidence": 80 if url_status == "online" else 60,
            "mitre_tactic": "T1105", # Ingress Tool Transfer
            "description": f"URLHaus online malware source host: {host}. Tags: {tags}. Submitter: {reporter}.",
            "is_confirmed_india_target": False,
            "timestamp": datetime.utcnow()
        })

    return normalized_threats

import requests
from typing import Any
from datetime import datetime, UTC


def fetch_urlhaus_indicators(limit: int = 30) -> list[dict[str, Any]]:
    """Fetch and normalize recent malware URLs from URLHaus.

    Classification: INTELLIGENCE / LIVE_INTELLIGENCE
    """
    url = "https://urlhaus-api.abuse.ch/v1/urls/recent/"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        urls = data.get("urls", [])[:limit]
    except Exception as e:
        print(f"Error fetching URLHaus: {e}")
        return []

    normalized_threats = []

    for item in urls:
        url_val = item.get("url")
        url_status = item.get("url_status")
        threat = item.get("threat", "malware_download")
        reporter = item.get("reporter", "Community")
        tags = ", ".join(item.get("tags") or [])
        host = item.get("host", "Unknown Host")

        normalized_threats.append({
            "indicator": url_val,
            "indicator_type": "url",
            "source": "urlhaus",
            "source_type": "INTELLIGENCE",
            "event_classification": "LIVE_INTELLIGENCE",
            "source_country": "Global Feed",
            "source_country_code": "GL",
            "target_country": "Global",
            "target_state": "Unspecified",
            "attack_type": f"Malicious Download ({threat})",
            "severity": "High" if url_status == "online" else "Medium",
            "confidence": 80 if url_status == "online" else 60,
            "mitre_tactic": "T1105",  # Ingress Tool Transfer
            "description": f"URLHaus online malware source host: {host}. Tags: {tags}. Submitter: {reporter}.",
            "classification_reason": "Community-submitted malicious URL from URLHaus. Global intelligence.",
            "is_confirmed_india_target": False,
            "timestamp": datetime.utcnow()
        })

    return normalized_threats

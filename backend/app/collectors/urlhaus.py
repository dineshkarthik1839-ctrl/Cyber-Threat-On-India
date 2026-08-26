import requests
from typing import Any
from datetime import datetime, UTC


def fetch_urlhaus_indicators(limit: int = 50) -> list[dict[str, Any]]:
    """Fetch and normalize recent malware URLs from URLHaus public CSV.

    Classification: INTELLIGENCE / LIVE_INTELLIGENCE
    """
    url = "https://urlhaus.abuse.ch/downloads/csv_recent/"

    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        lines = response.text.splitlines()
        
        # Parse CSV (skip comments)
        import csv
        reader = csv.reader([line for line in lines if not line.startswith('#')])
        urls = list(reader)[:limit]
    except Exception as e:
        print(f"Error fetching URLHaus: {e}")
        return []

    normalized_threats = []
    
    # States to map global threats to Indian regions for the visualizer
    import random
    indian_states = ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat", "Kerala", "West Bengal", "Uttar Pradesh", "Andhra Pradesh"]

    for row in urls:
        if len(row) < 9:
            continue
            
        url_id, dateadded, url_val, url_status, last_online, threat, tags, urlhaus_link, reporter = row
        
        # Randomly assign a target state for visualization purposes
        target_state = random.choice(indian_states)

        normalized_threats.append({
            "indicator": url_val,
            "indicator_type": "url",
            "source": "urlhaus",
            "source_type": "INTELLIGENCE",
            "event_classification": "LIVE_INTELLIGENCE",
            "source_country": "Global Feed",
            "source_country_code": "GL",
            "target_country": "India",
            "target_state": target_state,
            "attack_type": f"Malicious Download ({threat})",
            "severity": "High" if url_status == "online" else "Medium",
            "confidence": 80 if url_status == "online" else 60,
            "mitre_tactic": "T1105",  # Ingress Tool Transfer
            "description": f"URLHaus malware URL. Tags: {tags}. Submitter: {reporter}.",
            "classification_reason": "Community-submitted malicious URL from URLHaus. Globally distributed threat.",
            "is_confirmed_india_target": False,
            "timestamp": datetime.utcnow()
        })

    return normalized_threats


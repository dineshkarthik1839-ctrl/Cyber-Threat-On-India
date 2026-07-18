import requests
from typing import Any, Optional
from datetime import datetime, UTC


def fetch_otx_indicators(api_key: Optional[str] = None, limit: int = 30) -> list[dict[str, Any]]:
    """Fetch and normalize recent indicators from AlienVault OTX activity.

    Classification:
    - INTELLIGENCE / LIVE_INTELLIGENCE (default)
    - INTELLIGENCE / INDIA_RELEVANT_INTELLIGENCE (when pulse explicitly targets India)

    IMPORTANT: Even when a pulse mentions India, this is intelligence —
    NOT a confirmed attack observed by an ICTIP sensor.
    """
    url = "https://otx.alienvault.com/api/v1/pulses/activity"
    headers = {}
    if api_key:
        headers["X-OTX-API-KEY"] = api_key

    try:
        response = requests.get(url, headers=headers, params={"limit": 10}, timeout=10)
        response.raise_for_status()
        pulses = response.json().get("results", [])
    except Exception as e:
        print(f"Error fetching AlienVault OTX: {e}")
        return []

    normalized_threats = []

    for pulse in pulses:
        pulse_name = pulse.get("name", "OTX Threat Pulse")
        pulse_description = pulse.get("description", "")
        indicators = pulse.get("indicators", [])[:5]

        # Check if India is explicitly referenced in the pulse
        is_india_relevant = "india" in pulse_name.lower() or "india" in pulse_description.lower()
        countries = pulse.get("targeted_countries", [])
        if "India" in countries:
            is_india_relevant = True

        for ind in indicators:
            ind_type = ind.get("type", "").lower()
            value = ind.get("indicator")
            if not value or not ind_type:
                continue

            # Map type to normalized types
            norm_type = "unknown"
            if "ip" in ind_type:
                norm_type = "ip"
            elif "domain" in ind_type or "hostname" in ind_type:
                norm_type = "domain"
            elif "url" in ind_type:
                norm_type = "url"
            elif "file" in ind_type or "hash" in ind_type or len(value) in [32, 40, 64]:
                norm_type = "hash"
            elif "cve" in ind_type:
                norm_type = "cve"

            origin_country = "Global Feed"
            origin_code = "GL"

            # Determine classification based on India relevance
            if is_india_relevant:
                event_classification = "INDIA_RELEVANT_INTELLIGENCE"
                classification_reason = f"OTX pulse explicitly references India in targeted_countries or description."
            else:
                event_classification = "LIVE_INTELLIGENCE"
                classification_reason = "Global threat intelligence from AlienVault OTX. No confirmed India targeting."

            # Severity estimation
            indicator_count = len(indicators)
            severity = "Medium"
            if is_india_relevant:
                severity = "High" if indicator_count < 15 else "Critical"
            elif indicator_count > 20:
                severity = "High"

            normalized_threats.append({
                "indicator": value,
                "indicator_type": norm_type,
                "source": "otx",
                "source_type": "INTELLIGENCE",
                "event_classification": event_classification,
                "source_country": origin_country,
                "source_country_code": origin_code,
                "target_country": "India" if is_india_relevant else "Global",
                "target_state": "Unspecified",
                "attack_type": pulse_name[:150],
                "severity": severity,
                "confidence": 75,
                "mitre_tactic": "T1190" if norm_type == "cve" else "T1071",
                "description": f"Pulse: {pulse_name}. {pulse_description[:300]}",
                "classification_reason": classification_reason,
                "is_confirmed_india_target": False,
                "timestamp": datetime.utcnow()
            })

            if len(normalized_threats) >= limit:
                break
        if len(normalized_threats) >= limit:
            break

    return normalized_threats

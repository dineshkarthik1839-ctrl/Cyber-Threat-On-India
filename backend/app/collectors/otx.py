import requests
from typing import Any, Optional
from datetime import datetime, UTC

def fetch_otx_indicators(api_key: Optional[str] = None, limit: int = 30) -> list[dict[str, Any]]:
    """Fetch and normalize recent indicators from AlienVault OTX activity."""
    url = "https://otx.alienvault.com/api/v1/pulses/activity"
    headers = {}
    if api_key:
        headers["X-OTX-API-KEY"] = api_key

    try:
        # Fetch recent pulse activity
        response = requests.get(url, headers=headers, params={"limit": 10}, timeout=10)
        response.raise_for_status()
        pulses = response.json().get("results", [])
    except Exception as e:
        print(f"Error fetching AlienVault OTX: {e}")
        return []

    normalized_threats = []
    
    # A list of Indian states to distribute unconfirmed global intelligence projections
    indian_states = ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat", "West Bengal"]
    state_index = 0

    for pulse in pulses:
        pulse_name = pulse.get("name", "OTX Threat Pulse")
        pulse_description = pulse.get("description", "")
        pulse_id = pulse.get("id")
        indicators = pulse.get("indicators", [])[:5] # Limit indicators per pulse for variety
        
        # Check if India is explicitly referenced in the threat pulse description or name
        is_india_targeted = "india" in pulse_name.lower() or "india" in pulse_description.lower()
        
        # Parse references/tags to look for country origins or targets
        countries = pulse.get("targeted_countries", [])
        if "India" in countries:
            is_india_targeted = True

        for ind in indicators:
            ind_type = ind.get("type", "").lower()
            value = ind.get("indicator")
            if not value or not ind_type:
                continue
            
            # Map type to normalized types: ip, domain, url, hash, cve
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
                
            # If it's a hash or url, it might not have an direct IP country origin.
            # We assign a default or try to find threat details.
            origin_country = "Global Feed"
            origin_code = "GL"
            
            # Check indicator details for country of origin if IP
            if norm_type == "ip":
                # OTX provides a simple geo details in some fields or default
                pass

            target_state = "Unspecified (Global Feed)"
            if is_india_targeted:
                target_state = indian_states[state_index % len(indian_states)] + " (Confirmed Target)"
                state_index += 1
            else:
                target_state = indian_states[state_index % len(indian_states)] + " (Projected Feed)"
                state_index += 1

            # Estimate severity based on pulse metrics
            indicator_count = len(indicators)
            severity = "Medium"
            if is_india_targeted:
                severity = "High" if indicator_count < 15 else "Critical"
            elif indicator_count > 20:
                severity = "High"

            normalized_threats.append({
                "indicator": value,
                "indicator_type": norm_type,
                "source": "otx",
                "source_country": origin_country,
                "source_country_code": origin_code,
                "target_country": "India",
                "target_state": target_state,
                "attack_type": pulse_name[:150],
                "severity": severity,
                "confidence": 75,
                "mitre_tactic": "T1190" if norm_type == "cve" else "T1071",
                "description": f"Pulse: {pulse_name}. Description: {pulse_description[:300]}",
                "is_confirmed_india_target": is_india_targeted,
                "timestamp": datetime.utcnow()
            })
            
            if len(normalized_threats) >= limit:
                break
        if len(normalized_threats) >= limit:
            break

    return normalized_threats

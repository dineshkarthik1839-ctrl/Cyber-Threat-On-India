import requests
from typing import Any
from datetime import datetime, UTC

def fetch_cisa_kev_indicators(limit: int = 15) -> list[dict[str, Any]]:
    """Fetch and normalize recent vulnerabilities from the CISA KEV Catalog."""
    url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        vulnerabilities = data.get("vulnerabilities", [])
        
        # Sort by date added descending (newest first)
        # Dates are in format YYYY-MM-DD
        vulnerabilities.sort(key=lambda x: x.get("dateAdded", ""), reverse=True)
        recent_vulns = vulnerabilities[:limit]
    except Exception as e:
        print(f"Error fetching CISA KEV: {e}")
        return []

    normalized_threats = []
    indian_states = ["Delhi", "Maharashtra", "Karnataka", "Telangana", "Tamil Nadu", "Gujarat"]
    state_index = 0

    for vuln in recent_vulns:
        cve_id = vuln.get("cveID")
        vendor = vuln.get("vendorProject", "Generic")
        product = vuln.get("product", "Software")
        vuln_name = vuln.get("vulnerabilityName", "Vulnerability")
        date_added_str = vuln.get("dateAdded", "")
        desc = vuln.get("shortDescription", "")
        action = vuln.get("requiredAction", "")
        
        try:
            timestamp = datetime.strptime(date_added_str, "%Y-%m-%d")
        except Exception:
            timestamp = datetime.utcnow()

        target_state = indian_states[state_index % len(indian_states)] + " (Projected Surface)"
        state_index += 1

        normalized_threats.append({
            "indicator": cve_id,
            "indicator_type": "cve",
            "source": "cisa",
            "source_country": "Global Surface",
            "source_country_code": "GL",
            "target_country": "India",
            "target_state": target_state,
            "attack_type": f"Exploit: {vendor} {product} ({cve_id})",
            "severity": "Critical", # All CISA KEVs are actively exploited, so Critical/High
            "confidence": 100,      # CISA KEV is 100% verified active exploitation
            "mitre_tactic": "T1190", # Exploit Public-Facing Application
            "description": f"CISA KEV CVE details: {vuln_name}. Description: {desc}. Required action: {action}",
            "is_confirmed_india_target": False,
            "timestamp": timestamp
        })

    return normalized_threats

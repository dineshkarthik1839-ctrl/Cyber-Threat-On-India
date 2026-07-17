from datetime import UTC, datetime

INDIA_DEMO_EVENTS = [
    ("203.0.113.45", "Russia", "Delhi", "Credential stuffing", "Critical", "T1110"),
    ("198.51.100.78", "Indonesia", "Karnataka", "Malware beacon", "High", "T1071"),
    ("192.0.2.118", "Germany", "Maharashtra", "Exploit attempt", "High", "T1190"),
    ("203.0.113.188", "Netherlands", "Tamil Nadu", "Reconnaissance", "Medium", "T1595"),
    ("198.51.100.201", "Turkey", "Telangana", "Port scan", "Low", "T1046"),
    ("192.0.2.94", "Russia", "Gujarat", "DDoS", "Critical", "T1498"),
]


def demo_india_events() -> list[dict[str, object]]:
    timestamp = datetime.now(UTC).isoformat()
    return [
        {
            "id": f"demo-india-{index}",
            "sourceIp": source_ip,
            "sourceCountry": source_country,
            "countryCode": "--",
            "targetState": target_state,
            "attackType": attack_type,
            "severity": severity,
            "confidence": 0,
            "timestamp": timestamp,
            "mitre": mitre,
        }
        for index, (source_ip, source_country, target_state, attack_type, severity, mitre) in enumerate(INDIA_DEMO_EVENTS, start=1)
    ]

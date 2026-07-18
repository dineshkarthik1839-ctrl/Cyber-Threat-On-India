import re

def classify_event(event_type: str, port: int, payload: str = None) -> tuple[str, str, str, str]:
    """
    Conservative classification engine.
    Returns: (attack_type, severity, mitre_tactic, classification_reason)
    """
    event_type = event_type.lower()
    payload = payload or ""

    if port == 22 or "ssh" in event_type:
        return (
            "Possible SSH Brute Force",
            "High",
            "T1110",
            "Observed repeated SSH connection attempts to sensor."
        )
    
    if port in [80, 443] or "http" in event_type:
        if "sql" in payload.lower() or "union select" in payload.lower():
            return (
                "SQL Injection Attempt",
                "Critical",
                "T1190",
                "Observed SQL injection payload in HTTP request to sensor."
            )
        if "wget " in payload.lower() or "curl " in payload.lower():
            return (
                "Command Injection Attempt",
                "Critical",
                "T1059",
                "Observed shell command execution attempt."
            )
        return (
            "Suspicious HTTP Request",
            "Medium",
            "T1190",
            "Observed suspicious HTTP connection to sensor."
        )

    if port in [23, 2323]:
        return (
            "Telnet Brute Force",
            "Medium",
            "T1110",
            "Observed Telnet connection attempt, commonly associated with IoT botnets."
        )
    
    if port in [1433, 3306, 5432]:
        return (
            "Database Reconnaissance",
            "High",
            "T1046",
            "Observed connection attempt to database port."
        )

    return (
        "Connection Attempt",
        "Low",
        "T1046",
        f"Observed generic connection attempt to port {port}."
    )

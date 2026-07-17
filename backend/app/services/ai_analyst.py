from sqlalchemy.orm import Session
from datetime import datetime, UTC
from sqlalchemy import func

from app.models.attack import Attack
from app.crud.attack import get_overview_stats, get_top_source_countries, get_top_target_states

def generate_weekly_briefing(db: Session) -> str:
    """Generate a comprehensive Markdown-formatted national security briefing."""
    stats = get_overview_stats(db)
    top_countries = get_top_source_countries(db, limit=3)
    top_states = get_top_target_states(db, limit=3)
    
    # Query top attack types
    top_attacks = (
        db.query(Attack.attack_type, func.count(Attack.id))
        .group_by(Attack.attack_type)
        .order_by(func.count(Attack.id).desc())
        .limit(3)
        .all()
    )

    countries_str = ", ".join(f"**{c['country']}** ({c['count']} events)" for c in top_countries)
    states_str = ", ".join(f"**{s['state']}** ({s['share']}% share)" for s in top_states)
    vectors_str = ", ".join(f"**{v[0]}** ({v[1]} events)" for v in top_attacks)

    risk_level = "ELEVATED"
    if stats["critical_events"] > 50:
        risk_level = "HIGH"
    elif stats["critical_events"] > 100:
        risk_level = "CRITICAL"

    briefing = f"""# ICTIP AI National Threat Briefing
**Generated on**: {datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S UTC')}
**Threat Posture Level**: **{risk_level}**

---

### Executive Threat Summary
Over the rolling analysis window, the **India Cyber Threat Intelligence Platform (ICTIP)** observed **{stats['total_events']} threat indicators** directed at or normalized against Indian networks. Of these, **{stats['critical_events']} indicators are classified as Critical Severity**, representing active cyber campaigns.

### High-Priority Attack Vectors
Our indicators show that the leading techniques targeting Indian infrastructure are:
1. {vectors_str if top_attacks else "No active vectors recorded."}

### Geographic Exposure & Origin
- **Primary Source Clusters**: {countries_str if top_countries else "Global distribution."}
- **Most Targeted Regions**: {states_str if top_states else "Distributed honeypots."}

### MITRE ATT&CK Mapping
We map incoming telemetry to standard techniques. Most vectors fall into:
* **T1110 (Brute Force / Credential Stuffing)**: Targeting edge authentication gateways.
* **T1190 (Exploits)**: Targeting vulnerabilities on web servers.
* **T1071 (Standard C2 Traffic)**: Active malware communication channels.

### Defensive Recommendations
1. **Perimeter Controls**: Implement IP blocklists targeting active clusters from `{top_countries[0]['country'] if top_countries else 'Russia'}`.
2. **Access Gateways**: Verify endpoint integrity on all remote connectivity portals. Enable multi-factor authentication (MFA).
3. **Patch Prioritization**: Review CISA KEV listings for CVEs matching public-facing devices and patch immediately.
"""
    return briefing

def answer_analyst_query(db: Session, query: str) -> str:
    """Parse analyst inquiries using text heuristics, querying database metrics to give detailed feedback."""
    q_lower = query.lower().strip()
    
    # Check for general India live telemetry
    if "india" in q_lower or "total" in q_lower or "live feed" in q_lower or "right now" in q_lower:
        count = db.query(func.count(Attack.id)).scalar() or 0
        critical = db.query(func.count(Attack.id)).filter(Attack.severity == "Critical").scalar() or 0
        return f"""### Live India Threat Telemetry
We are currently tracking **{count} total live attacks** targeting Indian infrastructure right now.
Of these, **{critical} are classified as CRITICAL** severity.

**Action Item**: Keep monitoring the live feed. You can ask me about specific states like Hyderabad (Telangana), Maharashtra, or specific attack types."""

    # Dynamic search for any state/city mentioned
    regions = ["hyderabad", "telangana", "maharashtra", "delhi", "karnataka", "gujarat", "tamil nadu", "andhra pradesh", "kerala", "uttar pradesh", "pune", "mumbai", "bengaluru", "chennai"]
    
    for region in regions:
        if region in q_lower:
            count = db.query(func.count(Attack.id)).filter(Attack.target_state.ilike(f"%{region}%")).scalar() or 0
            attacks = db.query(Attack).filter(Attack.target_state.ilike(f"%{region}%")).order_by(Attack.timestamp.desc()).limit(3).all()
            examples = "\n".join(f"- `{a.indicator}` ({a.source_country}): {a.attack_type} (Severity: {a.severity})" for a in attacks)
            return f"""### Live Attacks: {region.title()}
Currently, we have registered **{count} live threat events** targeting **{region.title()}** right now.

**Recent Indicators**:
{examples if attacks else "- No live indicators active for this region."}

**Mitigation Recommendation**: 
Alert regional SOC teams and monitor incoming traffic from the identified source IPs."""

    if "russia" in q_lower or "russian" in q_lower:
        count = db.query(func.count(Attack.id)).filter(Attack.source_country.ilike("%russia%")).scalar() or 0
        attacks = db.query(Attack).filter(Attack.source_country.ilike("%russia%")).limit(3).all()
        examples = "\n".join(f"- `{a.indicator}`: {a.attack_type} (Severity: {a.severity})" for a in attacks)
        return f"""### Russia Source Analysis
We have registered **{count} threat events** originating from Russian IP networks. 
Russian infrastructure is primarily engaged in credential stuffing and exploit sweeps.

**Recent Indicators**:
{examples if attacks else "- No indicators active."}

**Mitigation Recommendation**: 
Block range allocations and enforce geofencing rules for remote management interfaces (SSH, RDP)."""

    elif "critical" in q_lower or "high severity" in q_lower:
        count = db.query(func.count(Attack.id)).filter(Attack.severity == "Critical").scalar() or 0
        attacks = db.query(Attack).filter(Attack.severity == "Critical").limit(5).all()
        examples = "\n".join(f"- `{a.indicator}` ({a.source}): {a.attack_type} targeting {a.target_state}" for a in attacks)
        return f"""### Critical Threat Indicators
We currently track **{count} critical-severity alarms**. These represent active malware payloads, active DDoS campaigns, or verified remote exploitation attempts.

**Top Critical Targets**:
{examples if attacks else "- No critical threats detected in this window."}

**Mitigation Recommendation**:
Execute automated playbook rules. Coordinate with SOC security orchestration for immediate firewall isolation on these source hosts."""

    elif "state" in q_lower or "region" in q_lower or "target" in q_lower:
        top_states = get_top_target_states(db, limit=4)
        states_str = "\n".join(f"1. **{s['state']}**: {s['count']} events ({s['share']}% share)" for s in top_states)
        return f"""### Indian State Exposure Report
Our threat sensors register the highest volume concentration targeting the following zones:

{states_str if top_states else "No regional data collected."}

**Analysis**:
The concentration in industrial and IT hubs (e.g. Maharashtra, Karnataka, Delhi) suggests targeted credential sweeps and software supply-chain discovery. Focus defense actions on corporate routers and DNS nodes in these areas."""

    elif "malware" in q_lower or "virus" in q_lower:
        count = db.query(func.count(Attack.id)).filter(Attack.attack_type.ilike("%malware%")).scalar() or 0
        return f"""### Malware Infrastructure Synthesis
We track **{count} indicators** associated with active malware hosting or command-and-control (C2) beaconing.
Most indicators map back to ThreatFox and URLHaus crawls.

**Action Item**:
Ensure local host detection endpoints are updated with hash signatures and block outbound beaconing attempts."""

    elif "cve" in q_lower or "exploit" in q_lower:
        cve_threats = db.query(Attack).filter(Attack.indicator_type == "cve").limit(4).all()
        examples = "\n".join(f"- **{c.indicator}**: {c.attack_type} - {c.description[:120]}..." for c in cve_threats)
        return f"""### Active Exploited Vulnerabilities (CISA KEV)
We normalized the following exploited vulnerabilities targeting public services:

{examples if cve_threats else "- No recent CVE exploits recorded."}

**Action Item**:
Cross-reference these CVE tags with internal vulnerability scanning dashboards and patch immediate endpoints."""

    else:
        # Generic catch-all for live stats
        count = db.query(func.count(Attack.id)).scalar() or 0
        critical = db.query(func.count(Attack.id)).filter(Attack.severity == "Critical").scalar() or 0
        return f"""### ICTIP Analyst Assistance
I can help analyze threat metrics in our database. We are currently tracking **{count} total live events** (with **{critical} Critical alarms**).

I support queries regarding live telemetry like **"How many attacks in Hyderabad?"**, **India**, **Russia**, **Critical**, **State**, **Malware**, or **CVE**.

How would you like to pivot? Ask a follow-up question."""

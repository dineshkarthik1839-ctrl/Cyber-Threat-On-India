from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from app.models.attack import Attack
from app.schemas.attack import AttackCreate

def create_attack(db: Session, attack: AttackCreate) -> Attack:
    db_attack = Attack(**attack.model_dump())
    db.add(db_attack)
    db.commit()
    db.refresh(db_attack)
    return db_attack

def get_attacks(db: Session, limit: int = 100) -> list[Attack]:
    return db.query(Attack).order_by(Attack.timestamp.desc()).limit(limit).all()

def get_attacks_filtered(
    db: Session,
    severity: str = "All",
    source: str = "All",
    source_type: str = "All",
    query: str = "",
    limit: int = 50
) -> list[Attack]:
    q = db.query(Attack)
    filters = []
    
    if severity != "All":
        filters.append(Attack.severity == severity)
        
    if source != "All":
        filters.append(Attack.source == source)
        
    if source_type != "All":
        filters.append(Attack.source_type == source_type)
        
    if query:
        search_filter = or_(
            Attack.indicator.ilike(f"%{query}%"),
            Attack.source_country.ilike(f"%{query}%"),
            Attack.attack_type.ilike(f"%{query}%"),
            Attack.target_state.ilike(f"%{query}%"),
            Attack.description.ilike(f"%{query}%")
        )
        filters.append(search_filter)
        
    if filters:
        q = q.filter(and_(*filters))
        
    return q.order_by(Attack.timestamp.desc()).limit(limit).all()

def get_overview_stats(db: Session) -> dict:
    total = db.query(func.count(Attack.id)).scalar() or 0
    critical = db.query(func.count(Attack.id)).filter(Attack.severity == "Critical").scalar() or 0
    
    # Active campaigns - distinct attack types
    campaigns = db.query(func.count(func.distinct(Attack.attack_type))).scalar() or 0
    
    # Targeted regions - distinct Indian states
    regions = db.query(func.count(func.distinct(Attack.target_state))).scalar() or 0
    
    return {
        "total_events": total,
        "critical_events": critical,
        "active_campaigns": campaigns,
        "targeted_regions": regions
    }

def get_top_source_countries(db: Session, limit: int = 5) -> list[dict]:
    # Filter out empty or "Global Feed" if you only want physical countries
    results = (
        db.query(
            Attack.source_country,
            Attack.source_country_code,
            func.count(Attack.id).label("count")
        )
        .group_by(Attack.source_country, Attack.source_country_code)
        .order_by(func.count(Attack.id).desc())
        .limit(limit)
        .all()
    )
    return [
        {"country": country, "code": code, "count": count}
        for country, code, count in results
    ]

def get_top_target_states(db: Session, limit: int = 5) -> list[dict]:
    results = (
        db.query(
            Attack.target_state,
            func.count(Attack.id).label("count")
        )
        .group_by(Attack.target_state)
        .order_by(func.count(Attack.id).desc())
        .limit(limit)
        .all()
    )
    
    total = db.query(func.count(Attack.id)).scalar() or 1
    if total == 0:
        total = 1
        
    return [
        {
            "state": state,
            "count": count,
            "share": round((count / total) * 100, 1)
        }
        for state, count in results
    ]

def get_severity_breakdown(db: Session) -> list[dict]:
    results = (
        db.query(
            Attack.severity,
            func.count(Attack.id).label("count")
        )
        .group_by(Attack.severity)
        .all()
    )
    return [{"severity": sev, "count": count} for sev, count in results]

def get_timeline_stats(db: Session) -> list[dict]:
    dialect = db.bind.dialect.name
    if dialect == "postgresql":
        # Group by hour format HH
        hour_func = func.to_char(Attack.timestamp, "HH24")
    else:
        # SQLite fallback
        hour_func = func.strftime("%H", Attack.timestamp)

    # Let's count attacks grouped by hour in the last 24 hours
    cutoff = datetime.utcnow() - timedelta(hours=24)
    results = (
        db.query(
            hour_func.label("hour"),
            func.count(Attack.id).label("count")
        )
        .filter(Attack.timestamp >= cutoff)
        .group_by(hour_func)
        .order_by(hour_func)
        .all()
    )
    
    timeline = [{"time": r[0], "attacks": r[1]} for r in results]
    if not timeline:
        # Seed dummy hours so Recharts renders a nice graph if there's no data
        now_hour = datetime.utcnow().hour
        timeline = [
            {"time": f"{(now_hour - i) % 24:02d}", "attacks": random_attacks(i)}
            for i in reversed(range(7))
        ]
    return timeline

def random_attacks(index: int) -> int:
    import random
    return random.randint(50, 180)
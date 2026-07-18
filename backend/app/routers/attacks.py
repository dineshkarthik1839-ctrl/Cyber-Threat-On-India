from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.dependencies import get_db
from app.schemas.attack import AttackResponse, CountryStats, StateStats, TimelineStats, SeverityStats
from app.crud.attack import (
    get_attacks_filtered,
    get_overview_stats,
    get_top_source_countries,
    get_top_target_states,
    get_timeline_stats,
    get_severity_breakdown
)
from app.services.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/attacks", tags=["Threat Landscape"])

@router.get("", response_model=List[AttackResponse])
def read_attacks(
    severity: str = Query(default="All"),
    source: str = Query(default="All"),
    query: str = Query(default=""),
    limit: int = Query(default=40, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve normalized threat list with filters (requires analyst login)."""
    return get_attacks_filtered(db, severity=severity, source=source, query=query, limit=limit)

@router.get("/stats/overview")
def read_overview_stats(
    db: Session = Depends(get_db)
):
    """Fetch high-level counters for SOC dashboards (requires analyst login)."""
    return get_overview_stats(db)

@router.get("/stats/countries", response_model=List[CountryStats])
def read_countries_stats(
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Fetch top attack origin countries (requires analyst login)."""
    return get_top_source_countries(db, limit=limit)

@router.get("/stats/states", response_model=List[StateStats])
def read_states_stats(
    limit: int = Query(default=5, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """Fetch top targeted Indian states and percentage share (requires analyst login)."""
    return get_top_target_states(db, limit=limit)

@router.get("/stats/severity", response_model=List[SeverityStats])
def read_severity_stats(
    db: Session = Depends(get_db)
):
    """Fetch threat severity breakdown (requires analyst login)."""
    return get_severity_breakdown(db)

@router.get("/stats/timeline", response_model=List[TimelineStats])
def read_timeline_stats(
    db: Session = Depends(get_db)
):
    """Fetch 24-hour event timeline volume data (requires analyst login)."""
    return get_timeline_stats(db)
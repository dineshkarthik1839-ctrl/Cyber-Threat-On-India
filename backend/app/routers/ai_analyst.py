from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.services.ai_analyst import generate_weekly_briefing, answer_analyst_query
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI Threat Analyst"])

@router.get("/briefing")
def read_briefing(
    db: Session = Depends(get_db)
):
    """Retrieve an automated weekly markdown briefing based on current telemetry (requires analyst login)."""
    brief = generate_weekly_briefing(db)
    return {"brief": brief}

@router.post("/query")
def submit_query(
    payload: dict = Body(..., example={"query": "Summary of critical threats"}),
    db: Session = Depends(get_db)
):
    """Interactive analyst query interface (requires analyst login)."""
    user_query = payload.get("query", "")
    answer = answer_analyst_query(db, user_query)
    return {"answer": answer}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.investigation import Investigation, InvestigationNote
from app.models.attack import Attack
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationResponse,
    InvestigationStatusUpdate,
    InvestigationNoteCreate,
    InvestigationNoteResponse
)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation

@router.post("", response_model=InvestigationResponse)
def create_investigation(inv_in: InvestigationCreate, db: Session = Depends(get_db)):
    # Check if attack exists
    attack = db.query(Attack).filter(Attack.id == inv_in.attack_id).first()
    if not attack:
        raise HTTPException(status_code=404, detail="Associated attack not found")
    
    # Check if investigation already exists for this attack
    existing = db.query(Investigation).filter(Investigation.attack_id == inv_in.attack_id).first()
    if existing:
        return existing
        
    db_inv = Investigation(
        attack_id=inv_in.attack_id,
        ai_analysis=inv_in.ai_analysis
    )
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    return db_inv

@router.patch("/{investigation_id}/status", response_model=InvestigationResponse)
def update_status(investigation_id: int, status_update: InvestigationStatusUpdate, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
        
    investigation.status = status_update.status
    db.commit()
    db.refresh(investigation)
    return investigation

@router.post("/{investigation_id}/notes", response_model=InvestigationNoteResponse)
def add_note(investigation_id: int, note_in: InvestigationNoteCreate, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
        
    db_note = InvestigationNote(
        investigation_id=investigation_id,
        content=note_in.content,
        author="Analyst" # Defaulting for now
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/{investigation_id}/iocs", response_model=list[dict])
def get_investigation_iocs(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
        
    # Get other attacks with the same indicator
    related_attacks = db.query(Attack).filter(
        Attack.indicator == investigation.attack.indicator,
        Attack.id != investigation.attack_id
    ).order_by(Attack.timestamp.desc()).limit(10).all()
    
    return [
        {
            "id": a.id,
            "indicator": a.indicator,
            "type": a.indicator_type,
            "timestamp": a.timestamp.isoformat(),
            "target": a.target_state,
            "severity": a.severity,
            "source": a.source
        } for a in related_attacks
    ]

@router.get("/{investigation_id}/timeline", response_model=list[dict])
def get_investigation_timeline(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    timeline = []
    
    # 1. Initial Attack Detection
    timeline.append({
        "type": "DETECTION",
        "timestamp": investigation.attack.timestamp.isoformat(),
        "title": "Critical Threat Detected",
        "description": f"Initial event ingested from {investigation.attack.source} indicating {investigation.attack.attack_type}.",
        "author": "System"
    })
    
    # 2. AI Analysis (if present)
    if investigation.ai_analysis:
        timeline.append({
            "type": "AI_ANALYSIS",
            "timestamp": investigation.created_at.isoformat(),
            "title": "AI Analysis Completed",
            "description": f"Risk score calculated based on {investigation.attack.attack_type} patterns.",
            "author": "AI Engine"
        })
        
    # 3. Analyst Notes
    for note in investigation.notes:
        timeline.append({
            "type": "NOTE",
            "timestamp": note.timestamp.isoformat(),
            "title": "Analyst Note",
            "description": note.content,
            "author": note.author
        })
        
    # Sort timeline by timestamp ascending
    timeline.sort(key=lambda x: x["timestamp"])
    
    return timeline

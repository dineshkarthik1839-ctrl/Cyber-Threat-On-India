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

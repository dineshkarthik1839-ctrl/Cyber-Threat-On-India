from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.attack import AttackCreate, AttackResponse
from app.crud.attack import create_attack, get_attacks

router = APIRouter()


@router.post("/attacks", response_model=AttackResponse)
def create_new_attack(
    attack: AttackCreate,
    db: Session = Depends(get_db)
):
    return create_attack(db, attack)


@router.get("/attacks", response_model=list[AttackResponse])
def read_attacks(
    db: Session = Depends(get_db)
):
    return get_attacks(db)
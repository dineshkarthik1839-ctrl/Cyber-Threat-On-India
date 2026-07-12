from sqlalchemy.orm import Session
from app.models.attack import Attack
from app.schemas.attack import AttackCreate


def create_attack(db: Session, attack: AttackCreate):

    db_attack = Attack(**attack.model_dump())

    db.add(db_attack)

    db.commit()

    db.refresh(db_attack)

    return db_attack


def get_attacks(db: Session):

    return db.query(Attack).all()
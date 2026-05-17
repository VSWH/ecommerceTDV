from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.app.api.dependencies import get_db
from src.app.db.models import DBUser
from src.app.schemas.user import UserCreate, UserResponse, UserUpdate


router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = (
        db.query(DBUser)
        .filter(DBUser.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = DBUser(**user.model_dump())

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return db.query(DBUser).offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = (
        db.query(DBUser)
        .filter(DBUser.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
):
    db_user = (
        db.query(DBUser)
        .filter(DBUser.id == user_id)
        .first()
    )

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    email_owner = (
        db.query(DBUser)
        .filter(DBUser.email == user_update.email, DBUser.id != user_id)
        .first()
    )

    if email_owner:
        raise HTTPException(status_code=400, detail="Email already registered")

    update_data = user_update.model_dump()

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)

    return db_user


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = (
        db.query(DBUser)
        .filter(DBUser.id == user_id)
        .first()
    )

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()

    return None
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.app.db.models import DBCategory
from src.app.schemas.category import CategoryCreate, CategoryResponse
from src.app.api.dependencies import get_db

# Notice we use APIRouter here instead of FastAPI()
router = APIRouter(prefix="/categories", tags=["Categories"])

@router.post("/", response_model=CategoryResponse, status_code=201)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = DBCategory(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[CategoryResponse])
def get_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DBCategory).offset(skip).limit(limit).all()
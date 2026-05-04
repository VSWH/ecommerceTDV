from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.app.api.dependencies import get_db
from src.app.db.models import DBCategory
from src.app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/", response_model=CategoryResponse, status_code=201)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    existing_category = (
        db.query(DBCategory)
        .filter(DBCategory.name == category.name)
        .first()
    )

    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")

    db_category = DBCategory(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category


@router.get("/", response_model=List[CategoryResponse])
def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return db.query(DBCategory).offset(skip).limit(limit).all()


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = (
        db.query(DBCategory)
        .filter(DBCategory.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return category
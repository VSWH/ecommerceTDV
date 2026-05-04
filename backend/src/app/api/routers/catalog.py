from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.app.api.dependencies import get_db
from src.app.db.models import DBCategory, DBProduct
from src.app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/catalog", tags=["Products"])


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    if product.category_id is not None:
        category = (
            db.query(DBCategory)
            .filter(DBCategory.id == product.category_id)
            .first()
        )

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    db_product = DBProduct(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


@router.get("/", response_model=List[ProductResponse])
def get_all_products(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(DBProduct)

    if active_only:
        query = query.filter(DBProduct.is_active == True)

    return query.offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = (
        db.query(DBProduct)
        .filter(DBProduct.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductCreate,
    db: Session = Depends(get_db),
):
    db_product = (
        db.query(DBProduct)
        .filter(DBProduct.id == product_id)
        .first()
    )

    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_update.category_id is not None:
        category = (
            db.query(DBCategory)
            .filter(DBCategory.id == product_update.category_id)
            .first()
        )

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    update_data = product_update.model_dump()

    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    return db_product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = (
        db.query(DBProduct)
        .filter(DBProduct.id == product_id)
        .first()
    )

    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(db_product)
    db.commit()

    return None
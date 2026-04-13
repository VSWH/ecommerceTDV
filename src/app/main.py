from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional

# ==========================================
# 1. DATABASE SETUP (SQLAlchemy)
# ==========================================
# Using SQLite for initial development. 
SQLALCHEMY_DATABASE_URL = "sqlite:///./ecommerce_catalog.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 2. DATABASE MODELS
# ==========================================
class DBProduct(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True) # Useful for hiding out-of-stock items without deleting them
    image_url = Column(String, nullable=True)

# Create the database tables
Base.metadata.create_all(bind=engine)

# ==========================================
# 3. PYDANTIC SCHEMAS (Data Validation)
# ==========================================
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    is_active: bool = True
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass # Used for receiving data from the client

class ProductResponse(ProductBase):
    id: int # Used for sending data back to the client

    class Config:
        from_attributes = True

# ==========================================
# 4. FASTAPI APPLICATION & ENDPOINTS
# ==========================================
app = FastAPI(title="Viana E-commerce API", version="1.0.0")

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/catalog/", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Adds a new product to the catalog.
    """
    db_product = DBProduct(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/catalog/", response_model=List[ProductResponse])
def get_all_products(skip: int = 0, limit: int = 100, active_only: bool = True, db: Session = Depends(get_db)):
    """
    Retrieves the product catalog. 
    By default, only shows active products to the frontend.
    """
    query = db.query(DBProduct)
    if active_only:
        query = query.filter(DBProduct.is_active == True)
    
    products = query.offset(skip).limit(limit).all()
    return products

@app.get("/catalog/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a single product's details by its ID.
    """
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found in the catalog")
    return product
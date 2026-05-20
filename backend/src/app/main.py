from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.app.db.database import engine, Base
from src.app.api.routers import catalog, categories, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Viana E-commerce API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router)
app.include_router(catalog.router)
app.include_router(users.router)
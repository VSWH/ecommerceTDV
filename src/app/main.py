from fastapi import FastAPI
from src.app.db.database import engine, Base
from src.app.api.routers import catalog, categories

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Viana E-commerce API", version="1.0.0")

# Plug in the routers we built in the other files
app.include_router(categories.router)
app.include_router(catalog.router)
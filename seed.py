# seed.py
from src.app.db.database import SessionLocal, engine
from src.app.db.models import Base, DBProduct, DBCategory

# Ensure all tables (including the new Categories table) exist
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    # Check if we already have categories to avoid duplicates
    if db.query(DBCategory).first():
        print("Database already seeded. Skipping...")
        db.close()
        return

    print("Seeding database with Categories and Products...")

    # 1. Create the Categories first
    cat_clothing = DBCategory(
        name="Vestuário", 
        description="Roupas masculinas, femininas e unissex."
    )
    cat_accessories = DBCategory(
        name="Acessórios", 
        description="Mochilas, carteiras e complementos para o dia a dia."
    )
    cat_home = DBCategory(
        name="Casa e Utilidades", 
        description="Itens práticos para casa e escritório."
    )

    # We add them to the session so they get their IDs generated
    db.add_all([cat_clothing, cat_accessories, cat_home])
    db.flush() # Flush sends them to the DB to get IDs, but doesn't fully commit yet

    # 2. Create the Products, linking them directly to the category objects
    examples = [
        DBProduct(
            name="Camiseta de Algodão Premium - Preta",
            description="Camiseta 100% algodão penteado. Modelagem unissex.",
            price=79.90,
            stock_quantity=50,
            is_active=True,
            image_url="https://via.placeholder.com/400x400.png?text=Camiseta+Preta",
            category_id=cat_clothing.id # Linking via the ID we just generated
        ),
        DBProduct(
            name="Mochila Impermeável Urban",
            description="Mochila resistente à água com compartimento para notebook.",
            price=249.50,
            stock_quantity=15,
            is_active=True,
            image_url="https://via.placeholder.com/400x400.png?text=Mochila+Urban",
            category_id=cat_accessories.id
        ),
        DBProduct(
            name="Garrafa Térmica Inox 500ml",
            description="Mantém a bebida gelada por até 24h e quente por 12h.",
            price=89.90,
            stock_quantity=0,
            is_active=False,
            image_url="https://via.placeholder.com/400x400.png?text=Garrafa+Termica",
            category_id=cat_home.id
        )
    ]

    # 3. Add products and finalize the save
    db.add_all(examples)
    db.commit()
    print("Database successfully seeded with 3 Categories and 3 Products!")
    db.close()

if __name__ == "__main__":
    seed_database()
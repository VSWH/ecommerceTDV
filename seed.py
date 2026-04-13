#inicializa base de dados
from src.app.db.database import SessionLocal, engine
from src.app.db.models import Base, DBProduct


Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    

    if db.query(DBProduct).first():
        print("Database already has items. Skipping seed.")
        db.close()
        return


    examples = [
        DBProduct(
            name="Camiseta de Algodão Premium - Preta",
            description="Camiseta 100% algodão penteado. Modelagem unissex.",
            price=79.90,
            stock_quantity=50,
            is_active=True,
            image_url="https://via.placeholder.com/400x400.png?text=Camiseta+Preta"
        ),
        DBProduct(
            name="Mochila Impermeável Urban",
            description="Mochila resistente à água com compartimento para notebook.",
            price=249.50,
            stock_quantity=15,
            is_active=True,
            image_url="https://via.placeholder.com/400x400.png?text=Mochila+Urban"
        ),
        DBProduct(
            name="Garrafa Térmica Inox 500ml",
            description="Mantém a bebida gelada por até 24h e quente por 12h.",
            price=89.90,
            stock_quantity=0,
            is_active=False,
            image_url="https://via.placeholder.com/400x400.png?text=Garrafa+Termica"
        )
    ]

    db.add_all(examples)
    db.commit()
    print("Database successfully seeded with 3 example products!")
    db.close()

if __name__ == "__main__":
    seed_database()

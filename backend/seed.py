from src.app.db.database import SessionLocal, engine
from src.app.db.models import Base, DBCategory, DBProduct


Base.metadata.create_all(bind=engine)


def seed_database():
    db = SessionLocal()

    try:
        if db.query(DBCategory).first():
            print("Database already seeded. Skipping...")
            return

        print("Seeding database with electrical categories and products...")

        cat_tomadas = DBCategory(
            name="Tomadas",
            description="Tomadas residenciais e comerciais.",
        )

        cat_disjuntores = DBCategory(
            name="Disjuntores",
            description="Disjuntores para proteção de circuitos elétricos.",
        )

        cat_interruptores = DBCategory(
            name="Interruptores",
            description="Interruptores simples, paralelos e módulos.",
        )

        cat_barramentos = DBCategory(
            name="Barramentos",
            description="Barramentos e acessórios para quadros elétricos.",
        )

        db.add_all([
            cat_tomadas,
            cat_disjuntores,
            cat_interruptores,
            cat_barramentos,
        ])

        db.flush()

        products = [
            DBProduct(
                name="Tomada 2P+T 10A Branca",
                description="Tomada padrão brasileiro 2P+T, ideal para instalações residenciais.",
                price=12.90,
                stock_quantity=80,
                is_active=True,
                image_url="https://images.unsplash.com/photo-1621905252507-b35492cc74b4",
                category_id=cat_tomadas.id,
            ),
            DBProduct(
                name="Tomada 2P+T 20A Branca",
                description="Tomada de 20 amperes indicada para equipamentos de maior potência.",
                price=16.90,
                stock_quantity=60,
                is_active=True,
                image_url="https://images.unsplash.com/photo-1621905252507-b35492cc74b4",
                category_id=cat_tomadas.id,
            ),
            DBProduct(
                name="Disjuntor Monopolar 20A",
                description="Disjuntor monopolar para proteção de circuitos elétricos residenciais.",
                price=24.90,
                stock_quantity=45,
                is_active=True,
                image_url="https://images.unsplash.com/photo-1621905251189-08b45d6a269e",
                category_id=cat_disjuntores.id,
            ),
            DBProduct(
                name="Disjuntor Bipolar 32A",
                description="Disjuntor bipolar indicado para circuitos de maior demanda elétrica.",
                price=49.90,
                stock_quantity=30,
                is_active=True,
                image_url="https://images.unsplash.com/photo-1621905251189-08b45d6a269e",
                category_id=cat_disjuntores.id,
            ),
            DBProduct(
                name="Interruptor Simples Branco",
                description="Interruptor simples para acionamento de pontos de iluminação.",
                price=10.90,
                stock_quantity=100,
                is_active=True,
                image_url="https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
                category_id=cat_interruptores.id,
            ),
            DBProduct(
                name="Interruptor Paralelo Branco",
                description="Interruptor paralelo para acionamento de lâmpadas em dois pontos diferentes.",
                price=14.90,
                stock_quantity=70,
                is_active=True,
                image_url="https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
                category_id=cat_interruptores.id,
            ),
            DBProduct(
                name="Barramento Neutro 12 Furos",
                description="Barramento para organização e distribuição do neutro em quadros elétricos.",
                price=19.90,
                stock_quantity=35,
                is_active=True,
                image_url="https://images.unsplash.com/photo-1621905252507-b35492cc74b4",
                category_id=cat_barramentos.id,
            ),
            DBProduct(
                name="Barramento Terra 12 Furos",
                description="Barramento para conexão de aterramento em instalações elétricas.",
                price=19.90,
                stock_quantity=35,
                is_active=True,
                image_url="https://images.unsplash.com/photo-1621905252507-b35492cc74b4",
                category_id=cat_barramentos.id,
            ),
        ]

        db.add_all(products)
        db.commit()

        print("Database seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
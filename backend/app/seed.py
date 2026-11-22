import json
import os
import sqlite3
from app.database import SessionLocal, engine, Base
from app.models import User, Group, Expense  # Update based on your exact model names

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "sample_expenses.json")

def seed_database() -> None:
    """Populates the database with initial development dataset."""
    db = SessionLocal()
    try:
        # Create all tables if not exist
        Base.metadata.create_all(bind=engine)

        if not os.path.exists(DATA_PATH):
            print(f"Dataset file not found at {DATA_PATH}")
            return

        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Seed Users
        user_map = {}
        for u in data.get("users", []):
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user_obj = User(name=u["name"], email=u["email"], password=u["password"])
                db.add(user_obj)
                db.commit()
                db.refresh(user_obj)
                user_map[u["email"]] = user_obj.id
            else:
                user_map[u["email"]] = existing.id

        print(f"Seeded {len(user_map)} users successfully.")

        # 2. Seed Groups
        group_map = {}
        for g in data.get("groups", []):
            creator_id = user_map.get(g["created_by_email"])
            group_obj = Group(name=g["name"], created_by=creator_id)
            db.add(group_obj)
            db.commit()
            db.refresh(group_obj)
            group_map[g["name"]] = group_obj.id

        print(f"Seeded {len(group_map)} groups.")

        # 3. Seed Expenses
        for exp in data.get("expenses", []):
            # Ruff RUF015 Fix: Grab the first group_id efficiently using next(iter())
            first_group_id = next(iter(group_map.values())) if group_map else 1
            
            expense_obj = Expense(
                description=exp["description"],
                amount=exp["amount"],
                paid_by=user_map.get(exp["paid_by_email"]),
                group_id=first_group_id
            )
            db.add(expense_obj)

        db.commit()
        print("Database seeded with sample expenses successfully!")

    # Ruff BLE001 Fix: Catch specific Database Errors and standard RuntimeErrors instead of Exception
    except (sqlite3.Error, RuntimeError) as e:
        db.rollback()
        print(f"Database/Runtime error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

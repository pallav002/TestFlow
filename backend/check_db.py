
from app.db.session import SessionLocal
from app.models.models import User, Enterprise, SignupRequest

def check_db():
    db = SessionLocal()
    print("--- USERS ---")
    users = db.query(User).all()
    for u in users:
        print(f"ID: {u.id}, Username: '{u.username}', Role: {u.role}, Active: {u.is_active}, EntID: {u.enterprise_id}")
    
    print("\n--- ENTERPRISES ---")
    ents = db.query(Enterprise).all()
    for e in ents:
        print(f"ID: {e.id}, Name: '{e.name}', Plan: {e.plan}, Active: {e.is_active}")

    print("\n--- SIGNUP REQUESTS ---")
    reqs = db.query(SignupRequest).all()
    for r in reqs:
        print(f"ID: {r.id}, Username: '{r.username}', Company: '{r.company_name}', Status: {r.status}")
    
    db.close()

if __name__ == "__main__":
    check_db()

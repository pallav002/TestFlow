from app.db.session import SessionLocal
from app.models import models
from app.core import security

db = SessionLocal()
try:
    admin = db.query(models.User).filter(models.User.username == 'admin').first()
    if admin:
        print(f"Found existing admin: {admin.username}. Updating password...")
        admin.hashed_password = security.get_password_hash('admin123')
        admin.is_admin = True
        admin.is_active = True
    else:
        print("Creating new admin account...")
        admin = models.User(
            username='admin',
            hashed_password=security.get_password_hash('admin123'),
            full_name='Administrator',
            is_admin=True,
            is_active=True
        )
        db.add(admin)
    db.commit()
    print("SUCCESS: Admin account (admin/admin123) is ready.")
except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()

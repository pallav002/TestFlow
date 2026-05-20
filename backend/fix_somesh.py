
from app.db.session import SessionLocal
from app.models.models import User, Enterprise, SignupRequest, TrialSettings, UserRole, SignupRequestStatus
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def fix_somesh():
    db = SessionLocal()
    req = db.query(SignupRequest).filter(SignupRequest.username == 'somesh').first()
    if not req:
        print("Somesh not found in signup requests")
        return
    
    if req.status == SignupRequestStatus.approved:
        print("Somesh already approved")
        # Check if user exists
        user = db.query(User).filter(User.username == 'somesh').first()
        if not user:
            print("But user is missing! Creating user...")
        else:
            print("User also exists. Everything looks fine.")
            return

    print(f"Approving {req.username} and creating account...")
    
    trial_cfg = db.query(TrialSettings).first()
    
    # Create enterprise
    ent = Enterprise(
        name=req.company_name,
        email=req.email,
        phone=req.phone,
        industry=req.industry,
        plan="trial",
        signup_method="public",
        hr_limit=trial_cfg.hr_limit if trial_cfg else 1,
        candidate_limit=trial_cfg.candidate_limit if trial_cfg else 10,
        test_limit=trial_cfg.test_limit if trial_cfg else 2,
        is_trial=True,
        trial_ends_at=datetime.now() + timedelta(days=trial_cfg.trial_duration_days if trial_cfg else 5),
        is_active=True,
    )
    db.add(ent)
    db.flush()
    
    # Create user
    user = User(
        username=req.username,
        hashed_password=req.hashed_password, # It's already hashed in SignupRequest
        full_name=req.contact_name,
        email=req.email,
        phone=req.phone,
        role=UserRole.enterprise,
        enterprise_id=ent.id,
        is_active=True,
    )
    db.add(user)
    
    req.status = SignupRequestStatus.approved
    db.commit()
    print("Done! Somesh can now login.")
    db.close()

if __name__ == "__main__":
    fix_somesh()

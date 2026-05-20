from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
from app.db.session import get_db
from app.models.models import (
    Enterprise, User, UserRole, Test, Submission,
    SignupRequest, SignupRequestStatus, UpgradeRequest, UpgradeRequestStatus,
    TrialSettings, CandidateTestAssignment, InterviewSchedule, JobOpening
)
from app.schemas import schemas
from app.core.security import get_current_superadmin, get_password_hash, create_access_token
from app.utils.email import send_welcome_email

router = APIRouter()


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    return {
        "total_enterprises": db.query(Enterprise).count(),
        "active_enterprises": db.query(Enterprise).filter(Enterprise.is_active == True).count(),
        "total_hrs": db.query(User).filter(User.role == UserRole.hr).count(),
        "total_candidates": db.query(User).filter(User.role == UserRole.candidate).count(),
        "total_tests": db.query(Test).count(),
        "total_submissions": db.query(Submission).count(),
        "total_signups": db.query(SignupRequest).count(),
        "pending_upgrades": db.query(UpgradeRequest).filter(UpgradeRequest.status == UpgradeRequestStatus.pending).count(),
    }


# ── Enterprise CRUD ────────────────────────────────────────────────────────────

@router.get("/enterprises", response_model=List[schemas.EnterpriseOut])
def list_enterprises(db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    return db.query(Enterprise).order_by(Enterprise.created_at.desc()).all()


@router.get("/enterprises/{enterprise_id}", response_model=schemas.EnterpriseOut)
def get_enterprise(enterprise_id: int, db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return ent


@router.post("/enterprises", response_model=schemas.EnterpriseOut)
def create_enterprise(
    data: schemas.EnterpriseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    # Check email uniqueness
    if db.query(Enterprise).filter(Enterprise.email == data.email).first():
        raise HTTPException(status_code=400, detail="Enterprise with this email already exists")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Get trial settings for limits if plan is trial
    trial_cfg = db.query(TrialSettings).first()

    ent = Enterprise(
        name=data.name,
        email=data.email,
        phone=data.phone,
        gst_number=data.gst_number,
        address=data.address,
        city=data.city,
        state=data.state,
        website=data.website,
        industry=data.industry,
        plan=data.plan,
        hr_limit=data.hr_limit,
        candidate_limit=data.candidate_limit,
        test_limit=data.test_limit,
        is_trial=(data.plan == "trial"),
        trial_ends_at=(datetime.now() + timedelta(days=trial_cfg.trial_duration_days)) if data.plan == "trial" and trial_cfg else None,
        is_active=True,
    )
    db.add(ent)
    db.flush()

    # Create enterprise login user
    user = User(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.name,
        email=data.email,
        phone=data.phone,
        role=UserRole.enterprise,
        enterprise_id=ent.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(ent)

    # Send welcome email in background
    background_tasks.add_task(
        send_welcome_email,
        to_email=data.email,
        company_name=data.name,
        username=data.username,
        password=data.password,
    )

    return ent


@router.put("/enterprises/{enterprise_id}", response_model=schemas.EnterpriseOut)
def update_enterprise(
    enterprise_id: int,
    data: schemas.EnterpriseUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(ent, field, value)
    # If plan changed from trial to something else
    if data.plan and data.plan != "trial":
        ent.is_trial = False
        ent.trial_ends_at = None
    db.commit()
    db.refresh(ent)
    return ent


@router.delete("/enterprises/{enterprise_id}")
def delete_enterprise(enterprise_id: int, db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    db.delete(ent)
    db.commit()
    return {"message": "Enterprise deleted"}


@router.patch("/enterprises/{enterprise_id}/toggle-active", response_model=schemas.EnterpriseOut)
def toggle_enterprise(enterprise_id: int, db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    ent.is_active = not ent.is_active
    db.commit()
    db.refresh(ent)
    return ent


# ── Direct Access Token for any Enterprise ─────────────────────────────────────

@router.post("/enterprises/{enterprise_id}/access-token")
def get_enterprise_access_token(
    enterprise_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    """SuperAdmin can generate a token to directly access any enterprise dashboard."""
    ent_user = db.query(User).filter(
        User.enterprise_id == enterprise_id,
        User.role == UserRole.enterprise
    ).first()
    if not ent_user:
        raise HTTPException(status_code=404, detail="Enterprise login user not found")
    token = create_access_token(subject=ent_user.username)
    return {"access_token": token, "token_type": "bearer", "user": ent_user}


# ── Enterprise Detail (users, stats) ──────────────────────────────────────────

@router.get("/enterprises/{enterprise_id}/detail")
def get_enterprise_detail(enterprise_id: int, db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    ent = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    hrs = db.query(User).filter(User.enterprise_id == enterprise_id, User.role == UserRole.hr).all()
    candidates = db.query(User).filter(User.enterprise_id == enterprise_id, User.role == UserRole.candidate).all()
    tests = db.query(Test).filter(Test.enterprise_id == enterprise_id).all()
    submissions = db.query(Submission).filter(Submission.enterprise_id == enterprise_id).all()
    return {
        "enterprise": ent,
        "stats": {
            "total_hrs": len(hrs),
            "total_candidates": len(candidates),
            "total_tests": len(tests),
            "total_submissions": len(submissions),
        },
        "hrs": hrs,
        "candidates": candidates,
    }


# ── Trial Settings ─────────────────────────────────────────────────────────────

@router.get("/trial-settings", response_model=schemas.TrialSettingsOut)
def get_trial_settings(db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    cfg = db.query(TrialSettings).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Trial settings not found")
    return cfg


@router.put("/trial-settings", response_model=schemas.TrialSettingsOut)
def update_trial_settings(
    data: schemas.TrialSettingsUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    cfg = db.query(TrialSettings).first()
    if not cfg:
        cfg = TrialSettings()
        db.add(cfg)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cfg, field, value)
    db.commit()
    db.refresh(cfg)
    return cfg


# ── Signup Requests ────────────────────────────────────────────────────────────

@router.get("/signup-requests", response_model=List[schemas.SignupRequestOut])
def list_signup_requests(db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    return db.query(SignupRequest).order_by(SignupRequest.created_at.desc()).all()


@router.post("/signup-requests/{request_id}/approve")
def approve_signup(
    request_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    req = db.query(SignupRequest).filter(SignupRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != SignupRequestStatus.pending:
        raise HTTPException(status_code=400, detail="Request already processed")

    trial_cfg = db.query(TrialSettings).first()

    # Create enterprise
    ent = Enterprise(
        name=req.company_name,
        email=req.email,
        phone=req.phone,
        industry=req.industry,
        plan="trial",
        hr_limit=trial_cfg.hr_limit if trial_cfg else 1,
        candidate_limit=trial_cfg.candidate_limit if trial_cfg else 10,
        test_limit=trial_cfg.test_limit if trial_cfg else 2,
        is_trial=True,
        trial_ends_at=datetime.now() + timedelta(days=trial_cfg.trial_duration_days if trial_cfg else 5),
        is_active=True,
    )
    db.add(ent)
    db.flush()

    # Create enterprise user
    user = User(
        username=req.username,
        hashed_password=req.hashed_password,
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

    background_tasks.add_task(
        send_welcome_email,
        to_email=req.email,
        company_name=req.company_name,
        username=req.username,
        password="[Your chosen password]",
    )

    return {"message": "Signup approved", "enterprise_id": ent.id}


@router.post("/signup-requests/{request_id}/reject")
def reject_signup(
    request_id: int,
    rejection_note: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    req = db.query(SignupRequest).filter(SignupRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = SignupRequestStatus.rejected
    req.rejection_note = rejection_note
    db.commit()
    return {"message": "Signup rejected"}


@router.delete("/signup-requests/{request_id}")
def delete_signup_request(
    request_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    req = db.query(SignupRequest).filter(SignupRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(req)
    db.commit()
    return {"message": "Request deleted"}


# ── Upgrade Requests ───────────────────────────────────────────────────────────

@router.get("/upgrade-requests", response_model=List[schemas.UpgradeRequestOut])
def list_upgrade_requests(db: Session = Depends(get_db), _=Depends(get_current_superadmin)):
    return db.query(UpgradeRequest).order_by(UpgradeRequest.created_at.desc()).all()


@router.post("/upgrade-requests/{request_id}/approve")
def approve_upgrade(
    request_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    req = db.query(UpgradeRequest).filter(UpgradeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    ent = db.query(Enterprise).filter(Enterprise.id == req.enterprise_id).first()
    if ent:
        ent.plan = req.requested_plan
        ent.is_trial = False
        ent.trial_ends_at = None
        # Set default limits per plan
        plan_limits = {
            "basic":      (5,  50,  5),
            "pro":        (20, 500, 20),
            "enterprise": (-1, -1,  -1),
        }
        limits = plan_limits.get(req.requested_plan, (5, 50, 5))
        ent.hr_limit, ent.candidate_limit, ent.test_limit = limits

    req.status = UpgradeRequestStatus.approved
    db.commit()

    background_tasks.add_task(
        send_welcome_email,
        to_email=ent.email if ent else "",
        company_name=ent.name if ent else "",
        username="",
        password="",
        subject=f"Plan Upgraded to {req.requested_plan.title()}",
        message=f"Your plan has been upgraded to {req.requested_plan.title()}. Enjoy your new limits!",
    )

    return {"message": "Upgrade approved"}


@router.post("/upgrade-requests/{request_id}/reject")
def reject_upgrade(
    request_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_superadmin)
):
    req = db.query(UpgradeRequest).filter(UpgradeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = UpgradeRequestStatus.rejected
    db.commit()
    return {"message": "Upgrade rejected"}

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import User, UserRole, HRType, Enterprise, Test, Submission, UpgradeRequest, UpgradeRequestStatus
from app.schemas import schemas
from app.core.security import get_current_enterprise_user, get_password_hash
from app.utils.email import send_welcome_email

router = APIRouter()


def _get_enterprise(current_user: User, db: Session) -> Enterprise:
    if current_user.role == UserRole.superadmin:
        raise HTTPException(status_code=400, detail="SuperAdmin should use superadmin endpoints")
    ent = db.query(Enterprise).filter(Enterprise.id == current_user.enterprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return ent


# ── Company Profile ────────────────────────────────────────────────────────────

@router.get("/profile", response_model=schemas.EnterpriseOut)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_enterprise_user)):
    return _get_enterprise(current_user, db)


@router.put("/profile", response_model=schemas.EnterpriseOut)
def update_profile(
    data: schemas.EnterpriseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_enterprise_user)
):
    ent = _get_enterprise(current_user, db)
    allowed = {"name", "phone", "gst_number", "address", "city", "state", "website", "industry"}
    for field, value in data.model_dump(exclude_none=True).items():
        if field in allowed:
            setattr(ent, field, value)
    db.commit()
    db.refresh(ent)
    return ent


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_enterprise_user)):
    ent = _get_enterprise(current_user, db)
    eid = ent.id
    return {
        "total_hrs": db.query(User).filter(User.enterprise_id == eid, User.role == UserRole.hr).count(),
        "total_candidates": db.query(User).filter(User.enterprise_id == eid, User.role == UserRole.candidate).count(),
        "total_tests": db.query(Test).filter(Test.enterprise_id == eid).count(),
        "total_submissions": db.query(Submission).filter(Submission.enterprise_id == eid).count(),
        "hr_limit": ent.hr_limit,
        "candidate_limit": ent.candidate_limit,
        "test_limit": ent.test_limit,
        "plan": ent.plan,
        "is_trial": ent.is_trial,
        "trial_ends_at": ent.trial_ends_at,
    }


# ── Submissions overview ───────────────────────────────────────────────────────

@router.get("/submissions-overview")
def get_submissions_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_enterprise_user)):
    ent = _get_enterprise(current_user, db)
    subs = db.query(Submission).filter(Submission.enterprise_id == ent.id).order_by(Submission.submitted_at.desc()).all()
    return [
        {
            "id": s.id,
            "candidate_name": s.candidate_name,
            "candidate_username": s.candidate_username,
            "test_title": s.test_title,
            "score": s.score,
            "accuracy": s.accuracy,
            "passed": s.passed,
            "submitted_at": s.submitted_at,
            "total_questions": s.total_questions,
            "correct_answers": s.correct_answers,
        }
        for s in subs
    ]


# ── HR Management ──────────────────────────────────────────────────────────────

@router.get("/hrs", response_model=List[schemas.UserOut])
def list_hrs(db: Session = Depends(get_db), current_user: User = Depends(get_current_enterprise_user)):
    ent = _get_enterprise(current_user, db)
    return db.query(User).filter(User.enterprise_id == ent.id, User.role == UserRole.hr).all()


@router.post("/hrs", response_model=schemas.UserOut)
def create_hr(
    data: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_enterprise_user)
):
    ent = _get_enterprise(current_user, db)

    # Check HR limit
    if ent.hr_limit != -1:
        current_count = db.query(User).filter(User.enterprise_id == ent.id, User.role == UserRole.hr).count()
        if current_count >= ent.hr_limit:
            raise HTTPException(status_code=400, detail=f"HR limit reached ({ent.hr_limit}). Please upgrade your plan.")

    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    if not data.email:
        raise HTTPException(status_code=400, detail="Email is required for HR users.")

    user = User(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        role=UserRole.hr,
        hr_type=data.hr_type or HRType.junior,
        enterprise_id=ent.id,
        employee_id=data.employee_id,
        department=data.department,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send welcome email with credentials
    background_tasks.add_task(
        send_welcome_email,
        to_email=data.email,
        company_name=ent.name,
        username=data.username,
        password=data.password,
        subject=f"Welcome to TestFlow — Your HR Account is Ready",
    )

    return user


@router.put("/hrs/{hr_id}", response_model=schemas.UserOut)
def update_hr(
    hr_id: int,
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_enterprise_user)
):
    ent = _get_enterprise(current_user, db)
    hr = db.query(User).filter(User.id == hr_id, User.enterprise_id == ent.id, User.role == UserRole.hr).first()
    if not hr:
        raise HTTPException(status_code=404, detail="HR not found")
    update_data = data.model_dump(exclude_none=True)
    if "password" in update_data:
        hr.hashed_password = get_password_hash(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(hr, field, value)
    db.commit()
    db.refresh(hr)
    return hr


@router.delete("/hrs/{hr_id}")
def delete_hr(hr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_enterprise_user)):
    ent = _get_enterprise(current_user, db)
    hr = db.query(User).filter(User.id == hr_id, User.enterprise_id == ent.id, User.role == UserRole.hr).first()
    if not hr:
        raise HTTPException(status_code=404, detail="HR not found")
    db.delete(hr)
    db.commit()
    return {"message": "HR deleted"}


@router.patch("/hrs/{hr_id}/toggle-active", response_model=schemas.UserOut)
def toggle_hr(hr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_enterprise_user)):
    ent = _get_enterprise(current_user, db)
    hr = db.query(User).filter(User.id == hr_id, User.enterprise_id == ent.id, User.role == UserRole.hr).first()
    if not hr:
        raise HTTPException(status_code=404, detail="HR not found")
    hr.is_active = not hr.is_active
    db.commit()
    db.refresh(hr)
    return hr


# ── Upgrade Request ────────────────────────────────────────────────────────────

@router.post("/upgrade-request")
def request_upgrade(
    data: schemas.UpgradeRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_enterprise_user)
):
    ent = _get_enterprise(current_user, db)
    # Check no pending request
    existing = db.query(UpgradeRequest).filter(
        UpgradeRequest.enterprise_id == ent.id,
        UpgradeRequest.status == UpgradeRequestStatus.pending
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending upgrade request.")
    req = UpgradeRequest(
        enterprise_id=ent.id,
        requested_plan=data.requested_plan,
        contact_name=data.contact_name,
        contact_phone=data.contact_phone,
        contact_email=data.contact_email,
        notes=data.notes,
    )
    db.add(req)
    db.commit()
    return {"message": "Upgrade request submitted. Our team will contact you shortly."}


@router.get("/upgrade-requests", response_model=List[schemas.UpgradeRequestOut])
def my_upgrade_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_enterprise_user)):
    ent = _get_enterprise(current_user, db)
    return db.query(UpgradeRequest).filter(UpgradeRequest.enterprise_id == ent.id).order_by(UpgradeRequest.created_at.desc()).all()

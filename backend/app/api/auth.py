from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.models.models import User, UserRole, CandidateTestAssignment
from app.core import security
from app.schemas import schemas

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username, User.is_active == True).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    # Check enterprise is active
    if user.enterprise_id:
        from app.models.models import Enterprise
        ent = db.query(Enterprise).filter(Enterprise.id == user.enterprise_id).first()
        if ent and not ent.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your company account is inactive. Contact support.")

        # Check trial expiry for enterprise/hr users
        if ent and ent.is_trial and ent.trial_ends_at and datetime.now() > ent.trial_ends_at:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your free trial has expired. Please upgrade your plan to continue."
            )

    # Candidate login window enforcement
    if user.role == UserRole.candidate:
        now = datetime.now()
        assignments = db.query(CandidateTestAssignment).filter(
            CandidateTestAssignment.user_id == user.id
        ).all()
        window_open = any(
            (a.login_start is None or a.login_start <= now) and
            (a.login_end is None or a.login_end >= now)
            for a in assignments
        )
        if not window_open:
            detail = "Login not allowed outside your scheduled test window." if assignments else "No tests have been assigned to you yet."
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

    access_token = security.create_access_token(subject=user.username)
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: User = Depends(security.get_current_user)):
    return current_user

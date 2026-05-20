from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta
import random
import logging
import requests as http_requests
from app.db.session import get_db
from app.models.models import SignupRequest, SignupRequestStatus, User, Enterprise, UserRole, TrialSettings, OTPRecord
from app.schemas import schemas
from app.core.security import get_password_hash
from app.utils.email import send_email
from app.utils.email import send_welcome_email
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


def _normalize_phone(phone: str) -> list[str]:
    """Return all possible stored variants of a phone number to search DB."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    variants = {phone}
    # if user typed +91XXXXXXXXXX → also try 91XXXXXXXXXX and XXXXXXXXXX
    if phone.startswith("+"):
        no_plus = phone[1:]
        variants.add(no_plus)
        if len(no_plus) > 10:
            variants.add(no_plus[-10:])  # last 10 digits
    # if user typed 10 digits → also try +91XXXXXXXXXX
    if len(phone) == 10 and phone.isdigit():
        variants.add("+91" + phone)
        variants.add("91" + phone)
    # if user typed 91XXXXXXXXXX → also try +91 and last 10
    if len(phone) == 12 and phone.startswith("91"):
        variants.add("+" + phone)
        variants.add(phone[-10:])
    return list(variants)


def _send_sms_otp(phone: str, otp: str):
    """Send OTP via MsgClub SMS API."""
    if not settings.MSGCLUB_AUTH_KEY or settings.MSGCLUB_AUTH_KEY == "your_msgclub_auth_key_here":
        logger.info(f"[SMS SKIP] No MsgClub key. OTP for {phone}: {otp}")
        return
    try:
        url = "https://msg.msgclub.net/rest/services/sendSMS/sendGroupSms"
        params = {
            "AUTH_KEY": settings.MSGCLUB_AUTH_KEY,
            "message": f"Your TestFlow password reset OTP is {otp}. Valid for 10 minutes. Do not share with anyone.",
            "senderId": settings.MSGCLUB_SENDER_ID,
            "routeId": "1",
            "mobileNos": phone.lstrip("+"),
            "smsContentType": "english",
        }
        resp = http_requests.get(url, params=params, timeout=10)
        logger.info(f"[SMS] OTP to {phone}: {resp.text}")
    except Exception as e:
        logger.error(f"[SMS FAILED] {phone}: {e}")


def _send_otp_email(to_email: str, otp: str, username: str):
    """Send OTP via email as fallback."""
    subject = "TestFlow — Your Password Reset OTP"
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:24px;">TestFlow</h1>
      </div>
      <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
        <h2 style="color:#111827;margin-top:0;">Password Reset OTP</h2>
        <p style="color:#374151;">Hi <strong>{username}</strong>, here is your OTP to reset your TestFlow password:</p>
        <div style="background:#f0f4ff;border:2px dashed #6366f1;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
          <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#6366f1;">{otp}</span>
        </div>
        <p style="color:#6b7280;font-size:14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color:#6b7280;font-size:13px;margin-top:20px;">If you did not request this, please ignore this email.</p>
      </div>
    </div>
    """
    send_email(to_email, subject, body)


@router.post("/signup", response_model=schemas.SignupRequestOut)
def public_signup(
    data: schemas.SignupRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(Enterprise).filter(Enterprise.email == data.email).first():
        raise HTTPException(status_code=400, detail="A company with this email already exists.")

    trial_cfg = db.query(TrialSettings).first()

    ent = Enterprise(
        name=data.company_name,
        email=data.email,
        phone=data.phone,
        industry=data.industry,
        plan="trial",
        hr_limit=trial_cfg.hr_limit if trial_cfg else 1,
        candidate_limit=trial_cfg.candidate_limit if trial_cfg else 10,
        test_limit=trial_cfg.test_limit if trial_cfg else 2,
        is_trial=True,
        signup_method="public",
        trial_ends_at=datetime.now() + timedelta(days=trial_cfg.trial_duration_days if trial_cfg else 5),
        is_active=True,
    )
    db.add(ent)
    db.flush()

    user = User(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.contact_name,
        email=data.email,
        phone=data.phone,
        role=UserRole.enterprise,
        enterprise_id=ent.id,
        is_active=True,
    )
    db.add(user)

    req = SignupRequest(
        company_name=data.company_name,
        contact_name=data.contact_name,
        email=data.email,
        phone=data.phone,
        username=data.username,
        hashed_password=get_password_hash(data.password),
        industry=data.industry,
        status=SignupRequestStatus.approved,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    background_tasks.add_task(
        send_welcome_email,
        to_email=data.email,
        company_name=data.company_name,
        username=data.username,
        password=data.password,
        subject="Welcome to TestFlow — Your Account is Active!",
    )

    return req


# ── Forgot Password ────────────────────────────────────────────────────────────

@router.post("/forgot-password/send-otp")
def send_otp(payload: schemas.ForgotPasswordSendOTP, db: Session = Depends(get_db)):
    """Step 1: Send OTP to the registered mobile number."""
    variants = _normalize_phone(payload.phone)

    # Find enterprise/hr user matching any phone variant
    user = db.query(User).filter(
        User.phone.in_(variants),
        User.role.in_([UserRole.enterprise, UserRole.hr])
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this mobile number. Please use the number registered during signup.")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="This account is deactivated. Please contact support.")

    # Use the stored phone (canonical form in DB)
    stored_phone = user.phone

    # Invalidate old OTPs for this phone
    db.query(OTPRecord).filter(OTPRecord.phone == stored_phone, OTPRecord.is_used == False).update({"is_used": True})
    db.commit()

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    record = OTPRecord(
        phone=stored_phone,
        otp=otp,
        expires_at=datetime.now() + timedelta(minutes=10),
    )
    db.add(record)
    db.commit()

    # Send SMS (if MsgClub configured)
    _send_sms_otp(stored_phone, otp)

    # Always send OTP via email as well (reliable fallback)
    if user.email:
        _send_otp_email(user.email, otp, user.username)

    last4 = stored_phone[-4:]
    return {
        "message": f"OTP sent to your registered mobile number ending in {last4} and email address.",
        "username": user.username,
        "stored_phone": stored_phone,  # send back so frontend uses correct format
    }


@router.post("/forgot-password/verify-otp")
def verify_otp(payload: schemas.ForgotPasswordVerifyOTP, db: Session = Depends(get_db)):
    """Step 2: Verify OTP."""
    variants = _normalize_phone(payload.phone)

    record = db.query(OTPRecord).filter(
        OTPRecord.phone.in_(variants),
        OTPRecord.otp == payload.otp,
        OTPRecord.is_used == False,
        OTPRecord.expires_at > datetime.now(),
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please try again.")

    return {"message": "OTP verified successfully.", "verified": True, "stored_phone": record.phone}


@router.post("/forgot-password/reset")
def reset_password(
    payload: schemas.ForgotPasswordReset,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Step 3: Reset password after OTP verified."""
    phone = payload.phone.strip()

    variants = _normalize_phone(phone)

    # Re-verify OTP is still valid
    record = db.query(OTPRecord).filter(
        OTPRecord.phone.in_(variants),
        OTPRecord.otp == payload.otp,
        OTPRecord.is_used == False,
        OTPRecord.expires_at > datetime.now(),
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="OTP expired or invalid. Please restart the process.")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Find user using stored phone from OTP record
    user = db.query(User).filter(User.phone == record.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Update password
    user.hashed_password = get_password_hash(payload.new_password)

    # Mark OTP as used
    record.is_used = True
    db.commit()

    # Send confirmation email with new credentials
    if user.email:
        background_tasks.add_task(
            send_welcome_email,
            to_email=user.email,
            company_name=user.full_name or user.username,
            username=user.username,
            password=payload.new_password,
            subject="TestFlow — Your Password Has Been Reset",
        )

    return {"message": "Password reset successfully. Your new credentials have been sent to your registered email."}

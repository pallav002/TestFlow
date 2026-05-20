from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Float, BigInteger, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base
import enum


# ── Enums ──────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    superadmin = "superadmin"
    enterprise = "enterprise"
    hr         = "hr"
    candidate  = "candidate"

class HRType(str, enum.Enum):
    senior = "senior"
    junior = "junior"

class PlanType(str, enum.Enum):
    trial      = "trial"
    basic      = "basic"
    pro        = "pro"
    enterprise = "enterprise"
    custom     = "custom"

class SignupRequestStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"

class UpgradeRequestStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"

class InterviewStatus(str, enum.Enum):
    pending      = "pending"
    attended     = "attended"
    shortlisted  = "shortlisted"
    rejected     = "rejected"
    absent       = "absent"
    rescheduled  = "rescheduled"

class JobStatus(str, enum.Enum):
    open     = "open"
    closed   = "closed"
    on_hold  = "on_hold"


# ── Enterprise (Client Company) ────────────────────────────────────────────────

class Enterprise(Base):
    __tablename__ = "enterprises"

    id                  = Column(Integer, primary_key=True, index=True)
    name                = Column(String, nullable=False, index=True)
    gst_number          = Column(String, nullable=True)
    logo_url            = Column(String, nullable=True)
    address             = Column(Text, nullable=True)
    city                = Column(String, nullable=True)
    state               = Column(String, nullable=True)
    phone               = Column(String, nullable=True)
    email               = Column(String, nullable=False, unique=True)
    website             = Column(String, nullable=True)
    industry            = Column(String, default="IT")

    # Plan & Limits
    plan                = Column(String, default=PlanType.trial)
    hr_limit            = Column(Integer, default=1)        # -1 = unlimited
    candidate_limit     = Column(Integer, default=10)       # -1 = unlimited
    test_limit          = Column(Integer, default=2)        # -1 = unlimited
    trial_ends_at       = Column(DateTime, nullable=True)
    is_trial            = Column(Boolean, default=True)
    signup_method       = Column(String, default="manual")  # "manual" or "public"
    is_active           = Column(Boolean, default=True)
    created_at          = Column(DateTime, default=datetime.now)
    updated_at          = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    users               = relationship("User", back_populates="enterprise", cascade="all, delete-orphan")
    tests               = relationship("Test", back_populates="enterprise", cascade="all, delete-orphan")
    job_openings        = relationship("JobOpening", back_populates="enterprise", cascade="all, delete-orphan")
    interview_schedules = relationship("InterviewSchedule", back_populates="enterprise", cascade="all, delete-orphan")
    upgrade_requests    = relationship("UpgradeRequest", back_populates="enterprise", cascade="all, delete-orphan")


# ── User (SuperAdmin / Enterprise / HR / Candidate) ────────────────────────────

class User(Base):
    __tablename__ = "users"

    id                = Column(Integer, primary_key=True, index=True)
    username          = Column(String, unique=True, index=True, nullable=False)
    hashed_password   = Column(String, nullable=False)
    full_name         = Column(String, nullable=True)
    email             = Column(String, nullable=True)
    phone             = Column(String, nullable=True)

    # Role system
    role              = Column(String, default=UserRole.candidate)   # superadmin/enterprise/hr/candidate
    hr_type           = Column(String, nullable=True)                 # senior/junior (only for hr role)
    is_active         = Column(Boolean, default=True)
    created_at        = Column(DateTime, default=datetime.now)

    # Enterprise link (null for superadmin)
    enterprise_id     = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=True)

    # HR-specific fields
    employee_id       = Column(String, nullable=True)
    department        = Column(String, nullable=True)

    # Track who created this user (for Junior HR data isolation)
    created_by_id     = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Candidate-specific fields
    college_or_company = Column(String, nullable=True)
    experience_level   = Column(String, nullable=True)  # Fresher/1-3yr/3-5yr/5+yr
    skills             = Column(Text, nullable=True)     # comma-separated
    temp_password      = Column(String, nullable=True)   # plain-text copy for email delivery only

    # Relationships
    enterprise         = relationship("Enterprise", back_populates="users")
    submissions        = relationship("Submission", back_populates="user")
    assignments        = relationship("CandidateTestAssignment", back_populates="user", foreign_keys="CandidateTestAssignment.user_id", cascade="all, delete-orphan")
    interviews         = relationship("InterviewSchedule", back_populates="user", foreign_keys="InterviewSchedule.user_id", cascade="all, delete-orphan")

    # Backward compat helper
    @property
    def is_admin(self):
        return self.role in (UserRole.superadmin, UserRole.enterprise, UserRole.hr)


# ── Free Trial Global Settings ─────────────────────────────────────────────────

class TrialSettings(Base):
    __tablename__ = "trial_settings"

    id                  = Column(Integer, primary_key=True, index=True)
    trial_duration_days = Column(Integer, default=5)
    hr_limit            = Column(Integer, default=1)
    candidate_limit     = Column(Integer, default=10)
    test_limit          = Column(Integer, default=2)
    updated_at          = Column(DateTime, default=datetime.now, onupdate=datetime.now)


# ── Signup Request (company signs up from website) ─────────────────────────────

class SignupRequest(Base):
    __tablename__ = "signup_requests"

    id             = Column(Integer, primary_key=True, index=True)
    company_name   = Column(String, nullable=False)
    contact_name   = Column(String, nullable=False)
    email          = Column(String, nullable=False)
    phone          = Column(String, nullable=True)
    username       = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    industry       = Column(String, nullable=True)
    status         = Column(String, default=SignupRequestStatus.pending)
    rejection_note = Column(Text, nullable=True)
    created_at     = Column(DateTime, default=datetime.now)


# ── Upgrade Request ────────────────────────────────────────────────────────────

class UpgradeRequest(Base):
    __tablename__ = "upgrade_requests"

    id            = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False)
    requested_plan = Column(String, nullable=False)
    contact_name  = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    notes         = Column(Text, nullable=True)
    status        = Column(String, default=UpgradeRequestStatus.pending)
    created_at    = Column(DateTime, default=datetime.now)

    enterprise    = relationship("Enterprise", back_populates="upgrade_requests")


# ── Test ───────────────────────────────────────────────────────────────────────

class Test(Base):
    __tablename__ = "tests"

    id                       = Column(Integer, primary_key=True, index=True)
    enterprise_id            = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=True)
    created_by_id            = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title                    = Column(String, index=True, nullable=False)
    description              = Column(Text, nullable=True)
    duration_minutes         = Column(Integer, default=30)
    time_per_question_seconds = Column(Integer, default=60)
    total_questions_limit    = Column(Integer, default=0)
    category                 = Column(String, default="Technical")   # Technical/Aptitude/HR Round
    passing_score            = Column(Float, default=60.0)           # percentage
    is_active                = Column(Boolean, default=True)
    created_at               = Column(DateTime, default=datetime.now)

    enterprise    = relationship("Enterprise", back_populates="tests")
    created_by    = relationship("User", foreign_keys=[created_by_id])
    questions     = relationship("Question", back_populates="test", cascade="save-update, merge, delete")
    submissions   = relationship("Submission", back_populates="test")
    uploaded_pdfs = relationship("UploadedPDF", back_populates="test", cascade="all, delete-orphan")
    assignments   = relationship("CandidateTestAssignment", back_populates="test", cascade="all, delete-orphan")


# ── Question ───────────────────────────────────────────────────────────────────

class Question(Base):
    __tablename__ = "questions"

    id             = Column(Integer, primary_key=True, index=True)
    test_id        = Column(Integer, ForeignKey("tests.id", ondelete="SET NULL"), nullable=True)
    question_text  = Column(Text, nullable=False)
    option_a       = Column(String, nullable=False)
    option_b       = Column(String, nullable=False)
    option_c       = Column(String, nullable=False)
    option_d       = Column(String, nullable=False)
    correct_option = Column(String, nullable=False)   # A/B/C/D
    marks          = Column(Float, default=1.0)

    test = relationship("Test", back_populates="questions")


# ── Uploaded PDF ───────────────────────────────────────────────────────────────

class UploadedPDF(Base):
    __tablename__ = "uploaded_pdfs"

    id                  = Column(Integer, primary_key=True, index=True)
    test_id             = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    original_filename   = Column(String, nullable=False)
    stored_filename     = Column(String, nullable=False)
    file_size_bytes     = Column(BigInteger, default=0)
    questions_extracted = Column(Integer, default=0)
    uploaded_at         = Column(DateTime, default=datetime.now)

    test = relationship("Test", back_populates="uploaded_pdfs")


# ── Candidate Test Assignment ──────────────────────────────────────────────────

class CandidateTestAssignment(Base):
    __tablename__ = "candidate_test_assignments"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    test_id     = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    login_start = Column(DateTime, nullable=True)
    login_end   = Column(DateTime, nullable=True)
    assigned_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="assignments", foreign_keys=[user_id])
    test = relationship("Test", back_populates="assignments")


# ── Submission ─────────────────────────────────────────────────────────────────

class Submission(Base):
    __tablename__ = "submissions"

    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    test_id             = Column(Integer, ForeignKey("tests.id", ondelete="SET NULL"), nullable=True)
    enterprise_id       = Column(Integer, ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True)

    # Audit fields
    candidate_username  = Column(String)
    candidate_name      = Column(String)
    test_title          = Column(String)

    # Analytics
    total_questions     = Column(Integer, default=0)
    attempted_questions = Column(Integer, default=0)
    correct_answers     = Column(Integer, default=0)
    wrong_answers       = Column(Integer, default=0)
    score               = Column(Float, default=0.0)
    accuracy            = Column(Float, default=0.0)
    passed              = Column(Boolean, default=False)

    started_at          = Column(DateTime, default=datetime.now)
    submitted_at        = Column(DateTime, nullable=True)
    answers_json        = Column(Text)

    user       = relationship("User", back_populates="submissions")
    test       = relationship("Test", back_populates="submissions")


# ── Job Opening ────────────────────────────────────────────────────────────────

class JobOpening(Base):
    __tablename__ = "job_openings"

    id                   = Column(Integer, primary_key=True, index=True)
    enterprise_id        = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=True)
    created_by_id        = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title                = Column(String, nullable=False)
    department           = Column(String, nullable=True)
    location             = Column(String, nullable=True)
    job_type             = Column(String, default="Full-Time")
    experience_level     = Column(String, default="Any")
    min_experience_years = Column(Integer, default=0)
    max_experience_years = Column(Integer, nullable=True)
    skills_required      = Column(Text, nullable=True)
    jd_description       = Column(Text, nullable=True)
    responsibilities     = Column(Text, nullable=True)
    qualifications       = Column(Text, nullable=True)
    salary_range         = Column(String, nullable=True)
    vacancies            = Column(Integer, default=1)
    status               = Column(String, default=JobStatus.open)
    is_active            = Column(Boolean, default=True)
    created_at           = Column(DateTime, default=datetime.now)
    updated_at           = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    enterprise  = relationship("Enterprise", back_populates="job_openings")
    created_by  = relationship("User", foreign_keys=[created_by_id])


# ── OTP for Forgot Password ───────────────────────────────────────────────────

class OTPRecord(Base):
    __tablename__ = "otp_records"

    id         = Column(Integer, primary_key=True, index=True)
    phone      = Column(String, nullable=False, index=True)
    otp        = Column(String, nullable=False)
    is_used    = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now)


# ── Interview Schedule ─────────────────────────────────────────────────────────

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id                  = Column(Integer, primary_key=True, index=True)
    enterprise_id       = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=True)
    user_id             = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_by_id       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    candidate_name      = Column(String, nullable=False)
    candidate_username  = Column(String, nullable=False)
    interviewer_name    = Column(String, nullable=False)
    interview_date      = Column(DateTime, nullable=False)
    meeting_url         = Column(String, nullable=True)
    notes               = Column(Text, nullable=True)
    status              = Column(String, default=InterviewStatus.pending)
    created_at          = Column(DateTime, default=datetime.now)

    enterprise  = relationship("Enterprise", back_populates="interview_schedules")
    user        = relationship("User", back_populates="interviews", foreign_keys=[user_id])

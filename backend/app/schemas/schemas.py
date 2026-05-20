from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ── Auth / Token ───────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class TokenData(BaseModel):
    username: Optional[str] = None


# ── Enterprise ─────────────────────────────────────────────────────────────────

class EnterpriseCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = "IT"
    plan: Optional[str] = "trial"
    hr_limit: Optional[int] = 1
    candidate_limit: Optional[int] = 10
    test_limit: Optional[int] = 2
    # enterprise login credentials
    username: str
    password: str

class EnterpriseUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    plan: Optional[str] = None
    hr_limit: Optional[int] = None
    candidate_limit: Optional[int] = None
    test_limit: Optional[int] = None
    is_active: Optional[bool] = None

class EnterpriseOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    plan: str
    hr_limit: int
    candidate_limit: int
    test_limit: int
    is_trial: bool
    signup_method: str
    is_active: bool
    trial_ends_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── User / Auth ────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "candidate"
    hr_type: Optional[str] = None
    enterprise_id: Optional[int] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    college_or_company: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    hr_type: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    college_or_company: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    hr_type: Optional[str] = None
    is_active: bool
    enterprise_id: Optional[int] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    college_or_company: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# backward compat alias
User = UserOut


# ── Trial Settings ─────────────────────────────────────────────────────────────

class TrialSettingsUpdate(BaseModel):
    trial_duration_days: Optional[int] = None
    hr_limit: Optional[int] = None
    candidate_limit: Optional[int] = None
    test_limit: Optional[int] = None

class TrialSettingsOut(BaseModel):
    id: int
    trial_duration_days: int
    hr_limit: int
    candidate_limit: int
    test_limit: int
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Signup Request ─────────────────────────────────────────────────────────────

class SignupRequestCreate(BaseModel):
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    username: str
    password: str
    industry: Optional[str] = "IT"

class SignupRequestOut(BaseModel):
    id: int
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    username: str
    industry: Optional[str] = None
    status: str
    rejection_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Upgrade Request ────────────────────────────────────────────────────────────

class UpgradeRequestCreate(BaseModel):
    requested_plan: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None

class UpgradeRequestOut(BaseModel):
    id: int
    enterprise_id: int
    requested_plan: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime
    enterprise: Optional[EnterpriseOut] = None

    class Config:
        from_attributes = True


# ── Questions ──────────────────────────────────────────────────────────────────

class QuestionBase(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    marks: float = 1.0

class QuestionCreate(QuestionBase):
    correct_option: str

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    marks: Optional[float] = None

class Question(QuestionBase):
    id: int
    test_id: Optional[int] = None
    correct_option: str

    class Config:
        from_attributes = True

class QuestionOut(QuestionBase):  # Candidate view — no correct_option
    id: int
    test_id: Optional[int] = None

    class Config:
        from_attributes = True

class BulkQuestionsCreate(BaseModel):
    questions: List[QuestionCreate]

class AIGenerateRequest(BaseModel):
    topic: str
    count: int = 5
    difficulty: Optional[str] = "medium"  # easy / medium / hard


# ── Uploaded PDF ───────────────────────────────────────────────────────────────

class UploadedPDF(BaseModel):
    id: int
    test_id: int
    original_filename: str
    stored_filename: str
    file_size_bytes: int
    questions_extracted: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ── Tests ──────────────────────────────────────────────────────────────────────

class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int = 30
    time_per_question_seconds: int = 60
    total_questions_limit: int = 0
    category: Optional[str] = "Technical"
    passing_score: Optional[float] = 60.0
    is_active: bool = True

class TestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    time_per_question_seconds: Optional[int] = None
    total_questions_limit: Optional[int] = None
    category: Optional[str] = None
    passing_score: Optional[float] = None
    is_active: Optional[bool] = None

class Test(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration_minutes: int
    time_per_question_seconds: int
    total_questions_limit: int
    category: Optional[str] = None
    passing_score: Optional[float] = None
    is_active: bool
    enterprise_id: Optional[int] = None
    created_at: datetime
    questions: List[Question] = []
    uploaded_pdfs: List[UploadedPDF] = []

    class Config:
        from_attributes = True

class TestOut(BaseModel):  # Candidate view
    id: int
    title: str
    description: Optional[str] = None
    duration_minutes: int
    time_per_question_seconds: int
    total_questions_limit: int
    category: Optional[str] = None
    passing_score: Optional[float] = None
    is_active: bool
    created_at: datetime
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True


# ── Test Assignments ───────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    user_id: int
    test_id: int
    login_start: Optional[datetime] = None
    login_end: Optional[datetime] = None

class Assignment(BaseModel):
    id: int
    user_id: int
    test_id: int
    login_start: Optional[datetime] = None
    login_end: Optional[datetime] = None
    assigned_at: datetime
    candidate_username: Optional[str] = None
    candidate_name: Optional[str] = None
    test_title: Optional[str] = None

    class Config:
        from_attributes = True


# ── Job Openings ───────────────────────────────────────────────────────────────

class JobOpeningCreate(BaseModel):
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = "Full-Time"
    experience_level: Optional[str] = "Any"
    min_experience_years: Optional[int] = 0
    max_experience_years: Optional[int] = None
    skills_required: Optional[str] = None
    jd_description: Optional[str] = None
    responsibilities: Optional[str] = None
    qualifications: Optional[str] = None
    salary_range: Optional[str] = None
    vacancies: Optional[int] = 1
    status: Optional[str] = "open"

class JobOpeningUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    skills_required: Optional[str] = None
    jd_description: Optional[str] = None
    responsibilities: Optional[str] = None
    qualifications: Optional[str] = None
    salary_range: Optional[str] = None
    vacancies: Optional[int] = None
    status: Optional[str] = None

class JobOpening(BaseModel):
    id: int
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: str
    experience_level: str
    min_experience_years: int
    max_experience_years: Optional[int] = None
    skills_required: Optional[str] = None
    jd_description: Optional[str] = None
    responsibilities: Optional[str] = None
    qualifications: Optional[str] = None
    salary_range: Optional[str] = None
    vacancies: int
    status: str
    is_active: bool
    enterprise_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Interview Schedules ────────────────────────────────────────────────────────

class InterviewCreate(BaseModel):
    user_id: int
    interviewer_name: str
    interview_date: datetime
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "pending"

class InterviewUpdate(BaseModel):
    interviewer_name: Optional[str] = None
    interview_date: Optional[datetime] = None
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class Interview(BaseModel):
    id: int
    user_id: int
    enterprise_id: Optional[int] = None
    candidate_name: str
    candidate_username: str
    interviewer_name: str
    interview_date: datetime
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Submissions ────────────────────────────────────────────────────────────────

class SubmissionCreate(BaseModel):
    test_id: int
    answers_json: str

class Submission(BaseModel):
    id: int
    user_id: Optional[int] = None
    test_id: Optional[int] = None
    enterprise_id: Optional[int] = None
    candidate_username: Optional[str] = None
    candidate_name: Optional[str] = None
    test_title: Optional[str] = None
    total_questions: int
    attempted_questions: int
    correct_answers: int
    wrong_answers: int
    score: float
    accuracy: float
    passed: bool = False
    started_at: datetime
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Forgot Password ────────────────────────────────────────────────────────────

class ForgotPasswordSendOTP(BaseModel):
    phone: str

class ForgotPasswordVerifyOTP(BaseModel):
    phone: str
    otp: str

class ForgotPasswordReset(BaseModel):
    phone: str
    otp: str
    new_password: str


# forward ref update
Token.model_rebuild()

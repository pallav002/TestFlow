from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.db.session import get_db
from app.models.models import (
    Test, Question, UploadedPDF, User, UserRole, HRType,
    CandidateTestAssignment, Submission, JobOpening, InterviewSchedule, Enterprise
)
from app.schemas import schemas
from app.core.security import get_current_hr_user, get_password_hash
from app.utils.pdf_parser import parse_mcq_pdf
from app.utils.email import send_test_assignment_email
from app.core.config import settings
import shutil
import logging
import json
import re
import httpx
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent.parent


def _uploads_dir() -> Path:
    d = BASE_DIR / "uploads"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _enterprise_id(current_user: User) -> Optional[int]:
    """Return enterprise_id filter — None for superadmin (sees all)."""
    if current_user.role == UserRole.superadmin:
        return None
    return current_user.enterprise_id


def _hr_filter(current_user: User):
    """For Junior HR: filter by created_by_id. Senior HR/Enterprise/SuperAdmin: see all company data."""
    if current_user.role == UserRole.hr and current_user.hr_type == HRType.junior:
        return current_user.id
    return None


def _test_query(db: Session, current_user: User):
    q = db.query(Test).options(joinedload(Test.questions), joinedload(Test.uploaded_pdfs))
    eid = _enterprise_id(current_user)
    if eid:
        q = q.filter(Test.enterprise_id == eid)
    hr_id = _hr_filter(current_user)
    if hr_id:
        q = q.filter(Test.created_by_id == hr_id)
    return q


def _check_test_limit(db: Session, current_user: User):
    if current_user.enterprise_id:
        ent = db.query(Enterprise).filter(Enterprise.id == current_user.enterprise_id).first()
        if ent and ent.test_limit != -1:
            count = db.query(Test).filter(Test.enterprise_id == ent.id).count()
            if count >= ent.test_limit:
                raise HTTPException(status_code=400, detail=f"Test limit reached ({ent.test_limit}). Please upgrade your plan.")


# ── Tests ──────────────────────────────────────────────────────────────────────

@router.post("/tests", response_model=schemas.Test)
def create_test(test_in: schemas.TestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    _check_test_limit(db, current_user)
    test = Test(
        **test_in.model_dump(),
        enterprise_id=current_user.enterprise_id,
        created_by_id=current_user.id,
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    return test


@router.get("/tests", response_model=List[schemas.Test])
def list_tests(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    return _test_query(db, current_user).order_by(Test.created_at.desc()).all()


@router.get("/tests/{test_id}", response_model=schemas.Test)
def get_test(test_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    test = _test_query(db, current_user).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test


@router.put("/tests/{test_id}", response_model=schemas.Test)
def update_test(test_id: int, test_in: schemas.TestUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    test = _test_query(db, current_user).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    for field, value in test_in.model_dump(exclude_none=True).items():
        setattr(test, field, value)
    db.commit()
    db.refresh(test)
    return test


@router.patch("/tests/{test_id}/toggle-active", response_model=schemas.Test)
def toggle_test(test_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    test = _test_query(db, current_user).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    test.is_active = not test.is_active
    db.commit()
    db.refresh(test)
    return test


@router.delete("/tests/{test_id}")
def delete_test(test_id: int, delete_questions: bool = True, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    test = _test_query(db, current_user).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if not delete_questions:
        for q in test.questions:
            q.test_id = None
    db.delete(test)
    db.commit()
    return {"message": "Test deleted"}


# ── Questions ──────────────────────────────────────────────────────────────────

@router.get("/tests/{test_id}/questions", response_model=List[schemas.Question])
def list_questions(test_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    return db.query(Question).filter(Question.test_id == test_id).all()


@router.put("/questions/{question_id}", response_model=schemas.Question)
def update_question(question_id: int, data: schemas.QuestionUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(q, field, value)
    db.commit()
    db.refresh(q)
    return q


@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted"}


@router.post("/tests/{test_id}/questions", response_model=schemas.Question)
def add_question_manual(
    test_id: int,
    data: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    test = _test_query(db, current_user).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    q = Question(test_id=test_id, **data.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.post("/tests/{test_id}/ai-generate")
async def ai_generate_questions(
    test_id: int,
    payload: schemas.AIGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY not configured on server.")
    test = _test_query(db, current_user).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    count = max(1, payload.count)
    prompt = (
        f"Generate exactly {count} multiple-choice questions on the topic: '{payload.topic}'.\n"
        f"Difficulty: {payload.difficulty or 'medium'}.\n"
        "Return ONLY a valid JSON array. Each element must have keys: "
        "question_text, option_a, option_b, option_c, option_d, correct_option (A/B/C/D).\n"
        "If the question or options contain code snippets, include them as plain text (no markdown fencing).\n"
        "No extra text, no explanation — only the JSON array."
    )

    body = {"contents": [{"parts": [{"text": prompt}]}]}
    # Try models in order — fall back if one is unavailable
    models_to_try = [
        ("v1beta", "gemini-2.5-flash"),
        ("v1beta", "gemini-2.0-flash"),
        ("v1beta", "gemini-2.0-flash-lite"),
    ]
    last_error = None

    for api_ver, model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/{api_ver}/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
        try:
            async with httpx.AsyncClient(timeout=40) as client:
                resp = await client.post(url, json=body)
            if resp.status_code in (404, 503, 429, 500):
                last_error = f"Model {model} returned {resp.status_code}"
                logger.warning(f"Gemini model {model} unavailable ({resp.status_code}), trying next...")
                continue
            resp.raise_for_status()
            raw = resp.json()
            text = raw["candidates"][0]["content"]["parts"][0]["text"]
            text = text.strip()
            if text.startswith("```"):
                text = re.sub(r"^```[a-z]*\n?", "", text)
                text = re.sub(r"```$", "", text.strip())
            questions = json.loads(text.strip())
            break
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Gemini model {model} failed: {e}, trying next...")
            continue
    else:
        logger.error(f"All Gemini models failed. Last error: {last_error}")
        if "429" in str(last_error):
            detail = "AI quota limit reached. Free usage limit has been exceeded. Please try again after some time or contact support."
        elif "401" in str(last_error) or "403" in str(last_error):
            detail = "Gemini API key is invalid or expired. Please contact your administrator."
        else:
            detail = f"AI generation failed. Please try again in a few minutes."
        raise HTTPException(status_code=502, detail=detail)

    # Validate and return — do NOT save yet (HR previews first)
    result = []
    for item in questions:
        if all(k in item for k in ("question_text", "option_a", "option_b", "option_c", "option_d", "correct_option")):
            item["correct_option"] = item["correct_option"].upper()
            item["marks"] = item.get("marks", 1.0)
            result.append(item)

    return {"questions": result, "count": len(result)}


@router.post("/tests/{test_id}/questions/bulk", response_model=List[schemas.Question])
def save_questions_bulk(
    test_id: int,
    data: schemas.BulkQuestionsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    test = _test_query(db, current_user).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    saved = []
    for qdata in data.questions:
        q = Question(test_id=test_id, **qdata.model_dump())
        db.add(q)
        saved.append(q)
    db.commit()
    for q in saved:
        db.refresh(q)
    return saved


# ── PDF Upload ─────────────────────────────────────────────────────────────────

@router.post("/tests/{test_id}/upload-pdf")
def upload_pdf(
    test_id: int,
    file: UploadFile = File(...),
    mode: str = Query("append", pattern="^(append|replace)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    test = _test_query(db, current_user).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    uploads = _uploads_dir()
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    stored = f"{ts}_{file.filename}"
    path = uploads / stored
    with path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    if mode == "replace":
        db.query(Question).filter(Question.test_id == test_id).delete()
        db.query(UploadedPDF).filter(UploadedPDF.test_id == test_id).delete()

    # ── Parse and validate ────────────────────────────────────────────────────
    try:
        questions_data, skipped_data = parse_mcq_pdf(str(path))
    except Exception as e:
        path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not read this PDF. This usually happens with scanned/image-based PDFs. "
                "Please upload a text-based PDF (created from Word, Google Docs, etc.). "
                f"Technical detail: {str(e)}"
            )
        )

    # ── Strict validation — reject entire PDF if any question is invalid ─────────
    if skipped_data:
        path.unlink(missing_ok=True)
        skip_lines = "\n".join(
            f"• Q{s['num']}: {s['reason']}" for s in skipped_data
        )
        raise HTTPException(
            status_code=422,
            detail=(
                f"PDF rejected — {len(skipped_data)} question(s) have errors and cannot be uploaded.\n\n"
                f"Fix the following issues in your PDF and re-upload:\n{skip_lines}\n\n"
                "All questions must have a complete question text, all four options (A, B, C, D), "
                "and an Answer line."
            )
        )

    if len(questions_data) == 0:
        import pdfplumber as _pl
        try:
            with _pl.open(str(path)) as pdf:
                raw = "\n".join(p.extract_text() or "" for p in pdf.pages).strip()
        except Exception:
            raw = ""

        path.unlink(missing_ok=True)

        if not raw:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No text could be extracted from this PDF. "
                    "This is likely a scanned image PDF. "
                    "Please use a text-based PDF created from Word, Google Docs, or similar tools."
                )
            )

        has_options = bool(re.search(r'[A-D][)\]\.]\s', raw))
        has_answer  = bool(re.search(r'(Answer|Ans)\s*[:\-]', raw, re.I))
        has_numbers = bool(re.search(r'^\s*\d+[\.\)]\s', raw, re.M))

        reasons = []
        if not has_numbers:
            reasons.append("Question numbers not found — each question must start with a number (e.g. 1. or Q1.)")
        if not has_options:
            reasons.append("Options A) B) C) D) not detected — every question needs all four options")
        if not has_answer:
            reasons.append("Answer line missing — add 'Answer: A' (or B/C/D) after each question")

        detail = "No valid MCQ questions could be extracted. "
        if reasons:
            detail += "Reason(s): " + "; ".join(reasons) + ". "
        detail += (
            "Required format: question number, then options A) B) C) D) each on a new line, "
            "then 'Answer: X'. See the format guide on the upload page."
        )
        raise HTTPException(status_code=422, detail=detail)

    for qd in questions_data:
        db.add(Question(test_id=test_id, **qd))

    pdf_record = UploadedPDF(
        test_id=test_id,
        original_filename=file.filename,
        stored_filename=stored,
        file_size_bytes=path.stat().st_size,
        questions_extracted=len(questions_data),
    )
    db.add(pdf_record)
    db.commit()
    return {
        "questions_extracted": len(questions_data),
        "filename": stored,
        "skipped": [],
    }


@router.get("/tests/{test_id}/pdfs", response_model=List[schemas.UploadedPDF])
def list_pdfs(test_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    return db.query(UploadedPDF).filter(UploadedPDF.test_id == test_id).all()


@router.delete("/pdfs/{pdf_id}")
def delete_pdf(
    pdf_id: int, 
    delete_questions: bool = Query(False), 
    db: Session = Depends(get_db), 
    _: User = Depends(get_current_hr_user)
):
    pdf = db.query(UploadedPDF).filter(UploadedPDF.id == pdf_id).first()
    if not pdf:
        # Already gone or never existed, return success to be idempotent
        return {"message": "PDF already deleted"}
    
    try:
        if delete_questions:
            db.query(Question).filter(Question.test_id == pdf.test_id).delete()
            
        path = _uploads_dir() / pdf.stored_filename
        if path.exists() and path.is_file():
            try:
                path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete physical file {path}: {e}")
        
        db.delete(pdf)
        db.commit()
        return {"message": "PDF deleted"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error in delete_pdf: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Candidates ─────────────────────────────────────────────────────────────────

def _candidate_query(db: Session, current_user: User):
    q = db.query(User).filter(User.role == UserRole.candidate)
    eid = _enterprise_id(current_user)
    if eid:
        q = q.filter(User.enterprise_id == eid)
    hr_id = _hr_filter(current_user)
    if hr_id:
        # Junior HR sees only candidates they created
        q = q.filter(User.created_by_id == hr_id)
    return q


def _check_candidate_limit(db: Session, current_user: User):
    if current_user.enterprise_id:
        ent = db.query(Enterprise).filter(Enterprise.id == current_user.enterprise_id).first()
        if ent and ent.candidate_limit != -1:
            count = db.query(User).filter(User.enterprise_id == ent.id, User.role == UserRole.candidate).count()
            if count >= ent.candidate_limit:
                raise HTTPException(status_code=400, detail=f"Candidate limit reached ({ent.candidate_limit}). Please upgrade your plan.")


@router.get("/candidates", response_model=List[schemas.UserOut])
def list_candidates(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    return _candidate_query(db, current_user).all()


@router.post("/users", response_model=schemas.UserOut)
def create_user(data: schemas.UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    if data.role == UserRole.candidate:
        _check_candidate_limit(db, current_user)
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        temp_password=data.password,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        role=data.role or UserRole.candidate,
        enterprise_id=current_user.enterprise_id,
        created_by_id=current_user.id,
        college_or_company=data.college_or_company,
        experience_level=data.experience_level,
        skills=data.skills,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/candidates/{user_id}", response_model=schemas.UserOut)
def update_candidate(user_id: int, data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    user = _candidate_query(db, current_user).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found")
    update_data = data.model_dump(exclude_none=True)
    if "password" in update_data:
        user.hashed_password = get_password_hash(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/candidates/{user_id}")
def delete_candidate(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    user = _candidate_query(db, current_user).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(user)
    db.commit()
    return {"message": "Candidate deleted"}


# ── Results ────────────────────────────────────────────────────────────────────

@router.get("/results", response_model=List[schemas.Submission])
def list_results(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    q = db.query(Submission)
    eid = _enterprise_id(current_user)
    if eid:
        q = q.filter(Submission.enterprise_id == eid)
    hr_id = _hr_filter(current_user)
    if hr_id:
        # Junior HR sees only results for their own candidates
        candidate_ids = db.query(User.id).filter(
            User.created_by_id == hr_id,
            User.role == UserRole.candidate,
        ).subquery()
        q = q.filter(Submission.user_id.in_(candidate_ids))
    return q.order_by(Submission.submitted_at.desc()).all()


@router.delete("/results/{submission_id}")
def delete_result(submission_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    db.delete(sub)
    db.commit()
    return {"message": "Submission deleted"}


# ── Assignments ────────────────────────────────────────────────────────────────

@router.post("/assignments", response_model=schemas.Assignment)
def create_assignment(data: schemas.AssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    existing = db.query(CandidateTestAssignment).filter(
        CandidateTestAssignment.user_id == data.user_id,
        CandidateTestAssignment.test_id == data.test_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Test already assigned to this candidate")
    assignment = CandidateTestAssignment(
        user_id=data.user_id,
        test_id=data.test_id,
        login_start=data.login_start,
        login_end=data.login_end,
        assigned_by=current_user.id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    candidate = db.query(User).filter(User.id == data.user_id).first()
    test = db.query(Test).filter(Test.id == data.test_id).first()

    # Send assignment email to candidate
    if candidate and candidate.email and test:
        enterprise = db.query(Enterprise).filter(Enterprise.id == current_user.enterprise_id).first()
        company_name = enterprise.name if enterprise else "Your Company"

        def _fmt(dt):
            if not dt:
                return None
            try:
                from datetime import timezone
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.strftime("%d %b %Y, %I:%M %p")
            except Exception:
                return str(dt)

        send_test_assignment_email(
            to_email=candidate.email,
            candidate_name=candidate.full_name or candidate.username,
            company_name=company_name,
            username=candidate.username,
            password=candidate.temp_password or "—",
            test_title=test.title,
            login_start=_fmt(assignment.login_start),
            login_end=_fmt(assignment.login_end),
            login_url=f"{settings.FRONTEND_URL}/login",
        )

    return schemas.Assignment(
        id=assignment.id,
        user_id=assignment.user_id,
        test_id=assignment.test_id,
        login_start=assignment.login_start,
        login_end=assignment.login_end,
        assigned_at=assignment.assigned_at,
        candidate_username=candidate.username if candidate else None,
        candidate_name=candidate.full_name if candidate else None,
        test_title=test.title if test else None,
    )


@router.get("/assignments", response_model=List[schemas.Assignment])
def list_assignments(db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    assignments = db.query(CandidateTestAssignment).all()
    result = []
    for a in assignments:
        candidate = db.query(User).filter(User.id == a.user_id).first()
        test = db.query(Test).filter(Test.id == a.test_id).first()
        result.append(schemas.Assignment(
            id=a.id, user_id=a.user_id, test_id=a.test_id,
            login_start=a.login_start, login_end=a.login_end, assigned_at=a.assigned_at,
            candidate_username=candidate.username if candidate else None,
            candidate_name=candidate.full_name if candidate else None,
            test_title=test.title if test else None,
        ))
    return result


@router.get("/candidates/{user_id}/assignments", response_model=List[schemas.Assignment])
def candidate_assignments(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    assignments = db.query(CandidateTestAssignment).filter(CandidateTestAssignment.user_id == user_id).all()
    result = []
    for a in assignments:
        test = db.query(Test).filter(Test.id == a.test_id).first()
        candidate = db.query(User).filter(User.id == a.user_id).first()
        result.append(schemas.Assignment(
            id=a.id, user_id=a.user_id, test_id=a.test_id,
            login_start=a.login_start, login_end=a.login_end, assigned_at=a.assigned_at,
            candidate_username=candidate.username if candidate else None,
            candidate_name=candidate.full_name if candidate else None,
            test_title=test.title if test else None,
        ))
    return result


@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    a = db.query(CandidateTestAssignment).filter(CandidateTestAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(a)
    db.commit()
    return {"message": "Assignment deleted"}


# ── Jobs ───────────────────────────────────────────────────────────────────────

@router.post("/jobs", response_model=schemas.JobOpening)
def create_job(data: schemas.JobOpeningCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    job = JobOpening(**data.model_dump(), enterprise_id=current_user.enterprise_id, created_by_id=current_user.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs", response_model=List[schemas.JobOpening])
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    q = db.query(JobOpening)
    eid = _enterprise_id(current_user)
    if eid:
        q = q.filter(JobOpening.enterprise_id == eid)
    return q.order_by(JobOpening.created_at.desc()).all()


@router.put("/jobs/{job_id}", response_model=schemas.JobOpening)
def update_job(job_id: int, data: schemas.JobOpeningUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    job = db.query(JobOpening).filter(JobOpening.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    job = db.query(JobOpening).filter(JobOpening.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}


# ── Interviews ─────────────────────────────────────────────────────────────────

@router.post("/interviews", response_model=schemas.Interview)
def create_interview(data: schemas.InterviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    candidate = db.query(User).filter(User.id == data.user_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    interview = InterviewSchedule(
        enterprise_id=current_user.enterprise_id,
        user_id=data.user_id,
        created_by_id=current_user.id,
        candidate_name=candidate.full_name or candidate.username,
        candidate_username=candidate.username,
        interviewer_name=data.interviewer_name,
        interview_date=data.interview_date,
        meeting_url=data.meeting_url,
        notes=data.notes,
        status=data.status or "pending",
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.get("/interviews", response_model=List[schemas.Interview])
def list_interviews(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_user)):
    q = db.query(InterviewSchedule)
    eid = _enterprise_id(current_user)
    if eid:
        q = q.filter(InterviewSchedule.enterprise_id == eid)
    hr_id = _hr_filter(current_user)
    if hr_id:
        q = q.filter(InterviewSchedule.created_by_id == hr_id)
    return q.order_by(InterviewSchedule.interview_date.desc()).all()


@router.put("/interviews/{interview_id}", response_model=schemas.Interview)
def update_interview(interview_id: int, data: schemas.InterviewUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    interview = db.query(InterviewSchedule).filter(InterviewSchedule.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(interview, field, value)
    db.commit()
    db.refresh(interview)
    return interview


@router.delete("/interviews/{interview_id}")
def delete_interview(interview_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_hr_user)):
    interview = db.query(InterviewSchedule).filter(InterviewSchedule.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    db.delete(interview)
    db.commit()
    return {"message": "Interview deleted"}

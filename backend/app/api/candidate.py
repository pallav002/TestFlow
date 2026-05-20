from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
from app.db.session import get_db
from app.models.models import User, Test, Submission, CandidateTestAssignment
from app.schemas import schemas
from app.core import security
from pydantic import BaseModel

router = APIRouter()


class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    college_or_company: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[str] = None


def _validate_window(db: Session, user_id: int, test_id: int) -> CandidateTestAssignment:
    now = datetime.now()
    assignment = db.query(CandidateTestAssignment).filter(
        CandidateTestAssignment.user_id == user_id,
        CandidateTestAssignment.test_id == test_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="This test is not assigned to you.")
    if assignment.login_start and assignment.login_start > now:
        raise HTTPException(status_code=403, detail=f"Test window not started yet. Starts at: {assignment.login_start}")
    if assignment.login_end and assignment.login_end < now:
        raise HTTPException(status_code=403, detail="Test window has expired.")
    return assignment


@router.get("/available-tests", response_model=List[schemas.TestOut])
def get_available_tests(db: Session = Depends(get_db), current_user: User = Depends(security.get_current_user)):
    now = datetime.now()
    submitted_ids = {s.test_id for s in current_user.submissions}
    assignments = db.query(CandidateTestAssignment).filter(CandidateTestAssignment.user_id == current_user.id).all()
    active_ids = [
        a.test_id for a in assignments
        if (a.login_start is None or a.login_start <= now)
        and (a.login_end is None or a.login_end >= now)
        and a.test_id not in submitted_ids
    ]
    if not active_ids:
        return []
    return db.query(Test).filter(Test.id.in_(active_ids), Test.is_active == True).all()


@router.get("/tests/{test_id}", response_model=schemas.TestOut)
def get_test_details(test_id: int, db: Session = Depends(get_db), current_user: User = Depends(security.get_current_user)):
    _validate_window(db, current_user.id, test_id)
    if db.query(Submission).filter(Submission.user_id == current_user.id, Submission.test_id == test_id).first():
        raise HTTPException(status_code=400, detail="Test already submitted")
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if test.total_questions_limit > 0 and len(test.questions) > test.total_questions_limit:
        test.questions = test.questions[:test.total_questions_limit]
    return test


@router.post("/tests/{test_id}/submit", response_model=schemas.Submission)
def submit_test(
    test_id: int,
    answers_in: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user),
):
    _validate_window(db, current_user.id, test_id)
    if db.query(Submission).filter(Submission.user_id == current_user.id, Submission.test_id == test_id).first():
        raise HTTPException(status_code=400, detail="Test already submitted")

    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    total_q = len(test.questions)
    attempted_q = correct_q = wrong_q = 0
    score = 0.0

    for q in test.questions:
        answer = answers_in.get(str(q.id))
        if answer:
            attempted_q += 1
            if answer == q.correct_option:
                correct_q += 1
                score += q.marks
            else:
                wrong_q += 1

    # Calculate accuracy based on total questions for pass/fail determination
    accuracy_of_total = (correct_q / total_q * 100) if total_q > 0 else 0.0
    
    # Accuracy metric for stats (still based on attempted for precision tracking)
    accuracy_stats = (correct_q / attempted_q * 100) if attempted_q > 0 else 0.0
    
    passing_score = test.passing_score or 60.0
    passed = accuracy_of_total >= passing_score

    submission = Submission(
        user_id=current_user.id,
        test_id=test_id,
        enterprise_id=current_user.enterprise_id,
        candidate_username=current_user.username,
        candidate_name=current_user.full_name,
        test_title=test.title,
        total_questions=total_q,
        attempted_questions=attempted_q,
        correct_answers=correct_q,
        wrong_answers=wrong_q,
        score=score,
        accuracy=accuracy_of_total,
        passed=passed,
        submitted_at=datetime.now(),
        answers_json=json.dumps(answers_in),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/profile", response_model=schemas.UserOut)
def get_profile(current_user: User = Depends(security.get_current_user)):
    return current_user


@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    data: CandidateProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/results", response_model=List[schemas.Submission])
def get_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user),
):
    return db.query(Submission).filter(
        Submission.user_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).all()

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Skill, AssessmentQuestion, SkillTestStatus, UserRole
from app.schemas import SkillResponse, QuizSubmission, QuizResult
from app.auth import get_current_user, require_roles, log_action

router = APIRouter(prefix="/api/skills", tags=["Skills & Assessment Module"])

@router.get("", response_model=List[SkillResponse])
def get_all_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    return skills

@router.get("/{skill_id}", response_model=SkillResponse)
def get_skill_detail(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found.")
    return skill

@router.post("/submit-quiz", response_model=QuizResult)
def submit_skill_quiz(
    quiz_in: QuizSubmission,
    current_user: User = Depends(require_roles([UserRole.ARTISAN])),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == quiz_in.skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found.")

    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.skill_id == quiz_in.skill_id).all()
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No assessment questions configured for this skill.")

    question_map = {q.id: q.correct_option for q in questions}
    total_questions = len(questions)
    correct_count = 0

    for answer in quiz_in.answers:
        expected = question_map.get(answer.question_id)
        if expected and answer.selected_option.upper() == expected.upper():
            correct_count += 1

    score_pct = (correct_count / total_questions) * 100.0 if total_questions > 0 else 0.0
    passed = score_pct >= 70.0  # 70% passing score barrier

    new_status = SkillTestStatus.PASSED if passed else SkillTestStatus.FAILED
    
    if current_user.artisan_profile:
        current_user.artisan_profile.skill_test_status = new_status
        db.commit()

    log_action(
        db,
        current_user.id,
        "SKILL_QUIZ_COMPLETED",
        f"Artisan took {skill.name} quiz. Score: {score_pct:.1f}% ({correct_count}/{total_questions}). Passed: {passed}"
    )

    return QuizResult(
        total_questions=total_questions,
        correct_count=correct_count,
        score_percentage=round(score_pct, 1),
        passed=passed,
        skill_test_status=new_status
    )

from uuid import UUID

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.cohort import CohortResponse
from app.schemas.student import StudentProfileResponse
from app.schemas.student_cohort_assignment import (
    StudentCohortAssignmentCreate,
    StudentCohortAssignmentDetailResponse,
    StudentCohortAssignmentUpdate,
)
from app.services.student_cohort_assignment import StudentCohortAssignmentService

router = APIRouter(
    prefix="/student-cohort-assignments",
)


@router.get(
    "/{assignment_id}",
    response_model=StudentCohortAssignmentDetailResponse,
)
def get_student_cohort_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
):
    service = StudentCohortAssignmentService(db)
    assignment = service.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return assignment


@router.get(
    "/student/{student_id}",
    response_model=list[CohortResponse],
)
def get_cohorts_for_student(
    student_id: UUID,
    db: Session = Depends(get_db),
):
    service = StudentCohortAssignmentService(db)
    cohorts = service.get_cohorts_for_student(student_id)
    return [CohortResponse.model_validate(c) for c in cohorts]


@router.get(
    "/cohort/{cohort_id}",
    response_model=list[StudentProfileResponse],
)
def get_students_in_cohort(
    cohort_id: UUID,
    db: Session = Depends(get_db),
):
    service = StudentCohortAssignmentService(db)
    students = service.get_students_in_cohort(cohort_id)
    return [StudentProfileResponse.model_validate(s) for s in students]


@router.post(
    "",
    response_model=StudentCohortAssignmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_student_to_cohort(
    data: StudentCohortAssignmentCreate,
    db: Session = Depends(get_db),
):
    service = StudentCohortAssignmentService(db)
    try:
        return service.assign_student(data)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{assignment_id}",
    response_model=StudentCohortAssignmentDetailResponse,
)
def update_student_cohort_assignment(
    assignment_id: UUID,
    data: StudentCohortAssignmentUpdate,
    db: Session = Depends(get_db),
):
    service = StudentCohortAssignmentService(db)
    try:
        assignment = service.update_assignment(assignment_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return assignment


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_student_cohort_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
):
    service = StudentCohortAssignmentService(db)
    try:
        removed = service.remove_assignment(assignment_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

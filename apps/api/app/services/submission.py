from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.submission import Submission
from app.db.models.submission_file import SubmissionFile
from app.db.models.submission_version import SubmissionVersion
from app.db.repositories.session import SessionRepository
from app.db.repositories.student import StudentRepository
from app.db.repositories.submission import SubmissionRepository
from app.db.repositories.team import TeamRepository
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionDetailResponse,
    SubmissionFileResponse,
    SubmissionResponse,
    SubmissionStatusUpdate,
    SubmissionVersionResponse,
    SubmissionVersionSubmit,
)


class SubmissionService:
    def __init__(self, db: Session):
        self.db = db
        self.submission_repo = SubmissionRepository(db)
        self.session_repo = SessionRepository(db)
        self.team_repo = TeamRepository(db)
        self.student_repo = StudentRepository(db)

    def _verify_user_and_team_membership(self, user_id: UUID, team_id: UUID) -> None:
        user = self.student_repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        # If user is a student, ensure they are an active member of the specified team
        if user.role == "student":
            student_data = self.student_repo.get_by_id(user_id)
            if not student_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Student profile for user {user_id} not found",
                )
            _, profile = student_data
            member = self.team_repo.get_member(team_id=team_id, student_id=profile.id)
            if not member or member.left_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is not an active member of this team",
                )

    def _build_version_response(
        self, version: SubmissionVersion
    ) -> SubmissionVersionResponse:
        files = self.submission_repo.get_files_by_version_id(version.id)
        return SubmissionVersionResponse(
            id=version.id,
            submission_id=version.submission_id,
            version_number=version.version_number,
            content=version.content,
            created_by=version.created_by,
            created_at=version.created_at,
            files=[SubmissionFileResponse.model_validate(f) for f in files],
        )

    def _build_submission_response(
        self, submission: Submission
    ) -> SubmissionResponse:
        latest = self.submission_repo.get_latest_version(submission.id)
        latest_resp = self._build_version_response(latest) if latest else None
        return SubmissionResponse(
            id=submission.id,
            task_id=submission.task_id,
            team_id=submission.team_id,
            submitted_by=submission.submitted_by,
            status=submission.status,
            submitted_at=submission.submitted_at,
            created_at=submission.created_at,
            updated_at=submission.updated_at,
            latest_version=latest_resp,
        )

    def _build_detail_response(
        self, submission: Submission
    ) -> SubmissionDetailResponse:
        versions = self.submission_repo.get_versions(submission.id)
        version_responses = [self._build_version_response(v) for v in versions]
        latest_resp = version_responses[-1] if version_responses else None

        return SubmissionDetailResponse(
            id=submission.id,
            task_id=submission.task_id,
            team_id=submission.team_id,
            submitted_by=submission.submitted_by,
            status=submission.status,
            submitted_at=submission.submitted_at,
            created_at=submission.created_at,
            updated_at=submission.updated_at,
            latest_version=latest_resp,
            versions=version_responses,
        )

    # -----------------------------------------------------------------------
    # Submission Operations
    # -----------------------------------------------------------------------

    def get_all(
        self,
        team_id: UUID | None = None,
        task_id: UUID | None = None,
        status: str | None = None,
    ) -> list[SubmissionResponse]:
        submissions = self.submission_repo.get_all(
            team_id=team_id,
            task_id=task_id,
            status=status,
        )
        return [self._build_submission_response(s) for s in submissions]

    def get_by_id(self, submission_id: UUID) -> SubmissionDetailResponse | None:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            return None
        return self._build_detail_response(submission)

    def create_or_append_submission(
        self, data: SubmissionCreate
    ) -> SubmissionDetailResponse:
        # Validate task
        task = self.session_repo.get_task_by_id(data.task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session task {data.task_id} not found",
            )

        # Validate team
        team = self.team_repo.get_by_id(data.team_id)
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Team {data.team_id} not found",
            )

        # Validate submitter and team membership
        self._verify_user_and_team_membership(data.submitted_by, data.team_id)

        now = datetime.now(timezone.utc)
        existing = self.submission_repo.get_by_task_and_team(
            task_id=data.task_id, team_id=data.team_id
        )

        if existing:
            # Append new version to existing submission
            next_version_number = (
                self.submission_repo.get_max_version_number(existing.id) + 1
            )
            version = SubmissionVersion(
                submission_id=existing.id,
                version_number=next_version_number,
                content=data.content,
                created_by=data.submitted_by,
                created_at=now,
            )
            files = [
                SubmissionFile(
                    file_name=f.file_name,
                    storage_path=f.storage_path,
                    mime_type=f.mime_type,
                    file_size=f.file_size,
                    created_at=now,
                )
                for f in data.files
            ]

            existing.submitted_by = data.submitted_by
            existing.submitted_at = now
            existing.status = data.status

            try:
                self.submission_repo.add_version(existing, version, files)
                return self._build_detail_response(existing)
            except IntegrityError as exc:
                self.submission_repo.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Database integrity violation while appending submission version",
                ) from exc

        # Create brand new submission
        submission = Submission(
            task_id=data.task_id,
            team_id=data.team_id,
            submitted_by=data.submitted_by,
            status=data.status,
            submitted_at=now,
        )
        version = SubmissionVersion(
            version_number=1,
            content=data.content,
            created_by=data.submitted_by,
            created_at=now,
        )
        files = [
            SubmissionFile(
                file_name=f.file_name,
                storage_path=f.storage_path,
                mime_type=f.mime_type,
                file_size=f.file_size,
                created_at=now,
            )
            for f in data.files
        ]

        try:
            created = self.submission_repo.create_submission(
                submission, version, files
            )
            return self._build_detail_response(created)
        except IntegrityError as exc:
            self.submission_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database integrity violation while creating submission",
            ) from exc

    def add_version(
        self, submission_id: UUID, data: SubmissionVersionSubmit
    ) -> SubmissionDetailResponse:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )

        self._verify_user_and_team_membership(
            data.submitted_by, submission.team_id
        )

        now = datetime.now(timezone.utc)
        next_version = (
            self.submission_repo.get_max_version_number(submission.id) + 1
        )

        version = SubmissionVersion(
            submission_id=submission.id,
            version_number=next_version,
            content=data.content,
            created_by=data.submitted_by,
            created_at=now,
        )
        files = [
            SubmissionFile(
                file_name=f.file_name,
                storage_path=f.storage_path,
                mime_type=f.mime_type,
                file_size=f.file_size,
                created_at=now,
            )
            for f in data.files
        ]

        submission.submitted_by = data.submitted_by
        submission.submitted_at = now
        submission.status = data.status

        try:
            self.submission_repo.add_version(submission, version, files)
            return self._build_detail_response(submission)
        except IntegrityError as exc:
            self.submission_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database integrity violation while adding version",
            ) from exc

    def update_status(
        self, submission_id: UUID, data: SubmissionStatusUpdate
    ) -> SubmissionResponse:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )
        updated = self.submission_repo.update_status(submission, data.status)
        return self._build_submission_response(updated)

    def get_versions(
        self, submission_id: UUID
    ) -> list[SubmissionVersionResponse]:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )
        versions = self.submission_repo.get_versions(submission_id)
        return [self._build_version_response(v) for v in versions]

    def get_version_by_number(
        self, submission_id: UUID, version_number: int
    ) -> SubmissionVersionResponse:
        version = self.submission_repo.get_version_by_number(
            submission_id, version_number
        )
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Version {version_number} not found for submission {submission_id}",
            )
        return self._build_version_response(version)

    def delete(self, submission_id: UUID) -> None:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )
        self.submission_repo.delete(submission)

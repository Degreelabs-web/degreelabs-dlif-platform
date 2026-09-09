from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.submission import Submission
from app.db.models.submission_file import SubmissionFile
from app.db.models.submission_version import SubmissionVersion


class SubmissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, submission_id: UUID) -> Submission | None:
        statement = select(Submission).where(Submission.id == submission_id)
        return self.db.scalar(statement)

    def get_by_task_and_team(
        self, task_id: UUID, team_id: UUID
    ) -> Submission | None:
        statement = select(Submission).where(
            Submission.task_id == task_id,
            Submission.team_id == team_id,
        )
        return self.db.scalar(statement)

    def get_all(
        self,
        team_id: UUID | None = None,
        task_id: UUID | None = None,
        status: str | None = None,
    ) -> list[Submission]:
        statement = select(Submission).order_by(Submission.created_at.desc())

        if team_id is not None:
            statement = statement.where(Submission.team_id == team_id)
        if task_id is not None:
            statement = statement.where(Submission.task_id == task_id)
        if status is not None:
            statement = statement.where(Submission.status == status)

        return list(self.db.scalars(statement).all())

    def get_max_version_number(self, submission_id: UUID) -> int:
        statement = select(
            func.coalesce(func.max(SubmissionVersion.version_number), 0)
        ).where(SubmissionVersion.submission_id == submission_id)
        return self.db.scalar(statement) or 0

    def get_versions(self, submission_id: UUID) -> list[SubmissionVersion]:
        statement = (
            select(SubmissionVersion)
            .where(SubmissionVersion.submission_id == submission_id)
            .order_by(SubmissionVersion.version_number.asc())
        )
        return list(self.db.scalars(statement).all())

    def get_version_by_number(
        self, submission_id: UUID, version_number: int
    ) -> SubmissionVersion | None:
        statement = select(SubmissionVersion).where(
            SubmissionVersion.submission_id == submission_id,
            SubmissionVersion.version_number == version_number,
        )
        return self.db.scalar(statement)

    def get_latest_version(
        self, submission_id: UUID
    ) -> SubmissionVersion | None:
        statement = (
            select(SubmissionVersion)
            .where(SubmissionVersion.submission_id == submission_id)
            .order_by(SubmissionVersion.version_number.desc())
            .limit(1)
        )
        return self.db.scalar(statement)

    def get_files_by_version_id(
        self, version_id: UUID
    ) -> list[SubmissionFile]:
        statement = (
            select(SubmissionFile)
            .where(SubmissionFile.submission_version_id == version_id)
            .order_by(SubmissionFile.created_at.asc())
        )
        return list(self.db.scalars(statement).all())

    def create_submission(
        self,
        submission: Submission,
        version: SubmissionVersion,
        files: list[SubmissionFile],
    ) -> Submission:
        self.db.add(submission)
        self.db.flush()

        version.submission_id = submission.id
        self.db.add(version)
        self.db.flush()

        for file_rec in files:
            file_rec.submission_version_id = version.id
            self.db.add(file_rec)

        self.db.commit()
        self.db.refresh(submission)
        return submission

    def add_version(
        self,
        submission: Submission,
        version: SubmissionVersion,
        files: list[SubmissionFile],
    ) -> SubmissionVersion:
        version.submission_id = submission.id
        self.db.add(version)
        self.db.flush()

        for file_rec in files:
            file_rec.submission_version_id = version.id
            self.db.add(file_rec)

        self.db.commit()
        self.db.refresh(version)
        self.db.refresh(submission)
        return version

    def update_status(
        self, submission: Submission, new_status: str
    ) -> Submission:
        submission.status = new_status
        self.db.commit()
        self.db.refresh(submission)
        return submission

    def delete(self, submission: Submission) -> None:
        self.db.delete(submission)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

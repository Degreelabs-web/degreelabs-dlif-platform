from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.student_profile import StudentProfile
from app.db.models.user import User


class StudentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        institution_id: UUID | None = None,
        status: str | None = None,
    ) -> list[tuple[User, StudentProfile]]:
        statement = (
            select(User, StudentProfile)
            .join(StudentProfile, User.id == StudentProfile.user_id)
            .where(User.role == "student")
            .order_by(User.full_name)
        )

        if institution_id is not None:
            statement = statement.where(
                StudentProfile.institution_id == institution_id
            )
        if status is not None:
            statement = statement.where(User.status == status)

        results = self.db.execute(statement).all()
        return [(row[0], row[1]) for row in results]

    def get_by_id(self, user_id: UUID) -> tuple[User, StudentProfile] | None:
        statement = (
            select(User, StudentProfile)
            .join(StudentProfile, User.id == StudentProfile.user_id)
            .where(User.id == user_id, User.role == "student")
        )
        row = self.db.execute(statement).first()
        return (row[0], row[1]) if row else None

    def get_user_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.db.scalar(statement)

    def get_user_by_id(self, user_id: UUID) -> User | None:
        statement = select(User).where(User.id == user_id)
        return self.db.scalar(statement)

    def create_student(
        self,
        user: User,
        profile: StudentProfile,
    ) -> tuple[User, StudentProfile]:
        self.db.add(user)
        self.db.flush()
        profile.user_id = user.id
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(profile)
        return user, profile

    def update_student(
        self,
        user: User,
        profile: StudentProfile,
    ) -> tuple[User, StudentProfile]:
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(profile)
        return user, profile

    def delete_student(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

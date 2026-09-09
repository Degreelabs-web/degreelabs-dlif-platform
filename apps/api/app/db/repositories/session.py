from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session as DBSession

from app.db.models.session import Session
from app.db.models.session_resource import SessionResource
from app.db.models.session_task import SessionTask


class SessionRepository:
    def __init__(self, db: DBSession):
        self.db = db

    # -----------------------------------------------------------------------
    # Session queries
    # -----------------------------------------------------------------------

    def get_by_id(self, session_id: UUID) -> Session | None:
        statement = select(Session).where(Session.id == session_id)
        return self.db.scalar(statement)

    def get_by_cohort_and_number(
        self, cohort_id: UUID, session_number: int
    ) -> Session | None:
        statement = select(Session).where(
            Session.cohort_id == cohort_id,
            Session.session_number == session_number,
        )
        return self.db.scalar(statement)

    def count_by_cohort(self, cohort_id: UUID) -> int:
        statement = select(func.count(Session.id)).where(
            Session.cohort_id == cohort_id
        )
        return self.db.scalar(statement) or 0

    def get_all(
        self,
        cohort_id: UUID | None = None,
        week_number: int | None = None,
        status: str | None = None,
    ) -> list[Session]:
        statement = select(Session).order_by(
            Session.week_number, Session.session_number
        )

        if cohort_id is not None:
            statement = statement.where(Session.cohort_id == cohort_id)
        if week_number is not None:
            statement = statement.where(Session.week_number == week_number)
        if status is not None:
            statement = statement.where(Session.status == status)

        return list(self.db.scalars(statement).all())

    def create(self, session: Session) -> Session:
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def create_batch(
        self,
        items: list[tuple[Session, list[SessionTask], list[SessionResource]]],
    ) -> list[Session]:
        created_sessions: list[Session] = []
        for session, tasks, resources in items:
            self.db.add(session)
            self.db.flush()
            for task in tasks:
                task.session_id = session.id
                self.db.add(task)
            for resource in resources:
                resource.session_id = session.id
                self.db.add(resource)
            created_sessions.append(session)

        self.db.commit()
        for session in created_sessions:
            self.db.refresh(session)
        return created_sessions

    def update(self, session: Session) -> Session:
        self.db.commit()
        self.db.refresh(session)
        return session

    def delete(self, session: Session) -> None:
        self.db.delete(session)
        self.db.commit()

    # -----------------------------------------------------------------------
    # Session Task queries
    # -----------------------------------------------------------------------

    def get_tasks(self, session_id: UUID) -> list[SessionTask]:
        statement = (
            select(SessionTask)
            .where(SessionTask.session_id == session_id)
            .order_by(SessionTask.created_at)
        )
        return list(self.db.scalars(statement).all())

    def get_task_by_id(self, task_id: UUID) -> SessionTask | None:
        statement = select(SessionTask).where(SessionTask.id == task_id)
        return self.db.scalar(statement)

    def create_task(self, task: SessionTask) -> SessionTask:
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update_task(self, task: SessionTask) -> SessionTask:
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete_task(self, task: SessionTask) -> None:
        self.db.delete(task)
        self.db.commit()

    # -----------------------------------------------------------------------
    # Session Resource queries
    # -----------------------------------------------------------------------

    def get_resources(self, session_id: UUID) -> list[SessionResource]:
        statement = (
            select(SessionResource)
            .where(SessionResource.session_id == session_id)
            .order_by(SessionResource.created_at)
        )
        return list(self.db.scalars(statement).all())

    def get_resource_by_id(self, resource_id: UUID) -> SessionResource | None:
        statement = select(SessionResource).where(
            SessionResource.id == resource_id
        )
        return self.db.scalar(statement)

    def create_resource(self, resource: SessionResource) -> SessionResource:
        self.db.add(resource)
        self.db.commit()
        self.db.refresh(resource)
        return resource

    def update_resource(self, resource: SessionResource) -> SessionResource:
        self.db.commit()
        self.db.refresh(resource)
        return resource

    def delete_resource(self, resource: SessionResource) -> None:
        self.db.delete(resource)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

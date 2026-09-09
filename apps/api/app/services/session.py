from datetime import timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DBSession

from app.db.models.session import Session
from app.db.models.session_resource import SessionResource
from app.db.models.session_task import SessionTask
from app.db.repositories.cohort import CohortRepository
from app.db.repositories.session import SessionRepository
from app.schemas.session import (
    DiscoverCurriculumGenerateRequest,
    DiscoverCurriculumGenerateResponse,
    SessionCreate,
    SessionDetailResponse,
    SessionResourceCreate,
    SessionResourceResponse,
    SessionResourceUpdate,
    SessionResponse,
    SessionTaskCreate,
    SessionTaskResponse,
    SessionTaskUpdate,
    SessionUpdate,
)


DISCOVER_CURRICULUM_TEMPLATE = [
    # Week 1: Understand
    {
        "week": 1,
        "session": 1,
        "title": "Session 1 — Enter the Problem",
        "description": "Understand the company challenge, identify what you already know, and document what you still need to discover.",
        "task": {
            "title": "Review Challenge Brief & List Initial Questions",
            "description": "Read the company challenge document thoroughly and submit 3-5 core open questions.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Discover Phase Overview & Problem Canvas",
            "resource_type": "guide",
            "external_url": "https://degreelabs.org/resources/discover-problem-canvas",
        },
    },
    {
        "week": 1,
        "session": 2,
        "title": "Session 2 — Map the Reality",
        "description": "Map stakeholders, systems, user workflows, and constraints shaping the challenge space.",
        "task": {
            "title": "Map Stakeholders and System Dependencies",
            "description": "Construct an ecosystem map identifying primary stakeholders, downstream systems, and regulatory or operational constraints.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Stakeholder & Ecosystem Mapping Framework",
            "resource_type": "template",
            "external_url": "https://degreelabs.org/resources/stakeholder-mapping-template",
        },
    },
    {
        "week": 1,
        "session": 3,
        "title": "Session 3 — Frame the Problem",
        "description": "Synthesize insights into clear problem statements, hypotheses, and scope boundaries.",
        "task": {
            "title": "Formulate Core Problem Statement & Hypotheses",
            "description": "Draft the primary 'How Might We' question along with 3 falsifiable hypotheses for Week 2 investigation.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Problem Framing Guide & Hypothesis Sheet",
            "resource_type": "guide",
            "external_url": "https://degreelabs.org/resources/problem-framing-guide",
        },
    },
    # Week 2: Investigate
    {
        "week": 2,
        "session": 4,
        "title": "Session 4 — Find the Evidence",
        "description": "Gather primary and secondary evidence, data points, and field observations to test initial assumptions.",
        "task": {
            "title": "Evidence Gathering & Discovery Interview Notes",
            "description": "Log findings from primary stakeholder interviews, secondary research, or domain reports.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "User Interview & Evidence Collection Toolkit",
            "resource_type": "toolkit",
            "external_url": "https://degreelabs.org/resources/evidence-toolkit",
        },
    },
    {
        "week": 2,
        "session": 5,
        "title": "Session 5 — Find the Cause",
        "description": "Conduct root cause analysis to separate symptoms from fundamental underlying drivers.",
        "task": {
            "title": "5 Whys & Ishikawa Root Cause Diagram",
            "description": "Perform a deep root cause analysis distinguishing surface symptoms from systemic causes.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Root Cause Analysis Method Guide",
            "resource_type": "guide",
            "external_url": "https://degreelabs.org/resources/root-cause-guide",
        },
    },
    {
        "week": 2,
        "session": 6,
        "title": "Session 6 — Test What You Believe",
        "description": "Validate or invalidate critical hypotheses through structured experiments and stakeholder feedback.",
        "task": {
            "title": "Hypothesis Validation Log",
            "description": "Synthesize evidence against each hypothesis and classify as validated, refuted, or inconclusive.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Hypothesis Testing Matrix",
            "resource_type": "template",
            "external_url": "https://degreelabs.org/resources/hypothesis-matrix",
        },
    },
    # Week 3: Decide
    {
        "week": 3,
        "session": 7,
        "title": "Session 7 — Create Possible Paths",
        "description": "Brainstorm and develop divergent solution concepts and strategic intervention paths.",
        "task": {
            "title": "Divergent Concept Ideation (3 Options)",
            "description": "Develop at least 3 distinct strategic paths addressing the verified root causes.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Strategic Solution Divergence Playbook",
            "resource_type": "playbook",
            "external_url": "https://degreelabs.org/resources/divergence-playbook",
        },
    },
    {
        "week": 3,
        "session": 8,
        "title": "Session 8 — Choose the Direction",
        "description": "Evaluate solution paths against feasibility, viability, and impact criteria to select the optimal direction.",
        "task": {
            "title": "Trade-off Matrix & Direction Selection",
            "description": "Score options across feasibility, impact, and effort; document the rationale for the selected path.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Decision Matrix & Scoring Rubric",
            "resource_type": "template",
            "external_url": "https://degreelabs.org/resources/decision-matrix",
        },
    },
    {
        "week": 3,
        "session": 9,
        "title": "Session 9 — Stress-Test the Decision",
        "description": "Subject the chosen direction to adversarial thinking, edge cases, failure mode analysis, and risk mitigation.",
        "task": {
            "title": "Pre-Mortem & Risk Mitigation Plan",
            "description": "Conduct a pre-mortem exercise assuming the initiative failed, list the top failure modes, and draft mitigations.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Pre-Mortem Protocol & Risk Register",
            "resource_type": "guide",
            "external_url": "https://degreelabs.org/resources/pre-mortem-protocol",
        },
    },
    # Week 4: Own
    {
        "week": 4,
        "session": 10,
        "title": "Session 10 — Build the Proposal",
        "description": "Draft the comprehensive solution proposal, implementation roadmap, and value proposition.",
        "task": {
            "title": "Draft Proposal Document & Slide Deck",
            "description": "Assemble executive summary, problem statement, verified causes, chosen direction, and rollout roadmap.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Executive Proposal Template & Deck Format",
            "resource_type": "template",
            "external_url": "https://degreelabs.org/resources/proposal-template",
        },
    },
    {
        "week": 4,
        "session": 11,
        "title": "Session 11 — Defend and Revise",
        "description": "Present the proposal to peer critique, defend architectural and business trade-offs, and incorporate revisions.",
        "task": {
            "title": "Peer Defense Minutes & Revision Log",
            "description": "Present the proposal in dry-run, capture feedback, and record specific improvements made.",
            "task_type": "activity",
            "required": True,
        },
        "resource": {
            "title": "Defense Rubric & Review Checklist",
            "resource_type": "checklist",
            "external_url": "https://degreelabs.org/resources/defense-rubric",
        },
    },
    {
        "week": 4,
        "session": 12,
        "title": "Session 12 — Final Company Review",
        "description": "Deliver the final executive presentation and handover package to company stakeholders and evaluators.",
        "task": {
            "title": "Final Deliverable Submission & Presentation",
            "description": "Submit final pitch deck, proposal memo, and present to corporate evaluators.",
            "task_type": "deliverable",
            "required": True,
        },
        "resource": {
            "title": "Final Evaluation Standards & Next Steps",
            "resource_type": "guide",
            "external_url": "https://degreelabs.org/resources/evaluation-standards",
        },
    },
]


class SessionService:
    def __init__(self, db: DBSession):
        self.db = db
        self.session_repo = SessionRepository(db)
        self.cohort_repo = CohortRepository(db)

    def _build_detail_response(self, session: Session) -> SessionDetailResponse:
        tasks = self.session_repo.get_tasks(session.id)
        resources = self.session_repo.get_resources(session.id)
        return SessionDetailResponse(
            id=session.id,
            cohort_id=session.cohort_id,
            week_number=session.week_number,
            session_number=session.session_number,
            title=session.title,
            description=session.description,
            scheduled_at=session.scheduled_at,
            duration_minutes=session.duration_minutes,
            status=session.status,
            meeting_url=session.meeting_url,
            created_at=session.created_at,
            updated_at=session.updated_at,
            tasks=[SessionTaskResponse.model_validate(t) for t in tasks],
            resources=[SessionResourceResponse.model_validate(r) for r in resources],
        )

    # -----------------------------------------------------------------------
    # Session operations
    # -----------------------------------------------------------------------

    def get_all(
        self,
        cohort_id: UUID | None = None,
        week_number: int | None = None,
        status: str | None = None,
    ) -> list[SessionResponse]:
        sessions = self.session_repo.get_all(
            cohort_id=cohort_id,
            week_number=week_number,
            status=status,
        )
        return [SessionResponse.model_validate(s) for s in sessions]

    def get_by_id(self, session_id: UUID) -> SessionDetailResponse | None:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            return None
        return self._build_detail_response(session)

    def create(self, data: SessionCreate) -> SessionDetailResponse:
        cohort = self.cohort_repo.get_by_id(data.cohort_id)
        if not cohort:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cohort {data.cohort_id} not found",
            )

        existing = self.session_repo.get_by_cohort_and_number(
            data.cohort_id, data.session_number
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Session number {data.session_number} already exists in cohort {data.cohort_id}",
            )

        session = Session(
            cohort_id=data.cohort_id,
            week_number=data.week_number,
            session_number=data.session_number,
            title=data.title,
            description=data.description,
            scheduled_at=data.scheduled_at,
            duration_minutes=data.duration_minutes,
            status=data.status,
            meeting_url=data.meeting_url,
        )
        try:
            created = self.session_repo.create(session)
            return self._build_detail_response(created)
        except IntegrityError as exc:
            self.session_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database integrity violation while creating session",
            ) from exc

    def update(self, session_id: UUID, data: SessionUpdate) -> SessionDetailResponse:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        if data.session_number is not None and data.session_number != session.session_number:
            existing = self.session_repo.get_by_cohort_and_number(
                session.cohort_id, data.session_number
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Session number {data.session_number} already exists in cohort {session.cohort_id}",
                )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(session, key, value)

        try:
            updated = self.session_repo.update(session)
            return self._build_detail_response(updated)
        except IntegrityError as exc:
            self.session_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database integrity violation while updating session",
            ) from exc

    def delete(self, session_id: UUID) -> None:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        try:
            self.session_repo.delete(session)
        except IntegrityError as exc:
            self.session_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete session due to related records",
            ) from exc

    # -----------------------------------------------------------------------
    # Task operations
    # -----------------------------------------------------------------------

    def get_tasks(self, session_id: UUID) -> list[SessionTaskResponse]:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        tasks = self.session_repo.get_tasks(session_id)
        return [SessionTaskResponse.model_validate(t) for t in tasks]

    def add_task(self, session_id: UUID, data: SessionTaskCreate) -> SessionTaskResponse:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        task = SessionTask(
            session_id=session_id,
            title=data.title,
            description=data.description,
            task_type=data.task_type,
            required=data.required,
            due_at=data.due_at,
        )
        created = self.session_repo.create_task(task)
        return SessionTaskResponse.model_validate(created)

    def update_task(
        self, session_id: UUID, task_id: UUID, data: SessionTaskUpdate
    ) -> SessionTaskResponse:
        task = self.session_repo.get_task_by_id(task_id)
        if not task or task.session_id != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session task not found",
            )
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        updated = self.session_repo.update_task(task)
        return SessionTaskResponse.model_validate(updated)

    def delete_task(self, session_id: UUID, task_id: UUID) -> None:
        task = self.session_repo.get_task_by_id(task_id)
        if not task or task.session_id != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session task not found",
            )
        self.session_repo.delete_task(task)

    # -----------------------------------------------------------------------
    # Resource operations
    # -----------------------------------------------------------------------

    def get_resources(self, session_id: UUID) -> list[SessionResourceResponse]:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        resources = self.session_repo.get_resources(session_id)
        return [SessionResourceResponse.model_validate(r) for r in resources]

    def add_resource(
        self, session_id: UUID, data: SessionResourceCreate
    ) -> SessionResourceResponse:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        resource = SessionResource(
            session_id=session_id,
            title=data.title,
            resource_type=data.resource_type,
            storage_path=data.storage_path,
            external_url=data.external_url,
        )
        created = self.session_repo.create_resource(resource)
        return SessionResourceResponse.model_validate(created)

    def update_resource(
        self, session_id: UUID, resource_id: UUID, data: SessionResourceUpdate
    ) -> SessionResourceResponse:
        resource = self.session_repo.get_resource_by_id(resource_id)
        if not resource or resource.session_id != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session resource not found",
            )
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(resource, key, value)
        updated = self.session_repo.update_resource(resource)
        return SessionResourceResponse.model_validate(updated)

    def delete_resource(self, session_id: UUID, resource_id: UUID) -> None:
        resource = self.session_repo.get_resource_by_id(resource_id)
        if not resource or resource.session_id != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session resource not found",
            )
        self.session_repo.delete_resource(resource)

    # -----------------------------------------------------------------------
    # Discover Curriculum Generator
    # -----------------------------------------------------------------------

    def generate_discover_curriculum(
        self,
        cohort_id: UUID,
        req: DiscoverCurriculumGenerateRequest,
    ) -> DiscoverCurriculumGenerateResponse:
        cohort = self.cohort_repo.get_by_id(cohort_id)
        if not cohort:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cohort {cohort_id} not found",
            )

        existing_count = self.session_repo.count_by_cohort(cohort_id)
        if existing_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cohort {cohort_id} already has {existing_count} sessions. Delete existing sessions first to regenerate.",
            )

        # 3 sessions per week schedule calculation offset (Day 0, Day 2, Day 4 of each 7-day week)
        # Week 1: 0, 2, 4
        # Week 2: 7, 9, 11
        # Week 3: 14, 16, 18
        # Week 4: 21, 23, 25
        schedule_day_offsets = [0, 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25]

        items_to_create: list[
            tuple[Session, list[SessionTask], list[SessionResource]]
        ] = []

        for idx, template in enumerate(DISCOVER_CURRICULUM_TEMPLATE):
            scheduled_at = None
            task_due_at = None

            if req.start_date is not None:
                offset_days = schedule_day_offsets[idx]
                scheduled_at = req.start_date + timedelta(days=offset_days)
                # Task due 2 days after session
                task_due_at = scheduled_at + timedelta(days=2)

            session = Session(
                cohort_id=cohort_id,
                week_number=template["week"],
                session_number=template["session"],
                title=template["title"],
                description=template["description"],
                scheduled_at=scheduled_at,
                duration_minutes=req.session_duration_minutes,
                status="published",
                meeting_url=req.default_meeting_url,
            )

            task_cfg = template["task"]
            task = SessionTask(
                title=task_cfg["title"],
                description=task_cfg["description"],
                task_type=task_cfg["task_type"],
                required=task_cfg["required"],
                due_at=task_due_at,
            )

            resource_cfg = template["resource"]
            resource = SessionResource(
                title=resource_cfg["title"],
                resource_type=resource_cfg["resource_type"],
                external_url=resource_cfg.get("external_url"),
            )

            items_to_create.append((session, [task], [resource]))

        created_sessions = self.session_repo.create_batch(items_to_create)
        detail_responses = [
            self._build_detail_response(s) for s in created_sessions
        ]

        return DiscoverCurriculumGenerateResponse(
            cohort_id=cohort_id,
            sessions_count=len(detail_responses),
            sessions=detail_responses,
        )

from uuid import UUID

from pydantic import BaseModel


class ProjectMentorAssignmentCreate(BaseModel):
    mentor_id: UUID

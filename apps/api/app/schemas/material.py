from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


class MaterialType(str, Enum):
    pdf = "pdf"
    document = "document"
    presentation = "presentation"
    spreadsheet = "spreadsheet"
    video = "video"
    image = "image"
    link = "link"
    other = "other"


class MaterialStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class MaterialVisibility(str, Enum):
    all_students = "all_students"
    all_mentors = "all_mentors"
    students_and_mentors = "students_and_mentors"
    restricted = "restricted"


class StudentAccessMode(str, Enum):
    no_access = "no_access"
    view_download = "view_download"
    download_editable_copy = "download_editable_copy"


class MaterialAudienceUpdate(BaseModel):
    cohort_ids: list[UUID] = Field(default_factory=list)
    institution_ids: list[UUID] = Field(default_factory=list)
    mentor_categories: list[str] = Field(default_factory=list, max_length=20)


class MaterialCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=10000)
    category: str | None = Field(default=None, max_length=100)
    material_type: MaterialType
    visibility: MaterialVisibility = MaterialVisibility.all_students
    student_access_mode: StudentAccessMode = StudentAccessMode.view_download
    external_url: HttpUrl | None = None
    is_featured: bool = False
    publish_immediately: bool = False
    expires_at: datetime | None = None
    audience: MaterialAudienceUpdate = Field(default_factory=MaterialAudienceUpdate)

    @model_validator(mode="after")
    def validate_resource_and_audience(self):
        if self.material_type == MaterialType.link and self.external_url is None:
            raise ValueError("An external URL is required for link materials.")
        if self.external_url and self.external_url.scheme != "https":
            raise ValueError("External URLs must use HTTPS.")
        if self.visibility == MaterialVisibility.restricted and not (
            self.audience.cohort_ids
            or self.audience.institution_ids
            or self.audience.mentor_categories
        ):
            raise ValueError("Restricted materials require at least one audience selection.")
        return self


class MaterialUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=10000)
    category: str | None = Field(default=None, max_length=100)
    material_type: MaterialType | None = None
    visibility: MaterialVisibility | None = None
    student_access_mode: StudentAccessMode | None = None
    external_url: HttpUrl | None = None
    is_featured: bool | None = None
    expires_at: datetime | None = None


class MaterialAssetResponse(BaseModel):
    id: UUID
    original_filename: str | None
    mime_type: str | None
    size_bytes: int | None
    version: int
    is_current: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MaterialResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    category: str | None
    material_type: MaterialType
    status: MaterialStatus
    visibility: MaterialVisibility
    student_access_mode: StudentAccessMode
    external_url: str | None
    is_featured: bool
    published_at: datetime | None
    expires_at: datetime | None
    updated_at: datetime
    created_at: datetime
    asset: MaterialAssetResponse | None = None
    cohort_ids: list[UUID] = Field(default_factory=list)
    institution_ids: list[UUID] = Field(default_factory=list)
    mentor_categories: list[str] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class MaterialListResponse(BaseModel):
    items: list[MaterialResponse]
    total: int
    page: int
    limit: int


class MaterialAccessResponse(BaseModel):
    access_type: str
    student_access_mode: StudentAccessMode | None = None
    url: str
    expires_in_seconds: int | None = None
    filename: str | None = None


class MaterialAnalyticsResponse(BaseModel):
    material_id: UUID
    unique_viewers: int
    total_views: int
    total_downloads: int

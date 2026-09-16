from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db.models.material import (Material, MaterialAsset, MaterialCohort,
    MaterialEngagement, MaterialInstitution, MaterialMentorCategory)
from app.db.models.mentor import Mentor
from app.db.models.student_cohort_assignment import StudentCohortAssignment
from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.schemas.material import (MaterialAccessResponse, MaterialAnalyticsResponse,
    MaterialAudienceUpdate, MaterialCreate, MaterialListResponse, MaterialResponse, MaterialUpdate)
from app.services.material_storage import MaterialStorageService


class MaterialService:
    def __init__(self, db: Session):
        self.db = db

    def _get(self, material_id: UUID) -> Material:
        material = self.db.get(Material, material_id)
        if material is None:
            raise HTTPException(status_code=404, detail="Material not found.")
        return material

    def _asset(self, material_id: UUID) -> MaterialAsset | None:
        return self.db.query(MaterialAsset).filter_by(material_id=material_id, is_current=True).first()

    def _response(self, material: Material) -> MaterialResponse:
        asset = self._asset(material.id)
        return MaterialResponse.model_validate({
            "id": material.id, "title": material.title, "description": material.description,
            "category": material.category, "material_type": material.material_type, "status": material.status,
            "visibility": material.visibility, "student_access_mode": material.student_access_mode, "external_url": material.external_url,
            "is_featured": material.is_featured, "published_at": material.published_at,
            "expires_at": material.expires_at, "updated_at": material.updated_at, "created_at": material.created_at,
            "asset": asset, "cohort_ids": [x[0] for x in self.db.query(MaterialCohort.cohort_id).filter_by(material_id=material.id)],
            "institution_ids": [x[0] for x in self.db.query(MaterialInstitution.institution_id).filter_by(material_id=material.id)],
            "mentor_categories": [x[0] for x in self.db.query(MaterialMentorCategory.mentor_category).filter_by(material_id=material.id)],
        })

    def _set_audience(self, material: Material, audience: MaterialAudienceUpdate) -> None:
        if material.visibility == "restricted" and not (audience.cohort_ids or audience.institution_ids or audience.mentor_categories):
            raise HTTPException(status_code=422, detail="Restricted materials need at least one audience.")
        self.db.query(MaterialCohort).filter_by(material_id=material.id).delete()
        self.db.query(MaterialInstitution).filter_by(material_id=material.id).delete()
        self.db.query(MaterialMentorCategory).filter_by(material_id=material.id).delete()
        self.db.add_all([MaterialCohort(material_id=material.id, cohort_id=x) for x in set(audience.cohort_ids)])
        self.db.add_all([MaterialInstitution(material_id=material.id, institution_id=x) for x in set(audience.institution_ids)])
        self.db.add_all([MaterialMentorCategory(material_id=material.id, mentor_category=x.strip()) for x in set(audience.mentor_categories) if x.strip()])

    def _assert_publishable(self, material: Material) -> None:
        if material.material_type != "link" and not material.external_url and not self._asset(material.id):
            raise HTTPException(status_code=409, detail="Upload a file before publishing this material.")

    def list_admin(self, *, search: str | None, status_value: str | None, category: str | None,
                   material_type: str | None, visibility: str | None, featured: bool | None, page: int, limit: int) -> MaterialListResponse:
        query = self.db.query(Material)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(or_(Material.title.ilike(term), Material.description.ilike(term)))
        for column, value in ((Material.status, status_value), (Material.category, category),
                              (Material.material_type, material_type), (Material.visibility, visibility)):
            if value: query = query.filter(column == value)
        if featured is not None: query = query.filter(Material.is_featured == featured)
        total = query.count()
        rows = query.order_by(Material.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()
        return MaterialListResponse(items=[self._response(x) for x in rows], total=total, page=page, limit=limit)

    def create(self, data: MaterialCreate, actor: User) -> MaterialResponse:
        now = datetime.now(timezone.utc)
        material = Material(title=data.title, description=data.description, category=data.category,
            material_type=data.material_type.value, visibility=data.visibility.value, external_url=str(data.external_url) if data.external_url else None,
            student_access_mode=data.student_access_mode.value, is_featured=data.is_featured, status="draft", created_by=actor.id, updated_by=actor.id, expires_at=data.expires_at)
        self.db.add(material); self.db.flush(); self._set_audience(material, data.audience)
        if data.publish_immediately:
            self._assert_publishable(material); material.status = "published"; material.published_at = now
        self.db.commit(); self.db.refresh(material)
        return self._response(material)

    def update(self, material_id: UUID, data: MaterialUpdate, actor: User) -> MaterialResponse:
        material = self._get(material_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            if key == "external_url": value = str(value) if value else None
            if key in {"material_type", "visibility", "student_access_mode"} and value is not None: value = value.value
            setattr(material, key, value)
        material.updated_by = actor.id
        self.db.commit(); self.db.refresh(material)
        return self._response(material)

    def audience(self, material_id: UUID, data: MaterialAudienceUpdate, actor: User) -> MaterialResponse:
        material = self._get(material_id); self._set_audience(material, data); material.updated_by = actor.id
        self.db.commit(); return self._response(material)

    def publish(self, material_id: UUID, actor: User) -> MaterialResponse:
        material = self._get(material_id); self._assert_publishable(material)
        material.status = "published"; material.published_at = datetime.now(timezone.utc); material.archived_at = None; material.updated_by = actor.id
        self.db.commit(); return self._response(material)

    def archive(self, material_id: UUID, actor: User) -> MaterialResponse:
        material = self._get(material_id); material.status = "archived"; material.archived_at = datetime.now(timezone.utc); material.updated_by = actor.id
        self.db.commit(); return self._response(material)

    def restore(self, material_id: UUID, actor: User) -> MaterialResponse:
        material = self._get(material_id); material.status = "draft"; material.archived_at = None; material.updated_by = actor.id
        self.db.commit(); return self._response(material)

    def delete(self, material_id: UUID, actor: User) -> None:
        material = self._get(material_id)
        if material.status != "archived":
            raise HTTPException(status_code=409, detail="Archive a material before permanently deleting it.")
        paths = [row[0] for row in self.db.query(MaterialAsset.storage_path).filter_by(material_id=material.id).all()]
        MaterialStorageService().delete(paths)
        self.db.delete(material)
        self.db.commit()

    async def upload_asset(self, material_id: UUID, upload: UploadFile, actor: User) -> MaterialResponse:
        material = self._get(material_id)
        version = (self.db.query(func.coalesce(func.max(MaterialAsset.version), 0)).filter_by(material_id=material_id).scalar() or 0) + 1
        path, mime, size, checksum = await MaterialStorageService().upload(material_id, version, upload)
        self.db.query(MaterialAsset).filter_by(material_id=material_id, is_current=True).update({"is_current": False})
        self.db.add(MaterialAsset(material_id=material_id, storage_path=path, original_filename=upload.filename,
                    mime_type=mime, size_bytes=size, checksum=checksum, version=version, is_current=True, uploaded_by=actor.id))
        material.updated_by = actor.id; self.db.commit(); return self._response(material)

    def _allowed(self, material: Material, user: User) -> bool:
        now = datetime.now(timezone.utc)
        if user.status != "active" or material.status != "published" or (material.published_at and material.published_at > now) or (material.expires_at and material.expires_at <= now): return False
        if user.role == "student":
            if material.student_access_mode == "no_access": return False
            if material.visibility in {"all_students", "students_and_mentors"}: return True
            if material.visibility != "restricted": return False
            profile = self.db.query(StudentProfile).filter_by(user_id=user.id).first()
            if not profile: return False
            institution_ok = self.db.query(MaterialInstitution).filter_by(material_id=material.id, institution_id=profile.institution_id).first() is not None
            cohort_ids = [x[0] for x in self.db.query(StudentCohortAssignment.cohort_id).filter_by(student_id=profile.id, status="active")]
            cohort_ok = bool(cohort_ids) and self.db.query(MaterialCohort).filter(MaterialCohort.material_id == material.id, MaterialCohort.cohort_id.in_(cohort_ids)).first() is not None
            return institution_ok or cohort_ok
        if user.role == "mentor":
            if material.visibility in {"all_mentors", "students_and_mentors"}: return True
            if material.visibility != "restricted": return False
            mentor = self.db.query(Mentor).filter_by(user_id=user.id, status="active").first()
            return bool(mentor and self.db.query(MaterialMentorCategory).filter_by(material_id=material.id, mentor_category=mentor.mentor_category).first())
        return False

    def list_for_user(self, user: User, *, search: str | None, category: str | None, material_type: str | None, featured: bool | None, page: int, limit: int) -> MaterialListResponse:
        query = self.db.query(Material).filter_by(status="published")
        if search:
            term=f"%{search.strip()}%"; query=query.filter(or_(Material.title.ilike(term), Material.description.ilike(term)))
        if category: query=query.filter_by(category=category)
        if material_type: query=query.filter_by(material_type=material_type)
        if featured is not None: query=query.filter_by(is_featured=featured)
        items=[m for m in query.order_by(Material.published_at.desc()).all() if self._allowed(m,user)]
        return MaterialListResponse(items=[self._response(m) for m in items[(page-1)*limit:page*limit]], total=len(items), page=page, limit=limit)

    def user_material(self, material_id: UUID, user: User) -> MaterialResponse:
        material=self._get(material_id)
        if not self._allowed(material,user): raise HTTPException(status_code=403, detail="You are not authorized to access this material.")
        self._engage(material.id,user.id,"view"); return self._response(material)

    def access(self, material_id: UUID, user: User) -> MaterialAccessResponse:
        material=self._get(material_id)
        if not self._allowed(material,user): raise HTTPException(status_code=403, detail="You are not authorized to access this material.")
        self._engage(material.id,user.id,"download")
        student_access_mode = material.student_access_mode if user.role == "student" else None
        if material.external_url: return MaterialAccessResponse(access_type="external", url=material.external_url, student_access_mode=student_access_mode)
        asset=self._asset(material.id)
        if not asset: raise HTTPException(status_code=404, detail="No file is available for this material.")
        return MaterialAccessResponse(access_type="download", url=MaterialStorageService().signed_url(asset.storage_path), expires_in_seconds=600, filename=asset.original_filename, student_access_mode=student_access_mode)

    def _engage(self, material_id: UUID, user_id: UUID, event: str) -> None:
        now=datetime.now(timezone.utc); row=self.db.query(MaterialEngagement).filter_by(material_id=material_id,user_id=user_id).first()
        if row is None: row=MaterialEngagement(material_id=material_id,user_id=user_id,first_viewed_at=now,last_viewed_at=now,view_count=0,download_count=0); self.db.add(row)
        if event == "view": row.view_count += 1; row.last_viewed_at=now
        else: row.download_count += 1
        self.db.commit()

    def analytics(self, material_id: UUID) -> MaterialAnalyticsResponse:
        self._get(material_id); row=self.db.query(func.count(MaterialEngagement.id), func.coalesce(func.sum(MaterialEngagement.view_count),0), func.coalesce(func.sum(MaterialEngagement.download_count),0)).filter_by(material_id=material_id).one()
        return MaterialAnalyticsResponse(material_id=material_id, unique_viewers=row[0], total_views=int(row[1]), total_downloads=int(row[2]))

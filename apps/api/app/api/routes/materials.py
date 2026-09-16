from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.rbac import require_admin, require_mentor, require_student
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.material import (MaterialAccessResponse, MaterialAnalyticsResponse, MaterialAudienceUpdate,
    MaterialCreate, MaterialListResponse, MaterialResponse, MaterialUpdate)
from app.services.material import MaterialService

admin_router = APIRouter(prefix="/admin/materials", dependencies=[Depends(require_admin)])
student_router = APIRouter(prefix="/student/materials", dependencies=[Depends(require_student)])
mentor_router = APIRouter(prefix="/mentor/materials", dependencies=[Depends(require_mentor)])

@admin_router.get("", response_model=MaterialListResponse)
def list_admin_materials(search: str | None = None, status: str | None = None, category: str | None = None,
    material_type: str | None = None, visibility: str | None = None, featured: bool | None = None,
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return MaterialService(db).list_admin(search=search, status_value=status, category=category, material_type=material_type, visibility=visibility, featured=featured, page=page, limit=limit)

@admin_router.post("", response_model=MaterialResponse, status_code=201)
def create_material(data: MaterialCreate, actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    return MaterialService(db).create(data, actor)

@admin_router.get("/{material_id}", response_model=MaterialResponse)
def get_admin_material(material_id: UUID, db: Session = Depends(get_db)):
    return MaterialService(db)._response(MaterialService(db)._get(material_id))

@admin_router.patch("/{material_id}", response_model=MaterialResponse)
def update_material(material_id: UUID, data: MaterialUpdate, actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    return MaterialService(db).update(material_id, data, actor)

@admin_router.put("/{material_id}/audience", response_model=MaterialResponse)
def set_material_audience(material_id: UUID, data: MaterialAudienceUpdate, actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    return MaterialService(db).audience(material_id, data, actor)

@admin_router.post("/{material_id}/assets", response_model=MaterialResponse)
async def upload_material_asset(material_id: UUID, file: UploadFile = File(...), actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    return await MaterialService(db).upload_asset(material_id, file, actor)

@admin_router.post("/{material_id}/publish", response_model=MaterialResponse)
def publish_material(material_id: UUID, actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    return MaterialService(db).publish(material_id, actor)

@admin_router.post("/{material_id}/archive", response_model=MaterialResponse)
def archive_material(material_id: UUID, actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    return MaterialService(db).archive(material_id, actor)

@admin_router.post("/{material_id}/restore", response_model=MaterialResponse)
def restore_material(material_id: UUID, actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    return MaterialService(db).restore(material_id, actor)

@admin_router.delete("/{material_id}", status_code=204)
def delete_material(material_id: UUID, actor: User = Depends(require_admin), db: Session = Depends(get_db)):
    MaterialService(db).delete(material_id, actor)

@admin_router.get("/{material_id}/analytics", response_model=MaterialAnalyticsResponse)
def material_analytics(material_id: UUID, db: Session = Depends(get_db)):
    return MaterialService(db).analytics(material_id)

@student_router.get("", response_model=MaterialListResponse)
def student_materials(search: str | None = None, category: str | None = None, material_type: str | None = None,
    featured: bool | None = None, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    user: User = Depends(require_student), db: Session = Depends(get_db)):
    return MaterialService(db).list_for_user(user, search=search, category=category, material_type=material_type, featured=featured, page=page, limit=limit)

@mentor_router.get("", response_model=MaterialListResponse)
def mentor_materials(search: str | None = None, category: str | None = None, material_type: str | None = None,
    featured: bool | None = None, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    user: User = Depends(require_mentor), db: Session = Depends(get_db)):
    return MaterialService(db).list_for_user(user, search=search, category=category, material_type=material_type, featured=featured, page=page, limit=limit)

@student_router.get("/{material_id}", response_model=MaterialResponse)
def student_material(material_id: UUID, user: User = Depends(require_student), db: Session = Depends(get_db)):
    return MaterialService(db).user_material(material_id, user)

@student_router.get("/{material_id}/access", response_model=MaterialAccessResponse)
def student_access(material_id: UUID, user: User = Depends(require_student), db: Session = Depends(get_db)):
    return MaterialService(db).access(material_id, user)

@mentor_router.get("/{material_id}", response_model=MaterialResponse)
def mentor_material(material_id: UUID, user: User = Depends(require_mentor), db: Session = Depends(get_db)):
    return MaterialService(db).user_material(material_id, user)

@mentor_router.get("/{material_id}/access", response_model=MaterialAccessResponse)
def mentor_access(material_id: UUID, user: User = Depends(require_mentor), db: Session = Depends(get_db)):
    return MaterialService(db).access(material_id, user)

import re
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.institution import Institution
from app.db.repositories.institution import InstitutionRepository
from app.schemas.institution import InstitutionCreate, InstitutionUpdate


class InstitutionService:
    def __init__(self, db: Session):
        self.repository = InstitutionRepository(db)

    def get_all(self) -> list[Institution]:
        return self.repository.get_all()

    def get_by_id(self, institution_id: UUID) -> Institution | None:
        return self.repository.get_by_id(institution_id)

    def create(self, data: InstitutionCreate) -> Institution:
        existing = self.repository.get_by_code(data.code)

        if existing:
            raise ValueError(
                f"Institution with code '{data.code}' already exists."
            )

        institution = Institution(
            name=data.name,
            code=data.code,
            address=data.address,
            status=data.status,
        )

        try:
            return self.repository.create(institution)
        except IntegrityError as exc:
            self.repository.rollback()
            raise ValueError(
                f"Institution with code '{data.code}' already exists."
            ) from exc

    def update(
        self,
        institution_id: UUID,
        data: InstitutionUpdate,
    ) -> Institution | None:
        institution = self.repository.get_by_id(institution_id)

        if not institution:
            return None

        if data.code is not None and data.code != institution.code:
            existing = self.repository.get_by_code(data.code)

            if existing:
                raise ValueError(
                    f"Institution with code '{data.code}' already exists."
                )

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(institution, field, value)

        try:
            return self.repository.update(institution)
        except IntegrityError as exc:
            self.repository.rollback()
            raise ValueError(
                f"Institution with code '{data.code}' already exists."
            ) from exc

    def delete(self, institution_id: UUID) -> bool:
        institution = self.repository.get_by_id(institution_id)

        if not institution:
            return False

        self.repository.delete(institution)
        return True

    def import_rows(self, rows: list[dict[str, str | None]]) -> dict[str, object]:
        """Create or update institutions from validated spreadsheet rows."""
        created = updated = skipped = 0
        errors: list[str] = []

        for row in rows:
            row_number = row["row_number"] or "?"
            name = (row["name"] or "").strip()
            if not name:
                skipped += 1
                errors.append(f"Row {row_number}: institution name is required.")
                continue

            address = (row["address"] or "").strip() or None
            supplied_code = (row["code"] or "").strip().upper()
            existing = self.repository.get_by_name(name)

            try:
                if existing:
                    if address:
                        existing.address = address
                    if row["status"]:
                        existing.status = row["status"]
                    self.repository.update(existing)
                    updated += 1
                    continue

                code = supplied_code or self._next_generated_code(name)
                if self.repository.get_by_code(code):
                    skipped += 1
                    errors.append(
                        f"Row {row_number}: code '{code}' is already assigned to another institution."
                    )
                    continue

                self.repository.create(
                    Institution(
                        name=name,
                        code=code,
                        address=address,
                        status=row["status"] or "active",
                    )
                )
                created += 1
            except IntegrityError:
                self.repository.rollback()
                skipped += 1
                errors.append(f"Row {row_number}: could not save '{name}'.")

        return {"created": created, "updated": updated, "skipped": skipped, "errors": errors}

    def _next_generated_code(self, name: str) -> str:
        words = re.findall(r"[A-Za-z0-9]+", name.upper())
        stem = "-".join(words[:4])[:72] or "INSTITUTION"
        candidate = stem
        suffix = 2
        while self.repository.get_by_code(candidate):
            candidate = f"{stem[:90]}-{suffix}"
            suffix += 1
        return candidate

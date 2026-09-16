from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas.material import MaterialCreate


def test_link_material_requires_https_url() -> None:
    with pytest.raises(ValidationError):
        MaterialCreate(title="Guide", material_type="link", external_url="http://example.com")


def test_restricted_material_requires_an_audience() -> None:
    with pytest.raises(ValidationError):
        MaterialCreate(title="Guide", material_type="pdf", visibility="restricted")


def test_valid_restricted_material_accepts_audience() -> None:
    material = MaterialCreate(
        title="Guide",
        material_type="pdf",
        visibility="restricted",
        audience={"mentor_categories": ["dlif"]},
        expires_at=datetime(2030, 1, 1, tzinfo=timezone.utc),
    )
    assert material.visibility == "restricted"

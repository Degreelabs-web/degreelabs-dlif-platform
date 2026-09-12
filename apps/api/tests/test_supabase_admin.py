from unittest.mock import Mock, patch

from app.services.supabase_admin import SupabaseAdminService


def test_invite_falls_back_to_creating_user_when_supabase_mailer_fails():
    service = object.__new__(SupabaseAdminService)
    service.base_url = "https://example.supabase.co"
    service.headers = {"apikey": "service-role"}
    service.get_user_by_email = Mock(return_value=None)
    service.create_user = Mock(
        return_value={"id": "2cba9e2d-1ef1-46e1-b6a8-e2fc2f15ae1b"}
    )
    response = Mock(status_code=500)

    with patch("app.services.supabase_admin.httpx.post", return_value=response):
        user, created = service.invite_user(
            email="mentor@example.com",
            full_name="Mentor Example",
        )

    assert created is True
    assert user["id"] == "2cba9e2d-1ef1-46e1-b6a8-e2fc2f15ae1b"
    service.create_user.assert_called_once_with(
        email="mentor@example.com",
        full_name="Mentor Example",
        email_confirm=True,
    )


def test_generate_password_setup_link_uses_supabase_recovery_flow():
    service = object.__new__(SupabaseAdminService)
    service.base_url = "https://example.supabase.co"
    service.headers = {"apikey": "service-role"}
    response = Mock(status_code=200)
    response.json.return_value = {"action_link": "https://auth.example/recovery"}

    with patch("app.services.supabase_admin.httpx.post", return_value=response) as post:
        link = service.generate_password_setup_link(
            email="mentor@example.com",
            redirect_to="https://app.example/set-password",
        )

    assert link == "https://auth.example/recovery"
    assert post.call_args.kwargs["json"] == {
        "type": "recovery",
        "email": "mentor@example.com",
        "options": {"redirect_to": "https://app.example/set-password"},
    }

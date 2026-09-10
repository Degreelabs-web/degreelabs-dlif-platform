"""Production Reset Script for DegreeLabs Impact Fellowship (DLIF).

Purges all test students, mentors, submissions, and legacy test accounts,
leaving only admin@degreelabs.com as the sole administrator in both
PostgreSQL and Supabase Auth.
"""

import sys
from pathlib import Path
from uuid import UUID

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# pyrefly: ignore [missing-import]
from sqlalchemy import text
from app.db.session import SessionLocal
from app.db.models.user import User
from app.services.supabase_admin import SupabaseAdminService, SupabaseAdminError

ADMIN_EMAIL = "admin@degreelabs.com"
ADMIN_PASSWORD = "AdminPassword123!"
ADMIN_NAME = "DegreeLabs Administrator"

def reset_production():
    print("=" * 65)
    print("  DLIF PRODUCTION RESET & CLEANUP")
    print("=" * 65)

    db = SessionLocal()
    supabase = SupabaseAdminService()

    # 1. Provision / sync admin@degreelabs.com in Supabase Auth
    print(f"\n[1] Ensuring {ADMIN_EMAIL} exists in Supabase Auth...")
    try:
        supabase_user = supabase.create_user(
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            full_name=ADMIN_NAME,
            email_confirm=True,
        )
        admin_auth_id = supabase_user.get("id")
        if not admin_auth_id:
            raise RuntimeError("Failed to obtain user ID from Supabase Auth.")
        admin_uuid = UUID(admin_auth_id)
        print(f"    -> Supabase Admin Auth UUID: {admin_uuid}")
    except Exception as exc:
        print(f"[ERROR] Failed to set up Supabase admin: {exc}", file=sys.stderr)
        sys.exit(1)

    # 2. Clean up dependent relational tables in PostgreSQL
    print("\n[2] Purging test and student dependent data from PostgreSQL...")
    dependent_tables = [
        "student_cohort_assignments",
        "team_mentor_assignments",
        "team_project_assignments",
        "team_members",
        "submission_files",
        "submission_versions",
        "submissions",
        "feedback",
        "attendance",
        "enrollments",
        "student_profiles",
        "mentors",
        "teams",
    ]

    for table in dependent_tables:
        try:
            result = db.execute(text(f"DELETE FROM {table}"))
            print(f"    - Cleared table '{table}' (deleted rows: {result.rowcount})")
        except Exception as e:
            db.rollback()
            print(f"    ! Note on table '{table}': {e}")
        else:
            db.commit()

    # 3. Ensure admin@degreelabs.com exists in DB with role='admin'
    print(f"\n[3] Setting up {ADMIN_EMAIL} in PostgreSQL 'users' table...")
    existing_admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if existing_admin:
        existing_admin.id = admin_uuid
        existing_admin.full_name = ADMIN_NAME
        existing_admin.role = "admin"
        existing_admin.status = "active"
    else:
        new_admin = User(
            id=admin_uuid,
            email=ADMIN_EMAIL,
            full_name=ADMIN_NAME,
            role="admin",
            status="active",
        )
        db.add(new_admin)
    db.commit()
    print(f"    -> Admin record verified in DB with ID: {admin_uuid}")

    # 4. Remove all other users from PostgreSQL DB
    print("\n[4] Deleting all other users from PostgreSQL 'users' table...")
    deleted_users = db.query(User).filter(User.email != ADMIN_EMAIL).delete(synchronize_session=False)
    db.commit()
    print(f"    -> Deleted {deleted_users} other user accounts from database.")

    # 5. Clean up other users from Supabase Auth
    print("\n[5] Cleaning up legacy test users in Supabase Auth...")
    try:
        resp = supabase.get_user_by_email(ADMIN_EMAIL)
        # Fetch all users via Supabase admin
        # pyrefly: ignore [missing-import]
        import httpx
        users_resp = httpx.get(f"{supabase.base_url}/auth/v1/admin/users", headers=supabase.headers, timeout=15)
        if users_resp.status_code == 200:
            all_users = users_resp.json().get("users", [])
            for u in all_users:
                u_email = u.get("email", "").lower()
                u_id = u.get("id")
                if u_email != ADMIN_EMAIL.lower() and u_id:
                    try:
                        supabase.delete_user(u_id)
                        print(f"    - Deleted Supabase Auth user: {u_email} ({u_id})")
                    except Exception as del_err:
                        print(f"    ! Could not delete {u_email}: {del_err}")
    except Exception as exc:
        print(f"    ! Note during Supabase Auth cleanup: {exc}")

    # Final tally
    final_user_count = db.query(User).count()
    remaining_users = db.query(User).all()
    print("\n" + "=" * 65)
    print("  DATABASE STATUS POST-RESET:")
    print("=" * 65)
    print(f"  Total Users: {final_user_count}")
    for u in remaining_users:
        print(f"   * {u.email} ({u.role}) -> ID: {u.id}")
    print("-" * 65)
    print(f"  Sole Active Admin: {ADMIN_EMAIL}")
    print(f"  Password:          {ADMIN_PASSWORD}")
    print(f"  Login Destination: http://localhost:3000/login?role=admin")
    print("=" * 65 + "\n")
    db.close()

if __name__ == "__main__":
    reset_production()

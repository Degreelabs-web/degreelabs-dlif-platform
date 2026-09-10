"""CLI tool to create or update an Admin account in DegreeLabs Impact Fellowship (DLIF).

Usage:
    python scripts/create_admin.py --email admin@example.com --password SecretPassword123! --name "Admin Name"
    python scripts/create_admin.py
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.db.session import SessionLocal
from app.services.user_provisioning import UserProvisioningService, UserProvisioningError

def create_admin(email: str, password: str, name: str):
    db = SessionLocal()
    try:
        service = UserProvisioningService(db)
        user = service.provision_user(
            email=email.strip(),
            full_name=name.strip(),
            role="admin",
            password=password,
        )
        print("\n" + "=" * 60)
        print("  SUCCESS: Admin Account Ready!")
        print("=" * 60)
        print(f"  User ID:    {user.id}")
        print(f"  Email:      {user.email}")
        print(f"  Full Name:  {user.full_name}")
        print(f"  Role:       {user.role}")
        print(f"  Status:     {user.status}")
        print("-" * 60)
        print("  You can now log in at:")
        print("  -> http://localhost:3000/login?role=admin")
        print("=" * 60 + "\n")
    except UserProvisioningError as exc:
        print(f"\n[ERROR] Failed to provision admin: {exc}\n", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Create or update an Admin account in DLIF")
    parser.add_argument("--email", type=str, help="Admin email address (e.g. admin@degreelabs.org)")
    parser.add_argument("--password", type=str, help="Admin password (minimum 6 characters)")
    parser.add_argument("--name", type=str, help="Admin full name (e.g. Lead Administrator)")

    args = parser.parse_args()

    email = args.email
    password = args.password
    name = args.name

    if not email:
        email = input("Enter admin email address: ").strip()

    if not name:
        name = input("Enter admin full name: ").strip() or "Administrator"

    if not password:
        import getpass
        password = getpass.getpass("Enter admin password (min 6 characters): ").strip()

    if len(password) < 6:
        print("\n[ERROR] Password must be at least 6 characters long.\n", file=sys.stderr)
        sys.exit(1)

    create_admin(email, password, name)

if __name__ == "__main__":
    main()

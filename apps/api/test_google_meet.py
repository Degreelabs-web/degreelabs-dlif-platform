"""Quick smoke-test for Google Meet credentials.

Run from the apps/api directory:
    .venv\\Scripts\\python.exe test_google_meet.py
"""

import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
load_dotenv(".env")

CLIENT_ID     = os.getenv("GOOGLE_CALENDAR_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET", "")
REFRESH_TOKEN = os.getenv("GOOGLE_CALENDAR_REFRESH_TOKEN", "")
CALENDAR_ID   = os.getenv("GOOGLE_CALENDAR_ID", "primary")
TIMEZONE      = os.getenv("GOOGLE_CALENDAR_TIMEZONE", "UTC")

if not all([CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN]):
    print("FAIL: Missing credentials in .env")
    print("  Need: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN")
    sys.exit(1)

import requests

# Step 1: Get access token
print("[1/3] Refreshing access token...")
resp = requests.post(
    "https://oauth2.googleapis.com/token",
    data={
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type": "refresh_token",
    },
    timeout=15,
)
if not resp.ok:
    print(f"FAIL: Token refresh failed: {resp.status_code}")
    print(resp.text[:400])
    sys.exit(1)

access_token = resp.json()["access_token"]
print("OK:  Got access token")

headers = {"Authorization": f"Bearer {access_token}"}

# Step 2: Create a test event with Meet
start = datetime.now(timezone.utc) + timedelta(hours=1)
end   = start + timedelta(hours=1)

body = {
    "summary": "[TEST] DLIF Google Meet Credential Check",
    "start": {"dateTime": start.strftime("%Y-%m-%dT%H:%M:%SZ"), "timeZone": TIMEZONE},
    "end":   {"dateTime": end.strftime("%Y-%m-%dT%H:%M:%SZ"),   "timeZone": TIMEZONE},
    "conferenceData": {
        "createRequest": {
            "requestId": str(uuid.uuid4()),
            "conferenceSolutionKey": {"type": "hangoutsMeet"},
        }
    },
}

print("[2/3] Creating test Calendar event with Meet link...")
for attempt in range(1, 4):
    try:
        resp = requests.post(
            f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events",
            headers=headers,
            params={"conferenceDataVersion": "1"},
            json=body,
            timeout=30,
        )
        break
    except Exception as e:
        print(f"  Attempt {attempt} failed: {e}")
        if attempt == 3:
            print("FAIL: Could not reach Google Calendar API after 3 attempts.")
            print("  This is a network issue (WinError 10054). Try again or check your connection.")
            sys.exit(1)
        import time; time.sleep(3)
if not resp.ok:
    print(f"FAIL: Event creation failed: {resp.status_code}")
    print(resp.text[:600])
    sys.exit(1)

event = resp.json()
meet_link = event.get("hangoutLink") or next(
    (ep["uri"] for ep in event.get("conferenceData", {}).get("entryPoints", [])
     if ep.get("entryPointType") == "video"), None
)
event_id = event["id"]

if meet_link:
    print(f"\n*** SUCCESS! Meet link: {meet_link} ***\n")
else:
    print("WARNING: Event created but no Meet link returned.")
    print("  Make sure Google Meet is enabled for the scheduling account.")

# Step 3: Delete the test event
print(f"[3/3] Deleting test event ({event_id})...")
del_resp = requests.delete(
    f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events/{event_id}",
    headers=headers,
    timeout=15,
)
if del_resp.status_code in (200, 204):
    print("OK:  Test event deleted. Calendar is clean.")
else:
    print(f"WARNING: Could not delete test event: {del_resp.status_code}")

print("\nCredential check complete. Add values to .env and restart the API server.")

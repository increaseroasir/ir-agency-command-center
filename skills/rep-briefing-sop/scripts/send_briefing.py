#!/usr/bin/env python3
"""
Send a rep briefing text from the clean account to James and Amir.
Usage: python send_briefing.py "<message text>"
Or import and call send_briefing(message) directly.
"""

import requests
import time
import sys

CLEAN_PIT = "pit-e7613319-4877-4924-a37a-06718567a37a"
CLEAN_LOC = "DkBCSFpRLGICqQJwrVy0"
FROM_NUMBER = "+18776913422"

HEADERS = {
    "Authorization": f"Bearer {CLEAN_PIT}",
    "Version": "2021-07-28",
    "Content-Type": "application/json"
}
BASE_URL = "https://services.leadconnectorhq.com"

REPS = [
    {"name": "James", "phone": "+17016261078"},
    {"name": "Amir",  "phone": "+12107764250"},
]


def upsert_contact(name, phone):
    parts = name.split(" ", 1)
    r = requests.post(f"{BASE_URL}/contacts/upsert",
        headers=HEADERS,
        json={
            "locationId": CLEAN_LOC,
            "firstName": parts[0],
            "lastName": parts[1] if len(parts) > 1 else "",
            "phone": phone,
            "tags": ["rrvf-rep"]
        })
    if r.status_code in [200, 201]:
        return r.json().get("contact", {}).get("id")
    return None


def get_conv_id(contact_id):
    """Get existing or create new conversation for a contact."""
    r = requests.post(f"{BASE_URL}/conversations/",
        headers=HEADERS,
        json={"locationId": CLEAN_LOC, "contactId": contact_id})
    if r.status_code in [200, 201]:
        data = r.json()
        return data.get("conversation", {}).get("id") or data.get("id")
    # Already exists — extract from error response
    try:
        return r.json().get("conversationId")
    except Exception:
        return None


def send_sms(contact_id, conv_id, message):
    r = requests.post(f"{BASE_URL}/conversations/messages",
        headers=HEADERS,
        json={
            "type": "SMS",
            "conversationId": conv_id,
            "contactId": contact_id,
            "message": message,
            "fromNumber": FROM_NUMBER
        })
    return r.status_code in [200, 201], r.text[:200]


def setup_reps():
    """Upsert both reps and return their contact/conv IDs."""
    rep_data = {}
    for rep in REPS:
        cid = upsert_contact(rep["name"], rep["phone"])
        if cid:
            conv_id = get_conv_id(cid)
            rep_data[rep["name"]] = {"contact_id": cid, "conv_id": conv_id}
    return rep_data


def send_briefing(message, rep_data=None, label="Lead"):
    """Send a single briefing to both reps."""
    if rep_data is None:
        rep_data = setup_reps()

    print(f"\n--- Sending: {label} ---")
    for rep in REPS:
        rd = rep_data.get(rep["name"])
        if not rd or not rd.get("conv_id"):
            print(f"  [{rep['name']}] SKIP - no conv")
            continue
        success, resp = send_sms(rd["contact_id"], rd["conv_id"], message)
        print(f"  [{rep['name']}] {'SENT' if success else 'FAILED: ' + resp}")
        time.sleep(3)
    return rep_data


def send_briefings(briefings, delay_seconds=120):
    """
    Send a list of briefings with delay between each.
    briefings: list of {"label": str, "message": str}
    """
    rep_data = setup_reps()
    for i, b in enumerate(briefings):
        send_briefing(b["message"], rep_data=rep_data, label=b["label"])
        if i < len(briefings) - 1:
            print(f"\nWaiting {delay_seconds}s before next briefing...")
            time.sleep(delay_seconds)
    print("\nAll briefings sent.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python send_briefing.py '<message>'")
        sys.exit(1)
    message = sys.argv[1]
    send_briefing(message, label="Single briefing")

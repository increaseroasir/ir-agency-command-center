---
name: rep-briefing-sop
description: Rep briefing workflow for Paradise Spas / RRVF (Red River Valley Fair). Use when sending rep briefing texts to James or Amir about leads in the HTS Pipeline - RRVF. Enforces mandatory full GHL context pull, disqualification checks, CRM snapshot format, ACTION REQUIRED footer, clean account sending, and 2-minute gaps between sends.
---

# Rep Briefing SOP — Paradise Spas / RRVF

## Account Info

| Field | Value |
|---|---|
| GHL Location | NpZCArkZIoHhOIl8Qjd1 (Paradise Spas) |
| Clean Account | DkBCSFpRLGICqQJwrVy0 |
| Clean Phone | +18776913422 |
| Sender Label | HTS Sales Bot |
| James | +17016261078 |
| Amir | +12107764250 |

## Mandatory Workflow — Follow in Order

### Step 1: Pull Full GHL Context

For every lead, pull ALL of the following before writing anything:

1. **Conversation history** — full thread, chronological, inbound and outbound
2. **Notes** — any manual notes on the contact record
3. **Tasks** — open or completed tasks
4. **Pipeline** — which pipeline they are in
5. **Stage** — current stage name (not ID)
6. **Opp Status** — open / abandoned / won / lost
7. **Opp Value** — dollar amount on the opportunity
8. **Tags** — all tags on the contact
9. **Assigned To** — which rep owns the contact
10. **Last Stage Change** — date the stage was last updated

Never write a briefing from memory or prior session data. Always pull live from GHL.

### Step 2: Disqualification Check

Before writing the briefing, scan the conversation for any of these. If found, DO NOT brief the lead — flag them instead:

| Signal | Action |
|---|---|
| "not interested", "no thanks", "stop", "remove me" | Flag as LOST - PITCHED, do not brief |
| "it's too hot", "thanks anyway", opted out | Flag as LOST - PITCHED, do not brief |
| DNC tag present | Skip entirely |
| Opp status = lost or won | Skip entirely |
| Last inbound was a hard no | Flag, do not brief |
| Contact was blasted 3+ times with no reply | Note the blast history in the briefing, warn rep not to send another automated message |

If disqualified, update the contact in GHL (move stage to LOST - PITCHED or LOST - NO PITCH, add a note) and pick the next lead.

### Step 3: Write the Briefing

Every briefing must follow this exact format:

```
HTS Sales Bot: [one-line summary of the situation]

Phone: [phone]
Email: [email or "none on file"]
Pipeline: [pipeline name]
Stage: [stage name]
Opp Status: [open/abandoned/won/lost] / $[value]
Notes: [notes or "None"]
Tasks: [tasks or "None"]
Tags: [tags]
Assigned To: [user ID or name]
Last Stage Change: [date]

What happened: [2-4 sentences. What was said, what was promised, what was never done, where it stopped. Be specific — quote the lead if relevant.]

[One clear action sentence telling the rep exactly what to do right now.]

ACTION REQUIRED: After you contact [name], update their contact in GHL. Move the pipeline stage to match what actually happened, add a note with the outcome, fix any data errors (typos in email/phone), and create an opportunity if one does not exist.
```

### Step 4: Verify Against Conversation

Before presenting briefings to the user, re-read the full conversation thread for each lead and confirm:

- Every claim in the "What happened" section is supported by an actual message in the thread
- The last inbound message is accurately represented — if it was a no, an opt-out, or silence, the briefing must reflect that
- No details were invented or assumed from memory
- The rep action line matches what the conversation actually needs

If anything in the briefing does not match the live thread, correct it before showing the user. Never present a briefing that has not been verified against the actual conversation.

### Step 5: Get Approval

Show all briefings to the user before sending. Never send without explicit approval.

### Step 6: Send from Clean Account

Use the clean account PIT to send. The clean account keeps these messages out of the main sub-account so reps cannot see them there.

- PIT: stored in Supabase under `ghlLocationId = DkBCSFpRLGICqQJwrVy0`
- Send to James AND Amir for every briefing
- Wait **2 minutes** between each briefing (not between reps — between leads)
- Small gap (3 seconds) between sending to James and Amir for the same lead

### Step 7: Update CRM After Send

After all briefings are sent, go into GHL and update each lead's record:

- Fix any data errors found (typos in email, wrong phone)
- Move stage to accurately reflect current state
- Add a note summarizing what the briefing covered and what the rep was told to do
- Create an opportunity if one does not exist

## Common Stage Corrections

| Situation | Correct Stage |
|---|---|
| Booked, never showed, no follow-up | N/S APPTMT |
| Came in, was pitched, did not buy | LOST - PITCHED |
| Never contacted, just sitting | CALL BACK or NEW LEAD |
| Said no / opted out | LOST - PITCHED or LOST - NO PITCH |
| Actively engaged, hot | HOT |
| Financing app sent, waiting | BOOKED F/U |

## Red Flags to Call Out in Briefings

- Stage has not changed in 5+ days
- Opp value is $0 (rep never entered a number)
- No notes on record
- Lead was blasted by automation with no personal follow-up
- Lead asked a question that was never answered
- Rep promised something (link, callback, visit) and never delivered
- Email has a typo (e.g., `.con` instead of `.com`)
- Opp marked abandoned with no explanation

## Scripts

See `scripts/send_briefing.py` for the reusable send script. Handles clean account contact upsert, conversation lookup, and SMS delivery with 2-minute gaps.

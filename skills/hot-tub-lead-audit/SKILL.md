---
name: hot-tub-lead-audit
description: Audit lead data integrity for one or all hot tub dealer client sites. Use weekly or when lead volume seems off. Compares GHL contacts, Google Sheets rows, and Meta CAPI events for mismatches. Flags missing custom fields, CAPI gaps, duplicate contacts, orphaned leads, and tag inconsistencies.
---

# Hot Tub Lead Audit

Audits lead data integrity across GHL, Sheets, and Meta CAPI. Run weekly or on-demand when something looks wrong.

## Inputs Required

- `client_name` — or "all" to audit all clients
- `date_range` — e.g., "last 7 days" or "2026-07-01 to 2026-07-18"
- `ghl_location_id` — client's GHL location
- `ghl_api_token` — client's PIT
- `google_sheets_id` — client's Lead Vault Sheet ID

## Audit Checks

### 1. Lead Count Comparison
- Count GHL contacts created in date range with tag `productlead` or `src-meta`
- Count Sheets rows in date range
- Count Meta CAPI `Lead` events in date range (via Meta API)
- Flag if any count differs by more than 10%

### 2. Custom Field Fill Rate
For each GHL contact in the period, check fill rate per custom field:
- `product_name`, `product_slug`, `model_interest_tag`, `lead_source`, `campaign` — expect >90% fill rate
- `utm_source`, `utm_medium` — expect >60% fill rate (organic traffic won't have UTMs)
- Flag any field below its expected threshold

### 3. Duplicate Contact Detection
- Search GHL for contacts with the same phone number submitted more than once in the period
- Search for same email submitted more than once
- Flag contacts that should have been deduplicated

### 4. Tag Consistency
For each contact in the period:
- Must have at least one `src-*` tag
- Must have at least one `Model Interest - *` tag (if from product page)
- Flag contacts missing required tags

### 5. Missed Leads Tab
- Check the Missed Leads tab in the Lead Vault Sheet
- Any rows in the period = GHL failures. Flag and investigate.

### 6. Lead Velocity
- Compare this period's lead count to the prior period
- Flag if volume dropped more than 50% week-over-week (potential site/tracking issue)

### 7. CAPI Deduplication Check
- For leads that appear in both Sheets and GHL, verify `event_id` was sent in CAPI
- Duplicate `event_id` values = deduplication failure → Meta double-counting

## Output Format

```
Lead Audit — {client_name}
Period: {date_range}

LEAD COUNTS
  GHL contacts (tagged): {n}
  Sheets rows: {n}
  Meta CAPI events: {n}
  Discrepancy: {n} ({pct}%) — [PASS/FLAG]

CUSTOM FIELD FILL RATES
  product_name: {pct}% — [PASS/FLAG]
  model_interest_tag: {pct}% — [PASS/FLAG]
  lead_source: {pct}% — [PASS/FLAG]
  utm_source: {pct}% — [PASS/FLAG]

DUPLICATES
  Duplicate phone contacts: {n} — [PASS/FLAG]
  Duplicate email contacts: {n} — [PASS/FLAG]

TAG CONSISTENCY
  Contacts missing src-* tag: {n} — [PASS/FLAG]
  Contacts missing Model Interest tag: {n} — [PASS/FLAG]

MISSED LEADS
  Rows in Missed Leads tab: {n} — [PASS/FLAG]

LEAD VELOCITY
  This period: {n} leads
  Prior period: {n} leads
  Change: {pct}% — [PASS/FLAG]

RESULT: CLEAN / {n} issues found
```

## Escalation

If any of these are flagged, escalate immediately (do not wait for next audit):
- More than 5 Missed Leads rows (GHL is failing)
- CAPI event count is 0 (CAPI is broken)
- Lead velocity dropped >70% week-over-week
- Duplicate contacts > 10% of total leads

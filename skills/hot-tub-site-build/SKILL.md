---
name: hot-tub-site-build
description: Master orchestrator for building a new hot tub dealer client website end-to-end. Use when onboarding a new hot tub dealer client and need to build their Cloudflare Pages site, set up their GHL sub-account, configure tracking, enter inventory, and verify the full stack before handoff. Runs all sub-skills in sequence with validation gates and rollback logging.
---

# Hot Tub Site Build — Master Orchestrator

Coordinates the full new-client website build for the Increase ROAS hot tub dealer fulfillment system. Runs sub-skills in order, validates each step before proceeding, and logs every action for rollback if needed.

## Template Repo

`increase-roas/hot-tub-dealer-site-template` — private repo under the `increase-roas` GitHub org. Every client gets their own clone as `increase-roas/{client-slug}-spas`.

## Required Intake (Collect Before Starting)

Do NOT start the build until ALL of these are confirmed:

| Field | Example | Notes |
|---|---|---|
| `client_name` | Acree Outdoor Living | Full business name |
| `client_slug` | acree-outdoor | Lowercase, hyphenated — used for repo + domain |
| `city` | Bentonville | Primary city for display |
| `state` | AR | Two-letter state code |
| `phone` | 479-555-0100 | Display format |
| `phone_e164` | +14795550100 | E.164 format for tel: links |
| `domain` | acreeoutdoor.com | Without www or https |
| `logo_file` | /path/to/logo.png | PNG with transparent background |
| `brand_color_primary` | #2B5C2A | Hex |
| `meta_pixel_id` | 1234567890123456 | 16 digits — from Meta Business Manager |
| `ga4_id` | G-XXXXXXXXXX | From Google Analytics |
| `clarity_id` | abc123xyz | From Microsoft Clarity |
| `ghl_location_id` | 3lNfVbW3dbI4YALaZjbK | From GHL sub-account settings |
| `ghl_api_token` | pit-xxxxxxxx-... | Private Integration Token from GHL |
| `google_sheets_id` | 1BxiMVs0XRA5... | Lead Vault Sheet ID |
| `financing_rate` | 1.2 | % of price for monthly payment calc |
| `theme` | theme-modern | theme-modern / theme-bold / theme-minimal |

**Pre-flight validation:**
- `meta_pixel_id` must be exactly 16 digits
- `domain` must not already exist as a Cloudflare Pages project
- `ghl_location_id` must resolve to a real sub-account (test with GHL API)
- Repo `increase-roas/{client_slug}-spas` must NOT already exist
- `logo_file` must exist and be a valid PNG

## Build Sequence

Run each step in order. Stop and report on failure with rollback log.

### Step 1 — GHL Sub-Account Setup
Run skill: `hot-tub-ghl-subaccount-setup`
Gate: GHL test contact creates with all 14+ custom fields populated

### Step 2 — Cloudflare Deploy
Run skill: `hot-tub-cloudflare-deploy`
Gate: Site returns 200 on live domain

### Step 3 — Inventory Entry
Run skill: `hot-tub-inventory-entry`
Gate: At least 1 product visible on /active-inventory/

### Step 4 — Full Verification
Run skill: `hot-tub-site-verification`
Gate: All checks pass (warnings allowed, failures block handoff)

### Step 5 — Client Handoff
Run skill: `hot-tub-client-handoff`

## Rollback Log Format

```
[STEP 1] GHL sub-account: {location_id} — created/validated
[STEP 1] Custom fields created: 14/14
[STEP 2] Repo created: increase-roas/{client_slug}-spas
[STEP 2] Cloudflare Pages project: {project_name}
[STEP 2] D1 database: {db_id}
[STEP 2] Env vars set: 9/9
[STEP 3] Products entered: {n}
[STEP 4] Verification: PASS/FAIL
[STEP 5] Handoff sent
```

## Idempotency Rules

Before each step, check if already completed:
- Repo exists → skip clone, check env vars
- D1 database exists → skip create, check schema
- Custom fields exist → skip create, validate

Never duplicate resources. Never overwrite existing client data.

## Human Approval Gate

Before Step 2 (deploy), output all client config values and require explicit confirmation. No production action without sign-off.

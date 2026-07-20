---
name: hot-tub-site-verification
description: 35-point verification checklist for a newly built hot tub dealer site. Use after every new client website build, before client handoff. Checks Cloudflare config, tracking, GHL integration, Google Sheets, Meta CAPI, admin auth, brand bleed, DNS, and more. Outputs a pass/fail report. Any failure blocks handoff.
---

# Hot Tub Site Verification

Run this skill after every new client build before handing off to the client. Takes ~3 minutes. Outputs a structured pass/fail report.

## Inputs Required

- `client_name` — e.g., "Acree Outdoor Living"
- `domain` — e.g., "acreeoutdoor.com"
- `cloudflare_project_name` — Cloudflare Pages project name
- `ghl_location_id` — client's GHL sub-account location ID
- `meta_pixel_id` — client's Meta Pixel ID
- `ga4_id` — client's GA4 Measurement ID
- `google_sheets_id` — client's Lead Vault Sheet ID

## Verification Checks

### 1. Cloudflare Config (via Cloudflare API)
- [ ] All 9 required env vars present: `GHL_API_TOKEN`, `GHL_LOCATION_ID`, `GOOGLE_SHEETS_ID`, `META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID`, `ALLOWED_ORIGIN`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `ADMIN_PASSWORD`
- [ ] `ADMIN_PASSWORD` is not the template default (`changeme123`)
- [ ] D1 binding named `DB` exists
- [ ] R2 binding named `PRODUCT_IMAGES` exists
- [ ] `ALLOWED_ORIGIN` matches live domain exactly (including www vs non-www)
- [ ] `META_TEST_EVENT_CODE` is NOT present (must be removed before go-live)

### 2. DNS & Site Availability
- [ ] Domain resolves (not NXDOMAIN)
- [ ] `https://{domain}` returns HTTP 200
- [ ] `https://{domain}/active-inventory/` returns 200
- [ ] `https://{domain}/admin/` returns 200 (not 500)
- [ ] `https://{domain}/api/inventory` returns valid JSON with `ok: true`
- [ ] SSL certificate is valid (no cert errors)

### 3. Brand Safety
- [ ] No "Paradise Spas" text in homepage HTML
- [ ] No "Paradise Spas" text in /active-inventory/ HTML
- [ ] No "Paradise Spas" text in /contact.html HTML
- [ ] Correct `META_PIXEL_ID` appears in page source
- [ ] Correct `GA4_ID` appears in page source
- [ ] No unfilled placeholder tokens (`{{`, `YOUR_`, `DEMO_`, `example-dealer`) in homepage source
- [ ] Logo file is not the template placeholder logo

### 4. Lead API — End-to-End Test
Submit a test lead via POST to `https://{domain}/api/lead` with:
```json
{
  "first_name": "VERIFICATION",
  "last_name": "TEST",
  "email": "verify-test@increaseroas.ai",
  "phone": "+15550000001",
  "product_name": "Verification Test Product",
  "product_slug": "verification-test",
  "model_interest_tag": "VERIFICATION TEST — DELETE",
  "source": "verification-script"
}
```
- [ ] API returns HTTP 200 with `ok: true`
- [ ] Response includes `ghl: true` (GHL contact created)
- [ ] Response includes `sheets: true` (Sheet row written)

### 5. GHL Verification
After test lead submission:
- [ ] Contact created in correct sub-account (verify by location ID)
- [ ] Contact has tag: `VERIFICATION TEST — DELETE`
- [ ] At least 10 of 14 custom fields are populated (source, campaign, product fields)
- [ ] Contact does NOT appear in wrong sub-account (Paradise Spas or other client)

### 6. Google Sheets Verification
- [ ] Lead Vault Sheet has a row for the test lead
- [ ] Row has correct timestamp, name, email, phone
- [ ] Missed Leads tab exists with correct headers
- [ ] Sheet is shared with the agency service account email

### 7. Meta CAPI Verification
- [ ] CAPI endpoint returns 200 for test event
- [ ] Event appears in Meta Events Manager Test Events (if test code still set) OR in standard events
- [ ] `event_id` deduplication field is present in CAPI payload

### 8. Admin Page Verification
- [ ] `/admin/` loads without errors
- [ ] Login with `ADMIN_PASSWORD` succeeds
- [ ] Inventory list loads from D1
- [ ] Add product form validates required fields (blocks save if name/price/image missing)
- [ ] Password is not the template default

### 9. Cleanup
- [ ] Delete test GHL contact
- [ ] Mark test Sheet row as `VERIFICATION-TEST-DELETED`

## Output Format

```
Hot Tub Launch — Site Verification Report
Client: {client_name}
Domain: {domain}
Run: {timestamp}

CLOUDFLARE CONFIG
  [PASS/FAIL] All required env vars present
  [PASS/FAIL] ADMIN_PASSWORD is not default
  [PASS/FAIL] D1 binding DB found
  [PASS/FAIL] R2 binding PRODUCT_IMAGES found
  [PASS/FAIL] ALLOWED_ORIGIN matches domain
  [PASS/FAIL] META_TEST_EVENT_CODE not present

DNS & AVAILABILITY
  [PASS/FAIL] Domain resolves
  [PASS/FAIL] Homepage 200
  [PASS/FAIL] /active-inventory/ 200
  [PASS/FAIL] /admin/ 200
  [PASS/FAIL] /api/inventory returns valid JSON
  [PASS/FAIL] SSL valid

BRAND SAFETY
  [PASS/FAIL] No Paradise Spas references
  [PASS/FAIL] Correct Pixel ID in source
  [PASS/FAIL] Correct GA4 ID in source
  [PASS/FAIL] No unfilled placeholders

LEAD API
  [PASS/FAIL] Test lead accepted

GHL
  [PASS/FAIL] Contact created in correct sub-account
  [PASS/FAIL] Custom fields populated: {n}/14
  [PASS/FAIL] No cross-client contamination

GOOGLE SHEETS
  [PASS/FAIL] Lead row written
  [PASS/FAIL] Missed Leads tab exists

META CAPI
  [PASS/FAIL] CAPI event received

ADMIN PAGE
  [PASS/FAIL] Loads without errors
  [PASS/FAIL] Login works
  [PASS/FAIL] Password not default

CLEANUP
  [PASS/FAIL] Test contact deleted
  [PASS/FAIL] Sheet row marked

RESULT: READY FOR HANDOFF / BLOCKED — {n} failures
```

## Failure Handling

Any FAIL result blocks handoff. Output the exact failure message and the fix required. Do not mark the build complete until all failures are resolved. Warnings (non-blocking) are noted but do not block.

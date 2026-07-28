# WIRING.md — snapshot-test
**Environment:** Test (GHL builder sub-account snapshot verification)
**Template version:** website-template-2.0
**Cloudflare Pages project:** `snapshot-test`
**Production URL:** https://snapshot-test-7xz.pages.dev
**GHL Location:** 8iqYr9YNiaTcGdEKl6UU (Hot Tub Launch Retainer Snapshot)
**Built:** 2026-07-28

---

## Secrets Map

| Secret | Location | Status |
|---|---|---|
| `META_CAPI_ACCESS_TOKEN` | Cloudflare Pages secret | ✅ Set |
| `META_PIXEL_ID` | Cloudflare Pages secret | ✅ Set — `1257695509378686` |
| `META_OFFLINE_WEBHOOK_SECRET` | Cloudflare Pages secret | ✅ Set — fresh key generated |
| `META_TEST_EVENT_CODE` | Cloudflare Pages secret | ✅ Set — `TEST12345` |
| `GHL_API_TOKEN` | Cloudflare Pages secret | ✅ Set — PIT |
| `GHL_LOCATION_ID` | Cloudflare Pages secret | ✅ Set — `8iqYr9YNiaTcGdEKl6UU` |
| `meta_offline_webhook_url` | GHL Custom Value | ✅ Updated → `https://snapshot-test-7xz.pages.dev/api/meta-offline` |
| `meta_offline_webhook_secret` | GHL Custom Value | ✅ Updated → fresh test secret |

**NOTE:** `META_OFFLINE_WEBHOOK_SECRET` in Cloudflare and `meta_offline_webhook_secret` in GHL are the same value. They were both set to the freshly generated key `aLuYGUo6BfdorDKalvsx5BGrJKpC+GUvrEfPJmgXyDA=` on 2026-07-28.

---

## Verification Checklist

| # | Check | Result |
|---|---|---|
| 1 | GA4 | ⬜ Not configured (intentionally empty — test env) |
| 2 | Meta Pixel browser `Lead` | ⬜ Verify in Events Manager Test Events tab |
| 3 | Clarity | ⬜ Not configured (intentionally empty — test env) |
| 4 | Lead endpoint → GHL contact | ✅ VERIFIED — contact `w0t2JMJo2KzNyOP8ajHj` created 2026-07-28T16:49:36Z |
| 5 | GHL chat widget | ⬜ Not configured (intentionally empty — test env) |
| 6 | Closebot | ⬜ Not configured (intentionally empty — test env) |
| 7 | Turnstile | ✅ Bypassed (no secret key set — skips per validate.js line 94) |
| 8 | Phone + SMS | ⬜ Placeholder number — not a real store |
| 9 | GHL External Tracking | ⬜ Not configured (intentionally empty — test env) |
| 10 | GHL Booking Calendar | ⬜ Not configured (request-mode — intentionally empty) |
| 11 | Meta CAPI `Lead` (browser+server deduped) | ✅ VERIFIED — `events_received:1`, `fbtrace_id` returned, `TEST12345` active |
| 12 | Meta offline webhook secret | ✅ VERIFIED — `QualifiedLead` POST returned HTTP 200 `ok:true` |
| 13 | GHL pipeline stage → offline event | ⬜ Requires workflow trigger in GHL UI (move contact to stage manually) |

---

## Test Lead Proof

**Submission:** 2026-07-28T16:49:36Z
- GHL Contact ID: `w0t2JMJo2KzNyOP8ajHj`
- Email: testlead@snapshot-verify.com
- Phone: +15550001234
- Tags: `src-meta`, `campaign - snapshot-test`
- Custom fields populated: `fbp`, `fbc`, `meta_event_id`, `store_pixel_id`, `email`
- Meta CAPI `Lead` event: `test-evt-001` — `events_received:1`
- Meta CAPI `QualifiedLead` offline event: `50bc84b3-c430-4246-8ad9-11d898424a1c` — HTTP 200

---

## What You Need to Do in GHL

1. **Verify workflows fire:** In GHL → Automation, find the stage-change workflows. Confirm they use `{{ custom_values.meta_offline_webhook_url }}` and `{{ custom_values.meta_offline_webhook_secret }}` as merge fields. Move the test contact (`w0t2JMJo2KzNyOP8ajHj`) to "03 Hot Pursuit" or "05 Appointment Set" and watch the Execution Logs.
2. **Check Events Manager:** Go to Meta Events Manager → your pixel `1257695509378686` → Test Events tab. The `Lead` event should show as received. The `QualifiedLead` offline event will appear in the main Events tab (not Test Events).

---

## Notes

- Vault (Google Sheets) is intentionally bypassed in this test build. The lead.js Worker was patched to make vault failures non-fatal so GHL and CAPI still fire. This patch must NOT be carried into production builds.
- D1 database binding is not set — inventory endpoints will return empty results. This is expected for a snapshot test.
- The `ALLOWED_ORIGIN` is set to `https://snapshot-test-7xz.pages.dev` (the actual Cloudflare-assigned subdomain, not `snapshot-test.pages.dev`).

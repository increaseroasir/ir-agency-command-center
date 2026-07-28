# KNOWN_ISSUES.md
Template-level bugs found and fixed across client builds.
Every entry must include: date, what broke, what fixed it, which client first exposed it.

---

## 2026-07-28 — Meta Pixel silent failure on manual dist builds

**Client:** snapshot-test (first exposed)
**What broke:** Meta Pixel Helper showed "no pixel on page" even though `client.config.js` contained `metaPixelId: '1257695509378686'`. The pixel never initialized.

**Root cause (3 compounding issues):**

1. **`client.config.js` not copied into dist.** The `build-config.mjs` script hydrates HTML/JS files in-place using `client.config.js` as a build-time input, but does not copy the file into the output directory. Every HTML page loads it as `<script src="/client.config.js">` at runtime. When the file was missing from dist, `window.CLIENT_CONFIG` was `undefined` and `tracking.js` silently skipped all pixel/GA4/Clarity initialization.

2. **`tracking.js` pixel init depends on `window.CLIENT_CONFIG` at runtime.** The pixel was only initialized if `window.CLIENT_CONFIG.tracking.metaPixelId` was truthy when `tracking.js` executed. This created a fragile runtime dependency on a separate file loading correctly.

3. **Cloudflare Rocket Loader can defer inline scripts.** Even when the pixel code was present in the HTML, Rocket Loader on the zone could defer the `<script>` block, causing the Pixel Helper to report no pixel.

**What fixed it:**

1. **`build-config.mjs` now injects the Meta pixel snippet directly into every HTML file** during the build step (`injectMetaPixel()` function, added 2026-07-28). The pixel is hardcoded as `<script data-cfasync="false">` with `fbq('init', PIXEL_ID)` — no runtime dependency on `client.config.js`.

2. **`scan-placeholders.mjs` now fails the build** if:
   - `client.config.js` is missing from the dist root
   - Any HTML file loads `tracking.js` but does not contain `fbevents.js`

3. **`data-cfasync="false"`** is added to the pixel script tag to prevent Cloudflare Rocket Loader from deferring it.

**Impact on future builds:** Any build that runs `build-config.mjs` with a valid `META_PIXEL_ID` will automatically have the pixel hardcoded into all HTML files. Any build that is missing `client.config.js` or the pixel injection will fail `scan-placeholders.mjs` before deployment.

---

## 2026-07-28 — GHL `meta_offline_webhook_secret` custom value out of sync with Cloudflare Worker secret

**Client:** snapshot-test (first exposed)
**What broke:** GHL offline webhook fired and reached the Worker (HTTP 200 response received by GHL) but returned `{"ok":false,"error":"Unauthorized"}`. GHL execution log showed `Failed`.

**Root cause:** `META_OFFLINE_WEBHOOK_SECRET` was set on Cloudflare Pages via `wrangler pages secret put` using `printf` after an earlier failed attempt used `echo`. The two shell methods produced different base64 strings because `echo` appends a trailing newline which gets base64-encoded into the secret value. The GHL custom value `meta_offline_webhook_secret` was updated during initial setup but retained the value from the first (mangled) attempt. The two sides diverged silently — both were valid base64 strings, just different ones.

**What fixed it:** Read the GHL custom value via the REST API (`GET /locations/{id}/customValues`), compared it character-by-character to the Cloudflare secret, found the divergence, and updated the GHL custom value to match exactly via `PUT /locations/{id}/customValues/{id}`.

**Prevention rules — MUST be followed on every client wiring:**

1. **Always use `printf '%s'` (not `echo`) when piping secrets into `wrangler pages secret put`** to avoid trailing-newline corruption.
2. **After setting `META_OFFLINE_WEBHOOK_SECRET` on Cloudflare, immediately read back the GHL custom value via API and assert the two values are identical** before marking wiring complete. Never assume a previous update was correct.
3. **The wiring verification script (`gate.mjs`) must include a secret-sync check** — fire a test POST to `/api/meta-offline` with the value stored in the GHL custom value and assert HTTP 200 (not 401). A 401 means the two sides are out of sync.

**Shell command to verify sync (run after every secret rotation):**
```bash
GHL_SECRET=$(curl -s "https://services.leadconnectorhq.com/locations/{LOCATION_ID}/customValues" \
  -H "Authorization: Bearer {PIT}" -H "Version: 2021-07-28" | \
  python3 -c "import sys,json; cvs=json.load(sys.stdin).get('customValues',[]); \
  print(next((c['value'] for c in cvs if 'webhook_secret' in c.get('name','')), 'NOT_FOUND'))")
echo "GHL secret: $GHL_SECRET"
curl -s -X POST "https://{DOMAIN}/api/meta-offline" \
  -H "Authorization: Bearer $GHL_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event_name":"__ping__","email":"ping@test.com","phone":"5550000000"}' | grep -o '"skipped"\|"Unauthorized"'
# Should return "skipped" (unknown event_name) not "Unauthorized"
```

---

## 2026-07-28 — GHL-007 clarification: `opportunity.lead_value` resolves; `opportunity.monetary_value` and `opportunity.date_updated` do not

**Client:** snapshot-test (confirmed via live Purchase workflow execution)
**Finding:** GHL-007 (opportunity fields send empty in webhook bodies) applies to **system opportunity fields** but NOT to all opportunity fields.

**Confirmed field behavior in GHL webhook bodies:**

| Field | Resolves? | Notes |
|---|---|---|
| `{{opportunity.monetary_value}}` | ❌ Empty | System field — GHL-007 confirmed |
| `{{opportunity.date_updated}}` | ❌ Empty | System field — GHL-007 confirmed |
| `{{opportunity.lead_value}}` | ✅ Resolves | Custom/mapped field — confirmed `"5000"` received |

**Evidence:** GHL workflow execution log for Purchase webhook fired 2026-07-28 at 6:40pm ET. Endpoint diagnostic response: `"value_received": "5000"`, `fbtrace_id: AskN5NlQTpp1olRVQ-mtUG-`. Meta confirmed receipt. Contact: alex@increaseroas.com, contact ID in builder sub-account `8iqYr9YNiaTcGdEKl6UU`.

**Implication for Purchase workflow:** `{{opportunity.lead_value}}` is safe to use in the Sold/Purchase webhook body as the `value` field. No contact-field mirror is needed for this specific field.

**Implication for other opportunity fields:** Do not assume any other opportunity field resolves without testing. The safe pattern remains: for any opportunity field that needs to pass through a webhook, test it first with the diagnostic endpoint and confirm `value_received` is non-null.

**Rule update:** GHL-007 is now scoped to "system opportunity fields" only. Custom/mapped opportunity fields (like `lead_value`) appear to resolve correctly. When in doubt, test with the diagnostic endpoint before building the workflow.

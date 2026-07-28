# TEMPLATE_DECISIONS.md
Architectural decisions made in the template. Never contradict a recorded decision without flagging it here first.

---

## 2026-07-28 — Meta Pixel is hardcoded into HTML at build time, not injected at runtime via CLIENT_CONFIG

**Decision:** The Meta Pixel snippet (`fbq('init', PIXEL_ID)`) is injected directly into every HTML file's `<head>` by `build-config.mjs` during the build step, rather than relying on `tracking.js` reading `window.CLIENT_CONFIG.tracking.metaPixelId` at runtime.

**Rationale:**
- Pixel initialization must be unconditional. A missing or cached `client.config.js` file silently kills the pixel with no error in the browser console.
- Cloudflare Rocket Loader can defer inline scripts that don't carry `data-cfasync="false"`. Hardcoding the pixel with this attribute eliminates that failure mode.
- The Pixel Helper extension and Meta Events Manager Test Events both require `fbq` to be present on page load. Dynamic injection via `document.createElement('script')` inside a deferred script can miss this window.
- `tracking.js` retains its `CLIENT_CONFIG`-based pixel init as a fallback for environments where `build-config.mjs` was not run (e.g., local dev without a hydrated config). In production, the hardcoded snippet runs first and `tracking.js` skips re-init (`if(f.fbq)return`).

**Implementation:** `scripts/build-config.mjs` → `injectMetaPixel()` function. Runs after token replacement, before SEO artifact generation. Skipped if `META_PIXEL_ID` is empty or still a `{{TOKEN}}`.

**Gate enforcement:** `scripts/scan-placeholders.mjs` fails the build if any HTML file loads `tracking.js` without `fbevents.js` present, or if `client.config.js` is missing from the dist root.

---

## 2026-07-28 — GHL_BASE_TAGS = "new-lead" is the standard automation entry tag for all leads

**Decision:** `GHL_BASE_TAGS = "new-lead"` is set in `wrangler.toml` under `[vars]` for the template root and every client build. This is the single guaranteed tag that every GHL contact receives on creation or update, regardless of traffic source, page, or form intent.

**Rationale:**
- No single tag existed that every lead received unconditionally. The `src-meta` / `src-organic` / `src-inbound-call` tags are mutually exclusive by traffic attribution, making it impossible to trigger a single GHL automation reliably on all inbound leads.
- `GHL_BASE_TAGS` was already wired in `functions/lib/ghl.js` (`baseTags(env)` reads it, splits on commas, and prepends each value to every contact's tag array before source tags, product tags, campaign tags, and intent tags). It was never populated, defaulting to empty string.
- Setting it in `[vars]` (not secrets) is correct — it is not sensitive, must be visible for auditing, and does not vary between environments.
- The value `new-lead` matches the language of Stage 1 of the Hot Tub Sales Pipeline ("New Lead") and is unambiguous.

**Implementation:** `wrangler.toml` → `[vars]` → `GHL_BASE_TAGS = "new-lead"`. Inherited by all future client builds from the template. Existing live clients must add this var in Cloudflare Pages dashboard or via `wrangler pages secret put`.

**Live verification (2026-07-28):** Test lead submitted to snapshot-test deployment `4d796fad.snapshot-test-7xz.pages.dev`. GHL contact `tbq74RtiqklXk7UPYGNv` created with tags: `['src-organic', 'new-lead', 'intent - send price and availability']`. `new-lead` confirmed present.

**Retroactive fix for existing clients:** Set `GHL_BASE_TAGS = "new-lead"` as a plain env var in Cloudflare Pages → Settings → Environment variables → Production for each live client. Applied to: `snapshot-test`, `paradise-spas`, `sun-pool-spa`, `hottublaunch` on 2026-07-28 via CF Pages API.

**Tag name is configurable:** If the automation trigger tag needs to change, update `GHL_BASE_TAGS` in `wrangler.toml` (template) and in each client's Cloudflare Pages env vars. No code changes required.

---

## 2026-07-28 — Purchase workflow uses `{{opportunity.lead_value}}` directly; no contact-field mirror needed

**Decision:** The GHL Sold/Purchase stage-change webhook sends `"value": "{{opportunity.lead_value}}"` in the body. The Worker reads `body.value`, converts to number, and sends to Meta. No intermediate contact field mirror step is required.

**Rationale:**
- `{{opportunity.lead_value}}` was tested live and confirmed to resolve to the real value (`"5000"`) in the webhook body — unlike `{{opportunity.monetary_value}}` which sends empty (GHL-007).
- The contact-field mirror pattern (write opportunity value to a contact custom field first, then send `{{contact.sale_value}}`) adds workflow complexity with no benefit when the source field already resolves.
- The Worker's value fallback chain handles the empty-string case for all other events: `body.value → body.lead_value → body.actual_sale_value → META_VALUE_* env vars`. Purchase is the only event that hard-fails on missing value (correct per Meta spec).

**Evidence:** Live Purchase webhook execution 2026-07-28 6:40pm ET. `diagnostic.value_received: "5000"`, `value: 5000` sent to Meta, `fbtrace_id: AskN5NlQTpp1olRVQ-mtUG-` confirmed.

**Scope:** This decision applies only to `{{opportunity.lead_value}}`. Other opportunity system fields (`monetary_value`, `date_updated`) remain subject to GHL-007 and must not be used in webhook bodies without testing.

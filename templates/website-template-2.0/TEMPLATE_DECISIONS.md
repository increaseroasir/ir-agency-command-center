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

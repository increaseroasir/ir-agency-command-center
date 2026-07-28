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

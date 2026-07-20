---
name: hot-tub-launch-platform
description: Master context for the Hot Tub Launch (HTL) multi-client website fulfillment platform built for Increase ROAS. MUST read before any task involving hot tub dealer client websites, the template repo, Cloudflare deployments, GHL sub-account setup, inventory management, lead tracking, or the 8 fulfillment skills. Contains full stack architecture, repo structure, token system, env var checklist, lead pipeline, GHL field map, and known gotchas.
---

# Hot Tub Launch Platform — Master Context

## What This Is

A templatized website system where each hot tub dealer client gets:
- A public storefront (homepage, inventory grid, product pages, category pages, lead forms)
- A private `/admin` page to manage inventory (add/edit/hide/delete products)
- Full tracking: Meta Pixel (browser) + Meta CAPI (server-side), GA4, Microsoft Clarity, phone click events
- Lead pipeline: Cloudflare Function → Google Sheets (Lead Vault backup) → GHL contact upsert with custom fields + tags

## Repos

| Repo | Purpose |
|---|---|
| `increase-roas/hot-tub-dealer-site-template` | **THE TEMPLATE** — clone this for every new client |
| `ssaofficial/paradise-spas-website` | Live Paradise Spas site — source of truth for battle-tested patterns |
| `ssaofficial/paradise-spas-website` branch `dummy/a2-template-drafts` | A2 design drafts (now merged into template) |

## Tech Stack

- **Hosting:** Cloudflare Pages (static HTML + Cloudflare Functions for server-side logic)
- **Database:** Cloudflare D1 (SQLite at edge) — one D1 database per client, binding name: `DB`
- **Image storage:** Cloudflare R2 — one bucket per client, binding name: `PRODUCT_IMAGES`
- **CRM:** GoHighLevel (GHL) — white-labeled under Increase ROAS, one sub-account per client
- **Lead backup:** Google Sheets via shared service account
- **Tracking:** Meta Pixel + CAPI, GA4, Microsoft Clarity (browser-side injected at build time)
- **Admin auth:** Password-based session tokens stored in D1 `admin_sessions` table
- **Lead form:** Posts to `/api/lead` — NEVER directly to a GHL webhook

## Template Repo Structure

```
client.config.js              ← FILL THIS per client — single source of truth
wrangler.toml                 ← Cloudflare Pages config (D1 + R2 bindings)
index.html                    ← A2 homepage (dark navy, multi-step form, countdown)
active-inventory/
  index.html                  ← Dynamic inventory grid (reads from D1)
  _product/index.html         ← Dynamic product page template (all slugs share this)
  product-data.js             ← LEGACY static data — kept for reference, not used in production
saunas/index.html             ← A2 saunas category page
admin/index.html              ← Inventory management UI (password-protected)
functions/
  api/lead.js                 ← Lead pipeline: Sheets → GHL → CAPI
  api/inventory.js            ← Public D1 read API (GET /api/inventory, GET /api/inventory/[slug])
  api/admin.js                ← Authenticated CRUD API for admin UI
  active-inventory/[[slug]].js ← Routes /active-inventory/[slug]/ to _product template
  db/schema.sql               ← D1 schema (products + admin_sessions tables)
  lib/
    ghl.js                    ← GHL API: upsert contact, resolve custom fields, apply tags
    sheets.js                 ← Google Sheets: Lead Vault write + Missed Leads fallback
    meta-capi.js              ← Server-side CAPI event
    validate.js               ← Turnstile + payload validation
    cors.js                   ← CORS headers (allows GET, POST, PUT, DELETE, OPTIONS)
scripts/
  build-config.mjs            ← Injects client.config.js tokens into all HTML at deploy time
  check-paradise-brand-guard.mjs ← Rejects deploy if Paradise Spas copy found in output
```

## client.config.js — Key Fields

Every new client: fill this file, set Cloudflare env vars, deploy. Nothing else changes.

Key fields (see file for full list):
- `name`, `city`, `stateAbbr`, `phone`, `phoneRaw`, `address`, `domain`
- `pixelId` (16-digit Meta Pixel ID), `ga4Id`, `clarityId`
- `unitsOnFloor`, `brandsSentence`, `reviewScore`, `reviewCount`
- `promoLabel`, `promoDeadlineISO` (for countdown timer — leave blank if no promo)
- `cfPagesProject` (Cloudflare Pages project name)
- `ghlLocationId` (for docs only — real value goes in CF env var)

## Cloudflare Env Vars — Per Client (set in Pages project settings)

| Var | Per-Client or Shared |
|---|---|
| `GHL_API_TOKEN` | Per-client (PIT from GHL sub-account) |
| `GHL_LOCATION_ID` | Per-client |
| `GOOGLE_SHEETS_ID` | Per-client |
| `META_CAPI_ACCESS_TOKEN` | Per-client |
| `META_PIXEL_ID` | Per-client |
| `ALLOWED_ORIGIN` | Per-client (their domain, e.g. `https://acreespas.com`) |
| `ADMIN_PASSWORD` | Per-client (set a strong unique password) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | **Shared** (agency service account) |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | **Shared** (agency service account) |
| `TURNSTILE_SECRET_KEY` | **Shared** |
| `ALERT_EMAIL` | **Shared** (agency alert email) |

**Critical:** `GHL_LOCATION_ID` missing = hard fail in `ghl.js`. No silent fallback to Paradise.

## D1 Schema — Products Table

Key columns: `id`, `slug` (unique), `inventory_name`, `category`, `price`, `monthly_payment`,
`status` (available/pending/sold/hidden/deleted), `quantity`, `primary_image`, `quick_facts` (JSON array),
`ghl_tags` (JSON array — applied to GHL contact on quote request), `ghl_campaign`, `form_intent`,
`promo_label`, `on_sale` (0/1), `sort_order`

Status logic: public site only shows `available` and `pending`. `hidden`/`deleted` invisible to public.

## Lead Pipeline — How It Works

1. Customer submits form → POST to `/api/lead`
2. `validate.js` checks Turnstile token + required fields
3. `ghl.js` resolves custom field IDs by name, upserts contact with all fields + tags
4. `sheets.js` writes Lead Vault row; on GHL failure writes to Missed Leads tab
5. `meta-capi.js` fires server-side Lead event with `event_id` matching browser pixel event
6. Response 200 → form shows thank-you state

**Deduplication:** Browser fires `fbq('track','Lead', {eventID: eventId})` and server sends same `event_id` to CAPI. Meta deduplicates. If `event_id` doesn't match = double-counted conversion.

**NEVER add a direct GHL webhook to any form.** All leads go through `/api/lead`.

## Tracking Architecture

- `traffic-attribution.js` — runs on page load, reads UTMs + fbclid, stores as `window.DealerTraffic` (was `ParadiseTraffic` — renamed)
- `view-content.js` — fires `ViewContent` on every page load; product pages use `data-meta-view-content` on `<body>`
- `call-tracking.js` — fires `Contact` event on `tel:` link clicks
- `pricing-tracking.js` — fires GA4 `pricing_click` on CTA button clicks (class `inv-card-cta` or `pd-cta`)
- `lead-form.js` — main form handler, reads `window.DealerTraffic`, builds full payload, posts to `/api/lead`

**When building new pages:** always include `traffic-attribution.js` in `<head>`, add `data-meta-view-content` and `data-meta-view-category` to `<body>`, use class `inv-card-cta` on inventory CTA buttons.

## Build + Deploy Flow Per New Client

```bash
# 1. Clone template
gh repo clone increase-roas/hot-tub-dealer-site-template client-name-spas
cd client-name-spas
git remote set-url origin https://github.com/increase-roas/client-name-spas.git
gh repo create increase-roas/client-name-spas --private
git push -u origin main

# 2. Fill client.config.js

# 3. Create D1 database
npx wrangler d1 create client-inventory
# Copy the database_id into wrangler.toml [[d1_databases]] binding

# 4. Init D1 schema
npm run db:init:remote

# 5. Create R2 bucket
npx wrangler r2 bucket create client-name-product-images
# Add R2 binding to wrangler.toml

# 6. Set Cloudflare env vars (all 11 listed above)

# 7. Connect GitHub repo to Cloudflare Pages project

# 8. Deploy
npm run deploy  # runs brand:guard + build:config + wrangler pages deploy

# 9. Add inventory via /admin

# 10. Run hot-tub-site-verification skill
```

## GHL Sub-Account Setup

- One sub-account per client in the white-labeled GHL
- Copy the Paradise Spas pipeline template into every new sub-account
- All 25+ custom fields must exist before first lead fires (GHL silently drops missing fields)
- Key custom fields: `product_interest`, `product_page_url`, `inventory_status`, `campaign`, `form_intent`, `traffic_channel`, `utm_source`, `utm_medium`, `utm_campaign`, `fbclid`, `gclid`, `lead_source_page`
- Source tags: `src-meta`, `src-organic`, `src-inbound-call` (auto-detected from UTM/fbclid)
- Get Location ID from sub-account settings → copy to Supabase clients table

## Supabase Clients Table

Every client stored at: `naeqxansahukjwsqisoh.supabase.co`
Key columns: `name`, `ghlLocationId`, `ghlPrivateToken`, `metaAdAccountId`, `slug`

To look up a client's GHL credentials:
1. GET `https://api.supabase.com/v1/projects/naeqxansahukjwsqisoh/api-keys` with `Authorization: Bearer $SUPABASEAPI` → get `service_role` key
2. GET `https://naeqxansahukjwsqisoh.supabase.co/rest/v1/clients?select=name,ghlLocationId,ghlPrivateToken&name=eq.Client Name` with `apikey: <service_role>`

## Known Gotchas

1. **GHL custom fields missing** — most common silent failure. Create all fields before first lead.
2. **`ALLOWED_ORIGIN` www vs non-www mismatch** — CORS fails, form breaks completely.
3. **`META_TEST_EVENT_CODE` left in production** — all CAPI events go to test stream, never count as real conversions.
4. **`ADMIN_PASSWORD` not set** — defaults to template default, security risk.
5. **D1 binding name must be exactly `DB`** — `inventory.js` and `admin.js` use `env.DB`.
6. **R2 binding name must be exactly `PRODUCT_IMAGES`** — `admin.js` uses `env.PRODUCT_IMAGES`.
7. **`product-data.js` is legacy** — do not add new products there. All inventory goes in D1 via `/admin`.
8. **Brand guard rejects Paradise copy** — if any page contains "Paradise Spas", deploy fails.
9. **`DealerTraffic` not `ParadiseTraffic`** — global was renamed. Any new JS must use `window.DealerTraffic`.
10. **Monthly payment auto-calc** — `price * CLIENT.financingRate`. If dealer overrides, set `monthly_payment` directly in D1.

## 8 Fulfillment Skills

| Skill | Trigger |
|---|---|
| `hot-tub-site-build` | Master orchestrator — new client onboarding end-to-end |
| `hot-tub-site-verification` | 35-point verification before client handoff |
| `hot-tub-ghl-subaccount-setup` | GHL sub-account creation + custom fields |
| `hot-tub-cloudflare-deploy` | Clone repo + Cloudflare Pages + D1 + R2 setup |
| `hot-tub-inventory-entry` | Bulk inventory entry into D1 |
| `hot-tub-client-handoff` | Send handoff message via GHL + mark ClickUp done |
| `hot-tub-site-update` | Push changes to existing client site |
| `hot-tub-lead-audit` | Weekly lead integrity check across GHL/Sheets/CAPI |

## What's Still Being Built

- Remaining core pages (`contact.html`, `financing.html`, `hot-tubs/`, `swim-spas/`) — partially tokenized via legacy string replacement in `build-config.mjs`, need full `{{TOKEN}}` treatment
- Brand guard script needs to be inverted (currently requires Paradise signals, should reject them)
- Intake form automation (GHL form → ClickUp task trigger)
- Meta Pixel + CAPI token creation skill
- Monthly client report skill
- Cross-client agency dashboard

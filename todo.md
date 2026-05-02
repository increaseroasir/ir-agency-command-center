# IR Agency Command Center — TODO

## Database & Schema
- [x] Create clients table in Supabase (SQL in server/lib/migrate.sql)
- [x] Create settings table in Supabase (SQL in server/lib/migrate.sql)
- [x] Create insights_cache table in Supabase (SQL in server/lib/migrate.sql)
- [x] Seed settings row 1 (included in migrate.sql)

## Server — lib utilities
- [x] server/lib/db.ts — postgres connection (raw SQL, ssl:require)
- [x] server/lib/metaApi.ts — Meta Graph API v25.0 insights fetch with pagination
- [x] server/lib/ghlApi.ts — GHL contacts fetch with mandatory pagination
- [x] server/lib/cplCalculator.ts — CPL calculation + color classification
- [x] server/lib/dateUtils.ts — date range helpers for Meta and GHL

## Server — API Routes (tRPC procedures)
- [x] settings.get — returns settings (tokens masked to last 8 chars)
- [x] settings.update — updates single field
- [x] clients.list — returns active clients (no ghlPrivateToken)
- [x] clients.create — creates new client
- [x] clients.update — updates client fields
- [x] clients.delete — soft delete (isActive=false)
- [x] insights.get — core endpoint with p-limit(10), Meta+GHL fetch
- [x] Cache layer: insights_cache table, 1-hour TTL, bust param

## Frontend — Components
- [x] DashboardLayout with sidebar (Overview, Registry, Settings)
- [x] CplBadge — color-coded CPL pill
- [x] ClientTable — overview table with skeleton loading + cache indicator
- [x] DateRangeSelector — 5 presets
- [x] ClientSlideOver — add/edit client form

## Frontend — Pages
- [x] Overview dashboard (/) — table with CPL data + summary cards
- [x] Client Registry (/registry) — CRUD table
- [x] Settings (/settings) — token + threshold management

## Design
- [x] Dark theme: bg #09090B, surface #111113, Inter font
- [x] Tabular nums on all metric columns
- [x] Color-coded CPL badges (green/orange/red/gray)

## Testing
- [x] Vitest tests for CPL calculator (7 tests)
- [x] Vitest tests for date utils (4 tests)
- [x] Vitest auth logout test (1 test)
- [x] Vitest tests for insights cache logic (9 tests)

## Secrets & Environment Setup
- [x] Store SUPABASE_DATABASE_URL in Manus Secrets panel
- [x] Store META_TOKEN in Manus Secrets panel
- [x] Store GHL_AGENCY_TOKEN in Manus Secrets panel
- [x] Create .env.example with placeholder values only
- [x] Update server/lib/db.ts to use SUPABASE_DATABASE_URL (not MySQL DATABASE_URL)
- [x] Fix cache JSONB write: use sql.json() instead of JSON.stringify()
- [x] Fix cache read: handle string-encoded legacy data gracefully
- [x] Create TASK_STARTUP.md documenting env-check pattern for future tasks
- [x] Run database migration against Supabase (all 3 tables created)
- [x] Commit all fixes and .env.example to GitHub

## Bug Fixes — Session 2
- [x] Fix GHL pagination: remove meta.total guard, paginate until page returns 0 contacts
- [x] Update Acree Tree credentials in Supabase (metaAdAccountId, ghlLocationId, ghlPrivateToken)
- [x] Bust cache — confirmed live fetch: $1,108.34 spend, 10s fetch, fromCache:false
- [x] Cache serving subsequent requests in 46ms (fromCache:true)
- [x] Push fixes to GitHub and republish (commit df1c2d9)

## GHL Date Filter Optimization — Session 2 cont.
- [x] Audit: startAfter is a cursor (not a date filter) — startAfterDate returns 422
- [x] Fix: use early-exit strategy (stop when last contact on page < sinceMs)
- [x] Fix: use meta.startAfter + meta.startAfterId as cursor for next page
- [x] Verified: last_30d now fetches 1 page (down from 11) for Acree Tree
- [x] Verified: 77 in-range contacts, 0 qualified leads (correct GHL data)
- [x] 7 new vitest tests for early-exit pagination — all 28 tests pass

## GHL Lead Count Regression — Session 3
- [x] Found root cause: GHL API returns 'contactName' not 'name' — filter was checking undefined field
- [x] Fixed: use c.contactName ?? firstName+lastName fallback in lead filter
- [x] Verified: 19 qualified leads confirmed via live API probe
- [x] Added vitest test for contactName field — 29 tests passing
- [x] Stale cache cleared
- [x] Push fix to GitHub and republish (commit 828a07b)

## Regression Test — GHL contactName Field (Session 4)
- [x] Audited existing contactName test in ghlApi.test.ts
- [x] Added dedicated regression describe block: "GHL contactName field — regression guard"
- [x] 7 new tests: name=undefined rejected, name ignored (contactName used), contactName counts, firstName+lastName fallback, whitespace-only rejected, realistic 3/6 mix
- [x] 36 tests passing (up from 29)
- [x] Committed to GitHub (commit b7f429e)

## Stat Card Three-Tier Update (Session 5)
- [x] Updated CPL Tiers stat card to show green / orange / red as three separate colored numbers
- [x] orangeCount computed from insights (cplColor === 'orange')
- [x] TypeScript clean, 36 tests passing
- [ ] Save checkpoint, push to GitHub, and republish

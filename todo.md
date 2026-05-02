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

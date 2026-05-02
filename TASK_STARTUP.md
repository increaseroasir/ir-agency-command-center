# IR Agency Command Center — Task Startup Checklist

Every new task working on this project MUST follow this checklist before making any changes.

## 1. Pull Latest Code from GitHub

```bash
cd /home/ubuntu/ir-agency-command-center
git remote add github https://github.com/increaseroasir/ir-agency-command-center.git 2>/dev/null || true
git fetch github
git merge github/main --ff-only
```

## 2. Verify Required Environment Variables

The following variables are stored in the Manus Secrets panel and are automatically injected into every sandbox. Verify they are present:

| Variable | Purpose |
|---|---|
| `SUPABASE_DATABASE_URL` | Supabase PostgreSQL — clients, settings, insights_cache tables |
| `META_TOKEN` | Meta System User Token — Graph API v25.0 ad insights |
| `GHL_AGENCY_TOKEN` | GoHighLevel agency PIT — sub-account sync |

Run this check at the start of every task:

```bash
node -e "
const required = ['SUPABASE_DATABASE_URL','META_TOKEN','GHL_AGENCY_TOKEN'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('MISSING ENV VARS:', missing.join(', '));
  console.error('Check the Manus Secrets panel — these should be auto-injected.');
  process.exit(1);
} else {
  console.log('All required env vars present.');
}
"
```

If any variable is missing, check the Manus Secrets panel (Settings → Secrets in the Management UI). Do NOT ask the user for credentials — they are always stored there.

## 3. Database Tables

The Supabase database has three IR-specific tables:

| Table | Purpose |
|---|---|
| `clients` | Client credentials (metaAdAccountId, ghlLocationId, ghlPrivateToken, etc.) |
| `settings` | Global config — metaAccessToken, ghlAgencyToken, cplGreenMax, cplOrangeMax |
| `insights_cache` | 1-hour cache for Meta+GHL insights per date preset |

If tables are missing, run `server/lib/migrate.sql` against Supabase.

## 4. Key Architecture Decisions

- **`DATABASE_URL`** (MySQL/TiDB) — used ONLY by the auth/user system (Drizzle ORM in `server/db.ts`)
- **`SUPABASE_DATABASE_URL`** (PostgreSQL) — used by all IR-specific routes (`server/lib/db.ts`)
- All Meta and GHL tokens are read **server-side only** — never sent to the browser
- `META_TOKEN` from env is the fallback; the primary source is `settings.metaAccessToken` in the DB
- `GHL_AGENCY_TOKEN` from env is the fallback; per-client PITs are in `clients.ghlPrivateToken`
- Cache key format: `insights:{datePreset}` or `insights:custom:{sinceMs}:{untilMs}`
- CPL thresholds: green < `cplGreenMax` (default 35), orange < `cplOrangeMax` (default 50), red ≥ orange max

## 5. Running Tests

```bash
cd /home/ubuntu/ir-agency-command-center
pnpm test
```

All 21 tests must pass before committing any changes.

## 6. Pushing Changes to GitHub

```bash
cd /home/ubuntu/ir-agency-command-center
git add -A
git commit -m "feat: description of changes"
git push github main
```

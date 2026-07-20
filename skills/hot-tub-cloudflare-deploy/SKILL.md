---
name: hot-tub-cloudflare-deploy
description: Deploy a new hot tub dealer client site to Cloudflare Pages. Use during new client onboarding to clone the template repo, create the Cloudflare Pages project, create the D1 database, set all environment variables, run the build config script, and initialize the D1 schema. Part of the hot-tub-site-build workflow.
---

# Hot Tub Cloudflare Deploy

Deploys a new client site from the `increase-roas/hot-tub-dealer-site-template` repo to Cloudflare Pages.

## Inputs Required

All fields from the hot-tub-site-build intake, plus:
- `cloudflare_account_id` — from Cloudflare dashboard (Alex@increaseroas account)
- `cloudflare_api_token` — from `CLOUDFLARE_API_TOKEN` env var

## Step 1 — Clone Template Repo

```bash
gh repo clone increase-roas/hot-tub-dealer-site-template /tmp/{client_slug}-spas
cd /tmp/{client_slug}-spas
git remote set-url origin https://github.com/increase-roas/{client_slug}-spas.git
gh repo create increase-roas/{client_slug}-spas --private --source=. --push
```

**Conflict check:** If repo `increase-roas/{client_slug}-spas` already exists, STOP. Do not overwrite.

## Step 2 — Fill client.config.js

Edit `client.config.js` in the cloned repo with all client values. Run:
```bash
npm run build:config
```
Verify no placeholder tokens remain in built HTML.

## Step 3 — Create D1 Database

```bash
npx wrangler d1 create {client_slug}-inventory
```
Copy the returned `database_id` into `wrangler.toml` under `[[d1_databases]]`.

## Step 4 — Create Cloudflare Pages Project

Via Cloudflare API:
```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects
{
  "name": "{client_slug}-spas",
  "production_branch": "main",
  "source": { "type": "github", "config": { "owner": "increase-roas", "repo_name": "{client_slug}-spas", "production_branch": "main" } }
}
```

## Step 5 — Set Environment Variables

Set all 9 required env vars via Cloudflare API (Pages project settings):

**Per-client (set fresh):**
- `GHL_API_TOKEN` → client PIT
- `GHL_LOCATION_ID` → client location ID
- `GOOGLE_SHEETS_ID` → client Lead Vault Sheet ID
- `META_CAPI_ACCESS_TOKEN` → client CAPI token
- `META_PIXEL_ID` → client Pixel ID
- `ALLOWED_ORIGIN` → `https://www.{domain}` (with www)

**Shared (copy from master credentials doc):**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `ALERT_EMAIL` → alex@increaseroas.ai

**Temporary (remove before go-live):**
- `META_TEST_EVENT_CODE` → set during testing, delete before launch

**Validation:** Fetch env vars list from Cloudflare API and confirm all 9 are present.

## Step 6 — Add D1 Binding

Via Cloudflare API, add D1 binding to the Pages project:
```json
{ "name": "DB", "type": "d1", "id": "{database_id}" }
```

## Step 7 — Initialize D1 Schema

```bash
cd /tmp/{client_slug}-spas
npm run db:init:remote
```
Verify by querying: `SELECT COUNT(*) FROM products` → should return 0.

## Step 8 — Trigger Deploy

Push a commit to trigger the first Cloudflare Pages build:
```bash
git commit --allow-empty -m "chore: trigger initial deploy for {client_name}"
git push origin main
```
Wait for build to complete (poll Cloudflare API for build status). Timeout: 5 minutes.

## Step 9 — Point Domain

Add custom domain to Cloudflare Pages project via API. If domain is on Cloudflare DNS, add CNAME record automatically. If external registrar, output the DNS instructions for the client.

## Output

```
Cloudflare Deploy — {client_name}
Repo: increase-roas/{client_slug}-spas
Pages project: {client_slug}-spas
D1 database: {database_id}
Env vars: 9/9 set
D1 schema: initialized
Build: deployed
Domain: {domain} → {status}
STATUS: READY
```

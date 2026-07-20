---
name: hot-tub-site-update
description: Update an existing hot tub dealer client site — change branding, update tracking IDs, modify inventory, or push template updates. Use when a client requests changes to their live site or when a template improvement needs to be pushed to one or more client sites.
---

# Hot Tub Site Update

Handles post-launch updates to existing client sites.

## Inputs Required

- `client_name` — identifies the client
- `client_slug` — used to find the repo (`increase-roas/{client_slug}-spas`)
- `update_type` — one of: `branding`, `tracking`, `inventory`, `template-update`, `env-var`
- Description of what to change

## Update Types

### Branding Update
Changes to logo, colors, phone, address, or copy.
1. Clone the client repo
2. Update `client.config.js` with new values
3. Run `npm run build:config`
4. Commit and push → triggers Cloudflare Pages rebuild
5. Verify brand guard passes: `npm run brand:guard`
6. Run `hot-tub-site-verification` brand safety checks

### Tracking ID Update
Changes to Pixel ID, GA4 ID, Clarity ID.
1. Update `client.config.js`
2. Update Cloudflare env vars via API (for CAPI token changes)
3. Run `npm run build:config` and push
4. Run `hot-tub-site-verification` tracking checks only
5. Confirm new IDs appear in page source

### Inventory Update
Add, edit, hide, or delete products.
- Read skill: `hot-tub-inventory-entry` for add/edit operations
- For hide: PATCH product status to `hidden` via admin API
- For delete: DELETE product via admin API (confirm with user first)
- Verify `/active-inventory/` reflects changes

### Template Update
Push a fix or improvement from the template repo to a client repo.
1. Identify which files changed in the template
2. Cherry-pick or manually apply the changes to the client repo
3. Test locally if possible
4. Push and verify

### Env Var Update
Change a Cloudflare environment variable.
1. Update via Cloudflare API
2. Trigger a new deploy (push empty commit or use Cloudflare dashboard)
3. Verify the change is live

## Safety Rules

- Never change `GHL_LOCATION_ID` on a live site without explicit confirmation — this reroutes all leads
- Never delete products without user confirmation
- Always run brand guard after any branding change
- Always verify the site returns 200 after any deploy

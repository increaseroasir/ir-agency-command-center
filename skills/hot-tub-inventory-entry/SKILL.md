---
name: hot-tub-inventory-entry
description: Enter initial inventory for a new hot tub dealer client into their D1 database. Use during new client onboarding or when a client provides a list of products to add. Accepts CSV, plain text, or photo descriptions. Validates all required fields, auto-generates slugs and monthly payments, and writes to D1 via the admin API. Part of the hot-tub-site-build workflow.
---

# Hot Tub Inventory Entry

Enters products into the client's D1 database via the `/api/admin` endpoint.

## Inputs Required

- `domain` — live client domain (e.g., acreeoutdoor.com)
- `admin_password` — from `ADMIN_PASSWORD` env var
- Inventory data — CSV, text list, or structured description

## Required Fields Per Product

| Field | Required | Notes |
|---|---|---|
| `inventory_name` | Yes | Full model name |
| `category` | Yes | Hot Tub / Swim Spa / Sauna / Massage Chair |
| `price` | Yes | Integer, no $ sign |
| `primary_image` | Yes | R2 URL or absolute path |
| `slug` | Auto | Generated from inventory_name if not provided |
| `status` | Default: available | available / pending / sold / hidden |
| `quantity` | Default: 1 | Integer |
| `ghl_tags` | Yes | JSON array, e.g. ["Model Interest - Eco Spa E3"] |
| `quick_facts` | Recommended | JSON array, e.g. ["Seats 4", "36 Jets"] |
| `short_description` | Recommended | 1-2 sentences |
| `monthly_payment` | Auto | Calculated as price × financing_rate / 100 |

## Auto-Generation Rules

**Slug:** Lowercase the `inventory_name`, replace spaces with hyphens, remove special characters. Example: "Eco Spa E3" → `eco-spa-e3`. Check for slug uniqueness — append `-2` if collision.

**Monthly payment:** `Math.round(price * financing_rate / 100)` where `financing_rate` comes from `client.config.js` (default 1.2).

**GHL tags:** If not provided, default to `["Model Interest - {inventory_name}"]`.

## Validation Before Write

Block save if any of these are missing or invalid:
- `inventory_name` — empty → reject
- `price` — not a positive integer → reject
- `primary_image` — empty or not a valid URL/path → reject
- `slug` — contains spaces or special chars → auto-fix, then confirm
- `category` — not one of the 4 allowed values → reject

Warn (non-blocking) if missing:
- `quick_facts` — show warning, allow save
- `short_description` — show warning, allow save
- `ghl_tags` — auto-generate default, show notice

## Write to D1

Authenticate to admin API:
```
POST https://{domain}/api/admin/auth
{ "password": "{admin_password}" }
```
Get session token from response.

For each product:
```
POST https://{domain}/api/admin/products
Authorization: Bearer {session_token}
{ ...product fields... }
```

## Verification After Entry

After all products are written:
- GET `https://{domain}/api/inventory` → confirm products appear
- GET `https://{domain}/active-inventory/` → confirm page loads with products
- For each product: GET `https://{domain}/active-inventory/{slug}/` → confirm 200

## Output

```
Inventory Entry — {client_name}
Products entered: {n}
Products with warnings: {n}
Products rejected: {n}
Verification: all product pages return 200
STATUS: COMPLETE
```

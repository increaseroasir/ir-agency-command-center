---
name: hot-tub-ghl-subaccount-setup
description: Set up a GoHighLevel sub-account for a new hot tub dealer client. Use during new client onboarding to create or validate the GHL sub-account, create all required custom fields, copy the pipeline template, and confirm the Location ID and Private Integration Token are valid. Part of the hot-tub-site-build workflow.
---

# Hot Tub GHL Sub-Account Setup

Sets up the GHL sub-account for a new hot tub dealer client. Uses the GHL MCP server (`ghl-full-tools`) and Supabase for client record management.

## Inputs Required

- `client_name` — full business name
- `ghl_location_id` — if sub-account already exists; otherwise create new
- `ghl_api_token` — Private Integration Token (PIT) for the sub-account

## Step 1 — Validate or Create Sub-Account

If `ghl_location_id` is provided, validate it:
```
GET https://services.leadconnectorhq.com/locations/{ghl_location_id}
Authorization: Bearer {ghl_api_token}
```
If 200 → sub-account exists, proceed to Step 2.
If 404 → sub-account does not exist. Create it via GHL API, then get the new Location ID.

## Step 2 — Create Required Custom Fields

Use the GHL MCP tool `create_custom_field` for each field. Check existing fields first — skip any that already exist.

Required custom fields (all text type unless noted):

| Field Name | Key | Type |
|---|---|---|
| Product Name | `product_name` | text |
| Product Slug | `product_slug` | text |
| Product Category | `product_category` | text |
| Product Page URL | `product_page_url` | text |
| Product Image URL | `product_image_url` | text |
| Model Interest Tag | `model_interest_tag` | text |
| Inventory Status | `inventory_status` | text |
| Available Quantity | `available_quantity` | text |
| Inventory Status Tag | `inventory_status_tag` | text |
| Lead Source | `lead_source` | text |
| Campaign | `campaign` | text |
| Form Intent | `form_intent` | text |
| Traffic Channel | `traffic_channel` | text |
| UTM Source | `utm_source` | text |
| UTM Medium | `utm_medium` | text |
| UTM Campaign | `utm_campaign` | text |
| FBclid | `fbclid` | text |
| Lead Source Page | `lead_source_page` | text |

**Validation gate:** After creation, fetch the fields list and confirm all 18 exist. Report count: `{n}/18 custom fields confirmed`.

## Step 3 — Copy Pipeline Template

Copy the "Hot Tub Sales Pipeline" template from the master sub-account into this sub-account. Stages:
1. New Lead
2. Contacted
3. Appointment Set
4. Deposit Taken
5. Financing Sent
6. Closed Won
7. Lost

## Step 4 — Validate PIT

Test the PIT by making a read-only API call:
```
GET https://services.leadconnectorhq.com/contacts/?locationId={ghl_location_id}&limit=1
Authorization: Bearer {ghl_api_token}
```
If 200 → PIT is valid.
If 401/403 → PIT is expired or wrong. Stop and alert — do not proceed.

## Step 5 — Update Supabase

Update the client record in Supabase `clients` table:
```
PATCH https://naeqxansahukjwsqisoh.supabase.co/rest/v1/clients?name=eq.{client_name}
{ "ghlLocationId": "{ghl_location_id}", "ghlPrivateToken": "{ghl_api_token}" }
```

## Output

```
GHL Sub-Account Setup — {client_name}
Location ID: {ghl_location_id}
PIT: valid
Custom fields: {n}/18 confirmed
Pipeline: copied
Supabase: updated
STATUS: READY
```

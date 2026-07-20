---
name: hot-tub-client-handoff
description: Send client handoff after a new hot tub dealer site build is verified and ready. Use as the final step of the hot-tub-site-build workflow. Sends the client their site URL, admin login credentials, and onboarding instructions via GHL conversation. Marks the ClickUp task complete.
---

# Hot Tub Client Handoff

Final step of the new client build. Sends handoff message via GHL and marks the build complete.

## Inputs Required

- `client_name` — full business name
- `domain` — live site URL
- `admin_password` — the `/admin` page password
- `ghl_location_id` — client's GHL sub-account
- `ghl_api_token` — client's PIT
- `client_contact_id` — GHL contact ID for the dealer owner

## Step 1 — Send Handoff Message via GHL

Send via GHL SMS or email to the dealer owner contact:

```
Hi {first_name} — your new website is live!

Site: https://{domain}
Inventory Manager: https://{domain}/admin/
Admin Password: {admin_password}

To add or update inventory:
1. Go to https://{domain}/admin/
2. Enter your password
3. Click "Add Product" to add a new item
4. To hide or remove a product, click Edit → change status to Hidden or delete it

Your site is connected to your CRM — every quote request goes straight into your pipeline.

[Loom link: 2-minute walkthrough of the admin panel]

Questions? Reply here or call 555-555-0100.
```

## Step 2 — Apply GHL Tags to Dealer Contact

Apply to the dealer owner's GHL contact:
- `website-launched`
- `admin-credentials-sent`
- `onboarding-complete`

## Step 3 — Add GHL Note

Add a note to the dealer contact:
```
Website launched: https://{domain}
Admin URL: https://{domain}/admin/
Build date: {date}
Verified by: hot-tub-site-verification — all checks passed
```

## Step 4 — Mark ClickUp Task Complete

If ClickUp task ID is available, mark the "Website Build" task as complete via ClickUp API.

## Output

```
Client Handoff — {client_name}
Site: https://{domain}
Handoff message: sent via GHL
GHL tags applied: website-launched, admin-credentials-sent, onboarding-complete
ClickUp: marked complete
STATUS: DONE
```

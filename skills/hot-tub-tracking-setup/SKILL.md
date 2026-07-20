---
name: hot-tub-tracking-setup
description: CSM workflow for collecting Meta Pixel, GA4, and Clarity IDs during a live client onboarding call. Uses Leadsie for Meta access first, with manual screen-share fallback. Use when preparing to build a new hot tub client site.
---

# hot-tub-tracking-setup

## Description
This skill walks the Customer Success Manager (CSM) through the process of obtaining tracking IDs (Meta Pixel, GA4, Clarity) during a live onboarding call with a new hot tub dealer client. Because these IDs require access to the client's Meta and Google accounts, they cannot be fully automated and must be collected via screen share or direct access links.

## Trigger
Use when user says: "walk me through tracking setup", "how do I get the client's pixel", "get tracking IDs for new client", or as a prerequisite step for `hot-tub-site-build`.

## Prerequisites
- The CSM is on a live Zoom/Teams call with the client.
- The client is logged into their Meta Business Manager and Google accounts.

## Workflow: Meta Pixel ID

### Attempt 1: Leadsie (Preferred Method)
1. Send the client your agency's Leadsie access link in the Zoom chat.
2. Tell the client: *"Please click this link. It will ask you to log into Facebook and grant us access to your Ad Account and Pixel. This lets us set up the tracking without needing your passwords."*
3. Wait for the client to complete the flow.
4. Once access is granted, open your Meta Business Manager.
5. Go to **Business Settings > Data Sources > Datasets** (or Pixels).
6. Find the client's dataset/pixel. The **15-16 digit ID** will be displayed next to the name.
7. Save this as the `META_PIXEL_ID`.

### Attempt 2: Manual Screen Share (Fallback)
If Leadsie fails or the client gets confused:
1. Ask the client to share their screen.
2. Direct them to go to: `business.facebook.com/settings`
3. Tell them: *"On the left sidebar, click 'Data Sources', then click 'Datasets' (or 'Pixels' if it's an older account)."*
4. Tell them: *"Click on your main business pixel in the middle column."*
5. Tell them: *"Look at the top right of the middle column, right under the pixel name. You'll see an ID number. Please copy that and paste it into the Zoom chat."*
6. Save this as the `META_PIXEL_ID`.

*Note: If the client does not have a Pixel, you will need to guide them to click "Add" in the Datasets menu to create one, then copy the new ID.*

## Workflow: GA4 Measurement ID

### Attempt 1: Agency Creates Property (Preferred Method)
If the client does not have GA4, or you prefer to own the property:
1. Log into the agency's Google Analytics account.
2. Click **Admin** (gear icon) > **Create Property**.
3. Name it `[Client Name] Website`.
4. Set the timezone to the client's local timezone.
5. Choose **Web** as the platform.
6. Enter the client's domain URL.
7. Once created, the Web Stream Details panel will open. Copy the **Measurement ID** (starts with `G-`).
8. Save this as the `GA4_ID`.

### Attempt 2: Manual Screen Share (If client owns existing GA4)
If the client insists on using their existing GA4:
1. Ask the client to share their screen.
2. Direct them to go to: `analytics.google.com`
3. Tell them: *"Click the Admin gear icon in the bottom left."*
4. Tell them: *"In the Property column (middle), click 'Data Streams'."*
5. Tell them: *"Click on your website stream."*
6. Tell them: *"In the top right of the panel that opens, you'll see a 'Measurement ID' starting with 'G-'. Please copy that and paste it into the Zoom chat."*
7. Save this as the `GA4_ID`.

## Workflow: Microsoft Clarity ID

Clarity is always created by the agency.
1. Log into `clarity.microsoft.com` using the agency account.
2. Click **New Project**.
3. Enter the client's business name and website URL.
4. Once the project is created, go to **Settings > Setup**.
5. Look for the project ID in the tracking code or the URL (it's a 10-character alphanumeric string).
6. Save this as the `CLARITY_ID`.

## Output
At the end of this workflow, you must have these three values ready to paste into `client.config.js`:
- `META_PIXEL_ID` (15-16 digits)
- `GA4_ID` (starts with G-)
- `CLARITY_ID` (10 characters)

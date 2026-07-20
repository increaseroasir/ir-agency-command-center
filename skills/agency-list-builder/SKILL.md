---
name: agency-list-builder
description: End-to-end workflow for scraping, enriching, cleaning, and formatting B2B/B2C prospect lists for marketing agencies. Use when the user wants to build a list of prospects in a specific niche (e.g., hot tub dealers, RV dealers, tree service), verify phone numbers for SMS campaigns, enrich with Google Maps/SpyFu/Facebook Ad Library data, and output a formatted Google Sheet or GHL-ready CSV.
---

# Agency List Builder

This skill provides a complete, replicable workflow for building high-quality, enriched prospect lists for any agency niche. It takes a raw idea (e.g., "I need a list of RV dealers") and turns it into a formatted Google Sheet and a GoHighLevel (GHL) ready import CSV, complete with data enrichment and phone verification.

## Core Principles

1. **Apify First:** Always use Apify for data scraping and enrichment (Google Maps, Facebook Ad Library). NEVER use Apollo.
2. **Twilio for SMS Verification:** Always use Twilio Lookup to verify line types (mobile vs. landline) before generating SMS import lists.
3. **SpyFu for Traffic/Ads:** Use SpyFu API for Google Ads spend and organic traffic estimates.
4. **GHL Ready:** Final output must include a clean CSV formatted specifically for GoHighLevel import (E.164 phone numbers).

## Workflow Execution

Follow these steps in order when a user requests a prospect list:

### Phase 1: Discovery & API Setup

Ask the user for the following information before writing any scripts:

1. **Niche & Location:** "What specific niche are we targeting (e.g., RV dealers, Med Spas)? And what location (nationwide, specific states, radius around a city)?"
2. **Data Sources:** "We will use Apify for Google Maps scraping (best source for local businesses). Do you have an Apify API key? If not, I can show you how to get one for free."
3. **Enrichment Needs:** "Do you want to enrich this list with:
   - Twilio Lookup (to verify which numbers are mobile for SMS campaigns)? Requires Twilio SID/Auth Token.
   - SpyFu (to see who is running Google Ads and their estimated spend)? Requires SpyFu API key.
   - Facebook Ad Library (to see who is running active FB ads)? Uses Apify."

*If the user doesn't have Apify:* Instruct them to go to `console.apify.com/account/integrations` to get their free key.
*If the user doesn't have Twilio:* Instruct them to get their Account SID and Auth Token from `console.twilio.com`.
*If the user doesn't have SpyFu:* Instruct them to get their Base64 Key from `spyfu.com/account/api`.

### Phase 2: Data Collection (Apify Google Maps)

1. Write a Python script using the `requests` library to call the Apify API.
2. Use the **Google Maps Scraper** actor (or similar reliable actor for local business search).
3. Set the search terms based on the niche (e.g., `["RV dealer", "RV sales", "motorhome dealer"]`).
4. Set the locations based on user input.
5. Run the script and save the raw JSON output.

### Phase 3: Cleaning & Deduplication

1. Load the raw JSON into a Pandas DataFrame.
2. **Remove Noise:** Filter out irrelevant categories (e.g., if searching for hot tub dealers, remove hotels, resorts, day spas).
3. **Deduplicate:** Remove duplicate entries based on phone number or address.
4. **Format Phones:** Convert all phone numbers to E.164 format (e.g., `+17012345678`) for GHL compatibility.

### Phase 4: Enrichment (Optional based on Phase 1)

Execute these sequentially if requested:

**A. Twilio Phone Verification (For SMS)**
- Use the Twilio Lookup API to check the `line_type_intelligence` of each phone number.
- Categorize as `mobile`, `landline`, or `voip`.
- *Note: Only `mobile` numbers should be included in the final GHL SMS import CSV.*

**B. SpyFu Google Ads/Traffic Enrichment**
- Use the SpyFu Domain Stats API (`https://api.spyfu.com/v1/seo/domain-stats?domain=example.com`).
- Authenticate using Basic Auth with the Base64 key.
- Extract `seoClicks` (organic traffic) and `ppcSpend` (Google Ads spend).
- *Reference: See `references/spyfu_api.md` for exact implementation details.*

**C. Facebook Ad Library Check**
- Use Apify to search the Facebook Ad Library by `page_name` (business name).
- Set `limitPerSource: 1` to save costs—we only need to know IF they are running ads, not download every ad.
- Add columns: `Running Facebook Ads` (Yes/No) and `Facebook Ad Library URL`.

### Phase 5: Formatting & Delivery

Generate two files for the user:

1. **The Master Spreadsheet (.xlsx):**
   - Use `openpyxl` to format the Excel file.
   - Create segmented tabs (e.g., "Dashboard", "Running Ads", "No Ads (Cold Outreach)", "Mobile Only").
   - Apply alternating row colors, freeze the top row, and auto-fit columns.
   - Include all enriched data (reviews, ratings, ad spend, line types).

2. **The GHL Import CSV (.csv):**
   - Keep only essential columns: `First Name`, `Last Name`, `Phone` (E.164 format), `Email`, `Address1`, `City`, `State`, `Postal Code`, `Country`, `Tags`.
   - Ensure no scientific notation on phone numbers.
   - Filter to only include `mobile` numbers if Twilio verification was run.

Upload both files to the user's Google Drive using the `gws` CLI (or `rclone` if `gws` is unavailable) and provide the shareable links.

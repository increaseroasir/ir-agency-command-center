---
name: meta-hammer-them-campaigns
description: Setup "Hammer Them" Meta Ads retargeting campaigns. Use when the user wants to create a retargeting blitz campaign using a bulk upload XLSX file. Handles complex campaign structure, custom audience inclusions/exclusions, and precise video view engagement settings.
---

# Meta Ads "Hammer Them" Campaigns

This skill provides the script and template to perfectly build a Meta Ads bulk upload XLSX file for "Hammer Them" retargeting blitz campaigns.

## What is a Hammer Them Campaign?
A "Hammer Them" campaign is a high-budget ($500/day CBO), short-duration (1-2 days) retargeting blitz. It uses "Outcome Engagement" > "On your ad" > "Video views" > "Maximize ThruPlay views".
It typically targets a list of specific ZIP codes and includes a set of base retargeting audiences (e.g., website visitors, leads) while excluding specific ad-level audiences per ad set.

## Usage

When a user requests to build a Hammer Them campaign, you will use the provided python script to generate the XLSX file. 

### 1. Gather Required Information
You will need the following from the user or context:
- `client_name`: The name of the client/business (e.g., "Paradise Spas").
- `zip_list`: A list of ZIP codes to target.
- `included_audiences`: A list of base retargeting audiences to INCLUDE in every ad set. Format must be exactly `ID:Name` (e.g., `['120246268462680117:Red River Valley Fair Website Visitors']`).
- `rt_audiences`: A list of dictionaries representing the unique ad sets to create and the audience to EXCLUDE for that ad set. 
  - Example: `[{'name': 'RT AD 1', 'id': '120246267898480117', 'audience_name': 'RT AD 1'}]`
- `page_id`: The Meta Page ID for the business (e.g., `1452853874983084`).

### 2. Execute the Script
Create a temporary python script to import and call the builder function:

```python
import sys
sys.path.append('/home/ubuntu/skills/meta-hammer-them-campaigns/scripts')
from build_hammer_them_xlsx import build_xlsx

# Define variables gathered in Step 1
client_name = "Client Name"
zip_list = ["12345", "67890"]
included_audiences = ["111:Website Visitors", "222:Leads"]
rt_audiences = [
    {"name": "RT AD 1", "id": "333", "audience_name": "RT AD 1"},
    {"name": "RT AD 2", "id": "444", "audience_name": "RT AD 2"}
]
page_id = "55555555"
output_path = "/home/ubuntu/upload/hammer_them_upload.xlsx"

build_xlsx(output_path, client_name, zip_list, included_audiences, rt_audiences, page_id)
```

Run this temporary script using the `shell` tool.

### 3. Deliver the File
Deliver the generated `.xlsx` file to the user using the `message` tool. 
Remind the user that the campaign is created without ads. They must manually add the video creatives to each ad set after importing the file into Ads Manager.

## Important Notes on Meta's Bulk Upload Format
The provided template (`templates/meta_export_template_630cols.xlsx`) uses the 630-column format required by Meta.
Key settings handled automatically by the script:
- `Destination Type`: `ON_VIDEO` (required for Video views engagement)
- `Targeting Optimization`: `none` (disables Advantage+ audience expansion)
- `Targeting Relaxation`: `custom_audience: Off, lookalike: Off`
- `Individual Setting`: `geo: On`
- `Zip` format: `US:12345, US:67890` (Meta requires the country prefix)
- Ad-level fields are intentionally left blank to avoid `Creative Type` validation errors when no creative is attached.

# SpyFu API Reference

When enriching domain data with SpyFu, use the Domain Stats API endpoint.

## Endpoint

`GET https://api.spyfu.com/v1/seo/domain-stats?domain={domain}`

## Authentication

SpyFu uses Basic Authentication. The user must provide their Base64 Key from `spyfu.com/account/api`.

**Python Example:**

```python
import requests

domain = "example.com"
base64_key = "YOUR_BASE64_KEY_HERE"

url = f"https://api.spyfu.com/v1/seo/domain-stats?domain={domain}"

headers = {
    "Authorization": f"Basic {base64_key}"
}

response = requests.get(url, headers=headers)
data = response.json()

# Extract relevant fields
organic_clicks = data.get('seoClicks', 0)
ppc_spend = data.get('ppcSpend', 0)
```

## Key Fields to Extract

- `seoClicks`: Estimated monthly organic traffic.
- `ppcSpend`: Estimated monthly Google Ads spend.
- `ppcClicks`: Estimated monthly paid clicks.
- `organicKeywords`: Number of organic keywords ranking.
- `ppcKeywords`: Number of paid keywords ranking.

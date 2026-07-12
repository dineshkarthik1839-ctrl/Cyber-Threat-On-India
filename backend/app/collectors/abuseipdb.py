import requests
from app.config import ABUSEIPDB_API_KEY

URL = "https://api.abuseipdb.com/api/v2/blacklist"


def fetch_blacklist():

    headers = {
        "Key": ABUSEIPDB_API_KEY,
        "Accept": "application/json"
    }

    params = {
        "confidenceMinimum": 90
    }

    response = requests.get(
        URL,
        headers=headers,
        params=params
    )

    return response.json()
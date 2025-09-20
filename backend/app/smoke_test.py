import requests
import json

urls = [
    'http://127.0.0.1:8000/api/dashboard/low-stock',
    'http://127.0.0.1:8000/api/dashboard/expiring-ingredients',
    'http://127.0.0.1:8000/api/dashboard/expired-ingredients',
    'http://127.0.0.1:8000/api/dashboard/surplus-ingredients',
    # 'http://127.0.0.1:8000/api/auth/session'  # test this separately with an Authorization header
]

for url in urls:
    try:
        r = requests.get(url, timeout=10)
        print(url, r.status_code, len(r.content))
        if r.status_code == 200:
            try:
                print(json.dumps(r.json()[:2], default=str))
            except Exception:
                pass
    except Exception as e:
        print(url, 'ERROR', e)
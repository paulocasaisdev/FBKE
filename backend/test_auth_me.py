import requests
url = 'http://127.0.0.1:5000/api/auth/me'
# Without Origin
r = requests.get(url)
print('No Origin - Status:', r.status_code)
print('Body:', r.text)
# With Origin header
headers = {'Origin': 'https://gojuryukaratekai.com.br'}
r2 = requests.get(url, headers=headers)
print('With Origin - Status:', r2.status_code)
print('Access-Control-Allow-Origin:', r2.headers.get('Access-Control-Allow-Origin'))
print('Body:', r2.text)

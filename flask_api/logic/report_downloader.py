import requests
import time
import os

LOGIN_URL = "https://qa-api.systemisers.in/users/sign_in"
REPORT_URL_TEMPLATE = "https://qa-api.systemisers.in/api/v1/report_generator/{report_id}/generation?type=project_report"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def download_report(report_id, email, password, output_file=None, retries=3, delay=5):
    session = requests.Session()
    print("🔐 Logging in...")
    payload = { "email": email, "password": password }

    try:
        response = session.post(LOGIN_URL, json=payload, headers=HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Login failed: {e}")
        return False

    print("Logged in!")
    report_url = REPORT_URL_TEMPLATE.format(report_id=report_id)

    if not output_file:
        os.makedirs("output_reports", exist_ok=True)
        output_file = f"output_reports/Report_{report_id}.pdf"

    for attempt in range(1, retries + 1):
        try:
            report_response = session.get(report_url)
            if report_response.status_code == 200:
                with open(output_file, "wb") as f:
                    f.write(report_response.content)
                print(f"✅ Report saved as: {output_file}")
                return True
            else:
                print(f"⚠️ Attempt {attempt}: Status {report_response.status_code}. Retrying in {delay}s...")
                time.sleep(delay)
        except Exception as e:
            print(f"Attempt {attempt} failed: {e}")
            time.sleep(delay)

    print(f"❌ Failed to download report {report_id} after {retries} attempts.")
    return False

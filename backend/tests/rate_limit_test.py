import requests

BASE_URL = "http://localhost:8000/api/v1/" 
LOGIN_URL = BASE_URL + "auth/login"
SIGNUP_URL = BASE_URL + "auth/signup"
UPLOAD_URL= BASE_URL + "documents/upload"
DOCUMENTS_URL = BASE_URL + "documents"

CREDENTIALS = {
    "email": "hoang@gmail.com",
    "password": "123abc456"
}

def run_rate_limit_test():
    session = requests.Session()
    print("1. Login")
    try:
        login_res = session.post(LOGIN_URL, json=CREDENTIALS)
        if login_res.status_code != 200:
            print(f"Login failed. HTTP Status Code = {login_res.status_code}")
            return
        
        token_data = login_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            print("Failed to retrieve access token from login response.")
            return

        session.headers.update({"Authorization": f"Bearer {access_token}"})
    except Exception as e:
        print(f"Error during login: {e}")
        return

    print("Test rate_limit for request")
    for i in range(1, 12):
        try:
            res = session.get(DOCUMENTS_URL)
            print(f"Request{i}: HTTP Status Code = {res.status_code}")
            if(res.status_code == 429):
                print("Rate limit exceeded")
        except Exception as e:
            print(f"Error at request {i}: {e}")

if __name__ == "__main__":
    run_rate_limit_test()



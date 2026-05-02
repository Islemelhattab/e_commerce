import requests

API_URL = "http://127.0.0.1:8000/api"

def test_login_and_cart():
    print("Logging in...")
    resp = requests.post(f"{API_URL}/auth/login/", json={
        "email": "admin@ecommerce.local",
        "password": "admin123"
    })
    
    if resp.status_code != 200:
        print("Login failed!", resp.status_code, resp.text)
        return
        
    print("Login success!", resp.json())
    access_token = resp.json()['access']
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    print("Fetching cart...")
    resp = requests.get(f"{API_URL}/cart/", headers=headers)
    print("Cart GET status:", resp.status_code)
    print("Cart GET body:", resp.text)
    
if __name__ == "__main__":
    test_login_and_cart()

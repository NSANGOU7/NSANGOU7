"""Backend API tests for AutoParts E-Commerce - new features."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://auto-parts-shop-72.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "billionsmahmoud@gmail.com"
ADMIN_PASSWORD = "admin123"


# ========== Fixtures ==========
@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} - {r.text}"
    return s


@pytest.fixture(scope="session")
def customer_session():
    s = requests.Session()
    email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "Passw0rd!", "name": "TEST User"}, timeout=15)
    assert r.status_code == 200, f"Register failed: {r.status_code} - {r.text}"
    s._email = email
    return s


@pytest.fixture(scope="session")
def seeded_product_id():
    r = requests.get(f"{API}/products?limit=50", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["products"], "No products seeded"
    in_stock = [p for p in data["products"] if p.get("stock", 0) >= 5]
    assert in_stock, "No product with stock >= 5"
    return in_stock[0]["id"]


# ========== Health ==========
def test_root():
    # /api root may not be exposed through ingress; health via /api/products
    r = requests.get(f"{API}/products?limit=1", timeout=15)
    assert r.status_code == 200


def test_products_listing():
    r = requests.get(f"{API}/products", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "products" in d and "total" in d
    assert d["total"] >= 1


# ========== Chat ==========
class TestChat:
    def test_start_chat(self):
        r = requests.post(f"{API}/chat/start", json={"name": "TEST Jean", "email": "TEST_jean@test.com"}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and d["customer_name"] == "TEST Jean"
        assert d["status"] == "active"
        assert isinstance(d["messages"], list)
        TestChat.chat_id = d["id"]

    def test_get_chat(self):
        assert hasattr(TestChat, "chat_id")
        r = requests.get(f"{API}/chat/{TestChat.chat_id}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == TestChat.chat_id

    def test_send_customer_message(self):
        r = requests.post(
            f"{API}/chat/{TestChat.chat_id}/message",
            json={"content": "Bonjour, j'ai besoin d'aide", "sender": "customer", "sender_name": "TEST Jean"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Verify persisted
        r2 = requests.get(f"{API}/chat/{TestChat.chat_id}", timeout=15)
        msgs = r2.json()["messages"]
        assert len(msgs) >= 1
        assert msgs[-1]["content"] == "Bonjour, j'ai besoin d'aide"
        assert msgs[-1]["sender"] == "customer"

    def test_get_chat_not_found(self):
        r = requests.get(f"{API}/chat/nonexistent-id", timeout=15)
        assert r.status_code == 404

    def test_admin_list_chats_requires_auth(self):
        r = requests.get(f"{API}/admin/chats", timeout=15)
        assert r.status_code == 401

    def test_admin_list_chats_forbidden_for_customer(self, customer_session):
        r = customer_session.get(f"{API}/admin/chats", timeout=15)
        assert r.status_code == 403

    def test_admin_list_chats_success(self, admin_session):
        r = admin_session.get(f"{API}/admin/chats", timeout=15)
        assert r.status_code == 200, r.text
        chats = r.json()
        assert isinstance(chats, list)
        assert any(c["id"] == TestChat.chat_id for c in chats)

    def test_admin_reply_in_chat(self, admin_session):
        r = admin_session.post(
            f"{API}/chat/{TestChat.chat_id}/message",
            json={"content": "Bonjour, comment puis-je aider?", "sender": "admin", "sender_name": "Admin"},
            timeout=15,
        )
        assert r.status_code == 200


# ========== Tracking & Pickup discount ==========
class TestOrderTracking:
    def test_create_pickup_order_applies_discount(self, customer_session, seeded_product_id):
        # Add to cart
        r = customer_session.post(f"{API}/cart/add", json={"product_id": seeded_product_id, "quantity": 1}, timeout=15)
        assert r.status_code == 200, r.text
        r = customer_session.get(f"{API}/cart", timeout=15)
        cart_total = r.json()["total"]

        order_payload = {
            "shipping_address": {
                "street": "1 Rue Test",
                "city": "Paris",
                "postal_code": "75000",
                "country": "France",
                "phone": "0600000000",
            },
            "payment_method": "stripe",
            "shipping_method": "pickup",
            "save_card": False,
        }
        r = customer_session.post(f"{API}/orders", json=order_payload, timeout=15)
        assert r.status_code == 200, r.text
        order = r.json()
        TestOrderTracking.pickup_order = order
        expected_discount = round(cart_total * 0.15, 2)
        assert abs(order["discount"] - expected_discount) < 0.5, f"Got discount {order['discount']}, expected ~{expected_discount}"
        expected_total = round(cart_total - expected_discount, 2)
        assert abs(order["total"] - expected_total) < 0.5
        assert order["shipping_cost"] == 0
        assert "tracking_number" in order and order["tracking_number"].startswith("AUTO-")
        assert order["status"] == "pending_payment"

    def test_tracking_public_endpoint(self):
        assert hasattr(TestOrderTracking, "pickup_order")
        tn = TestOrderTracking.pickup_order["tracking_number"]
        r = requests.get(f"{API}/tracking/{tn}", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["tracking_number"] == tn
        assert "user_id" not in d  # security - no user id leaked
        assert "user_email" not in d
        assert d["shipping_method"] == "pickup"
        assert d["status"] == "pending_payment"
        assert isinstance(d["items"], list) and len(d["items"]) >= 1

    def test_tracking_not_found(self):
        r = requests.get(f"{API}/tracking/AUTO-NOPE-XXXX", timeout=15)
        assert r.status_code == 404

    def test_create_delivery_order_no_discount(self, customer_session, seeded_product_id):
        # Add a cheap product (under 99€) to check shipping cost
        r = requests.get(f"{API}/products?limit=20", timeout=15)
        products = r.json()["products"]
        cheap = next((p for p in products if p["price"] < 99 and p["stock"] > 0), None)
        if not cheap:
            pytest.skip("No cheap product available")
        customer_session.post(f"{API}/cart/add", json={"product_id": cheap["id"], "quantity": 1}, timeout=15)
        order_payload = {
            "shipping_address": {
                "street": "2 Rue Test",
                "city": "Lyon",
                "postal_code": "69000",
                "country": "France",
            },
            "payment_method": "bank_transfer",
            "shipping_method": "delivery",
            "save_card": False,
        }
        r = customer_session.post(f"{API}/orders", json=order_payload, timeout=15)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["discount"] == 0
        assert order["shipping_method"] == "delivery"
        # shipping_cost applied since total < 99 originally; cheap < 99
        assert order["shipping_cost"] == 9.90

    def test_admin_update_order_status(self, admin_session):
        assert hasattr(TestOrderTracking, "pickup_order")
        oid = TestOrderTracking.pickup_order["id"]
        new_tn = "AUTO-UPDATED-0001"
        r = admin_session.put(
            f"{API}/orders/{oid}/status",
            json={"status": "shipped", "tracking_number": new_tn},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Verify via tracking endpoint with new tracking
        r2 = requests.get(f"{API}/tracking/{new_tn}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["status"] == "shipped"


# ========== Admin products CRUD ==========
class TestAdminProducts:
    def test_create_update_delete(self, admin_session):
        payload = {
            "title": "TEST Product",
            "description": "TEST desc",
            "oem_reference": "TEST-REF-001",
            "compatible_brands": ["BMW"],
            "compatible_models": ["M3"],
            "compatible_years": [2020],
            "category": "engine",
            "condition": "new",
            "price": 99.99,
            "stock": 10,
            "images": [],
        }
        r = admin_session.post(f"{API}/products", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        prod = r.json()
        pid = prod["id"]
        assert prod["title"] == "TEST Product"

        # GET verify
        r = requests.get(f"{API}/products/{pid}", timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST Product"

        # Update
        r = admin_session.put(f"{API}/products/{pid}", json={"price": 120.0, "stock": 5}, timeout=15)
        assert r.status_code == 200

        r = requests.get(f"{API}/products/{pid}", timeout=15)
        assert r.json()["price"] == 120.0

        # Delete
        r = admin_session.delete(f"{API}/products/{pid}", timeout=15)
        assert r.status_code == 200

        r = requests.get(f"{API}/products/{pid}", timeout=15)
        assert r.status_code == 404

    def test_create_product_requires_admin(self, customer_session):
        r = customer_session.post(f"{API}/products", json={
            "title": "x", "description": "x", "category": "engine", "condition": "new",
            "price": 1, "stock": 1,
        }, timeout=15)
        assert r.status_code == 403



# ========== NEW ADMIN EMAIL MIGRATION ==========
class TestAdminMigration:
    def test_old_admin_removed(self):
        """Old admin@autoparts.com should be deleted at startup."""
        r = requests.post(f"{API}/auth/login",
                          json={"email": "admin@autoparts.com", "password": "admin123"}, timeout=15)
        assert r.status_code == 401, f"Old admin still exists! status={r.status_code}"

    def test_new_admin_login(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("user", {}).get("role") == "admin" or data.get("role") == "admin" \
            or "token" in data or "access_token" in data


# ========== FILE UPLOAD ==========
class TestFileUpload:
    def test_upload_requires_admin(self, customer_session):
        files = {"file": ("test.png", b"fake-img-data", "image/png")}
        r = customer_session.post(f"{API}/upload/image", files=files, timeout=20)
        assert r.status_code == 403

    def test_upload_unauthenticated(self):
        files = {"file": ("test.png", b"fake-img-data", "image/png")}
        r = requests.post(f"{API}/upload/image", files=files, timeout=20)
        assert r.status_code == 401

    def test_upload_rejects_non_image(self, admin_session):
        files = {"file": ("test.txt", b"hello world", "text/plain")}
        r = admin_session.post(f"{API}/upload/image", files=files, timeout=20)
        assert r.status_code == 400

    def test_upload_image_and_serve(self, admin_session):
        # 1x1 PNG bytes
        png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
            b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4"
            b"\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
            b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"file": ("test_upload.png", png, "image/png")}
        r = admin_session.post(f"{API}/upload/image", files=files, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "id" in data
        assert "/api/files/" in data["url"]
        TestFileUpload.file_id = data["id"]
        TestFileUpload.file_url = data["url"]

        # Fetch the file via public URL
        r2 = requests.get(data["url"], timeout=20)
        assert r2.status_code == 200, f"GET file failed: {r2.status_code}"
        assert r2.headers.get("content-type", "").startswith("image/")
        assert len(r2.content) > 0

    def test_get_file_not_found(self):
        r = requests.get(f"{API}/files/nonexistent-id-xyz", timeout=15)
        assert r.status_code == 404


# ========== PAYPAL ORDER ==========
class TestPayPalOrder:
    def test_order_with_paypal_returns_url(self, customer_session, seeded_product_id):
        # Add to cart
        customer_session.post(f"{API}/cart/add",
                              json={"product_id": seeded_product_id, "quantity": 1}, timeout=15)
        order_payload = {
            "shipping_address": {
                "street": "5 Rue PayPal",
                "city": "Paris",
                "postal_code": "75000",
                "country": "France",
                "phone": "0600000000",
            },
            "payment_method": "paypal",
            "shipping_method": "delivery",
            "save_card": False,
        }
        r = customer_session.post(f"{API}/orders", json=order_payload, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()
        assert "paypal_url" in order, f"paypal_url missing in response: {order}"
        assert "paypal.me/billions44/" in order["paypal_url"]
        # Format: https://www.paypal.me/billions44/AMOUNTEUR
        assert order["paypal_url"].endswith("EUR")
        # Verify amount matches order total
        amount_str = order["paypal_url"].split("/")[-1].replace("EUR", "")
        assert abs(float(amount_str) - order["total"]) < 0.01


# ========== ADMIN AUCTIONS MANAGEMENT ==========
class TestAdminAuctions:
    def test_list_auctions_requires_auth(self):
        r = requests.get(f"{API}/admin/auctions", timeout=15)
        assert r.status_code == 401

    def test_list_auctions_forbidden_for_customer(self, customer_session):
        r = customer_session.get(f"{API}/admin/auctions", timeout=15)
        assert r.status_code == 403

    def test_admin_list_auctions(self, admin_session):
        r = admin_session.get(f"{API}/admin/auctions", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)

    def test_create_close_delete_auction_flow(self, admin_session):
        # Create a TEST product first
        prod_payload = {
            "title": "TEST Auction Product",
            "description": "TEST",
            "category": "engine",
            "condition": "new",
            "price": 100.0,
            "stock": 1,
            "images": [],
        }
        r = admin_session.post(f"{API}/products", json=prod_payload, timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]

        # Create auction
        from datetime import datetime, timezone, timedelta
        auction_payload = {
            "product_id": pid,
            "starting_price": 50.0,
            "end_time": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        }
        r = admin_session.post(f"{API}/auctions", json=auction_payload, timeout=15)
        assert r.status_code == 200, r.text
        auction = r.json()
        aid = auction["id"]

        # List should contain it
        r = admin_session.get(f"{API}/admin/auctions", timeout=15)
        assert r.status_code == 200
        assert any(a["id"] == aid for a in r.json())

        # Close
        r = admin_session.post(f"{API}/admin/auctions/{aid}/close", timeout=15)
        assert r.status_code == 200, r.text

        # Delete
        r = admin_session.delete(f"{API}/admin/auctions/{aid}", timeout=15)
        assert r.status_code == 200, r.text

        # Cleanup product
        admin_session.delete(f"{API}/products/{pid}", timeout=15)

    def test_close_nonexistent_auction(self, admin_session):
        r = admin_session.post(f"{API}/admin/auctions/nonexistent-id/close", timeout=15)
        assert r.status_code == 404

    def test_delete_nonexistent_auction(self, admin_session):
        r = admin_session.delete(f"{API}/admin/auctions/nonexistent-id", timeout=15)
        assert r.status_code == 404

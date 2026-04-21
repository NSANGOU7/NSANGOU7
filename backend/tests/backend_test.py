"""Backend API tests for AutoParts E-Commerce - new features."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://auto-parts-shop-72.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@autoparts.com"
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
    r = requests.get(f"{API}/products?limit=1", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["products"], "No products seeded"
    return data["products"][0]["id"]


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

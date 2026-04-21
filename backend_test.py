#!/usr/bin/env python3
"""
AutoParts E-Commerce Backend API Testing Suite
Tests all major API endpoints for functionality and integration
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class AutoPartsAPITester:
    def __init__(self, base_url: str = "https://auto-parts-shop-72.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_product_id = None
        self.test_auction_id = None
        self.test_order_id = None
        
        # Test counters
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        print(f"🚀 Starting AutoParts API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            self.failed_tests.append({"name": name, "details": details})
            print(f"❌ {name}")
            if details:
                print(f"   {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, use_auth: bool = False) -> tuple[bool, Dict]:
        """Make HTTP request and validate response"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test basic API health"""
        success, data = self.make_request('GET', '/')
        self.log_test("API Health Check", success, 
                     f"Response: {data.get('message', 'No message')}" if success else f"Error: {data}")

    def test_admin_login(self):
        """Test admin authentication"""
        login_data = {
            "email": "admin@autoparts.com",
            "password": "admin123"
        }
        
        success, data = self.make_request('POST', '/auth/login', login_data)
        
        if success and 'id' in data:
            # Extract token from cookies if available
            self.admin_token = None  # Will use cookies for auth
            self.log_test("Admin Login", True, f"Admin ID: {data['id']}")
            return True
        else:
            self.log_test("Admin Login", False, f"Error: {data}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "email": f"testuser{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, data = self.make_request('POST', '/auth/register', user_data, 200)
        
        if success and 'id' in data:
            self.test_user_id = data['id']
            self.log_test("User Registration", True, f"User ID: {data['id']}")
            return True
        else:
            self.log_test("User Registration", False, f"Error: {data}")
            return False

    def test_categories_endpoint(self):
        """Test categories API"""
        success, data = self.make_request('GET', '/categories')
        
        if success and isinstance(data, list) and len(data) > 0:
            categories = [cat.get('name', 'Unknown') for cat in data[:3]]
            self.log_test("Categories API", True, f"Found {len(data)} categories: {', '.join(categories)}")
            return True
        else:
            self.log_test("Categories API", False, f"Error: {data}")
            return False

    def test_products_endpoint(self):
        """Test products listing"""
        success, data = self.make_request('GET', '/products')
        
        if success and 'products' in data and 'total' in data:
            products_count = len(data['products'])
            total_count = data['total']
            self.log_test("Products Listing", True, 
                         f"Found {products_count} products (Total: {total_count})")
            
            # Store first product ID for later tests
            if data['products']:
                self.test_product_id = data['products'][0]['id']
            return True
        else:
            self.log_test("Products Listing", False, f"Error: {data}")
            return False

    def test_featured_products(self):
        """Test featured products endpoint"""
        success, data = self.make_request('GET', '/products/featured')
        
        if success and isinstance(data, list):
            featured_count = len(data)
            self.log_test("Featured Products", True, f"Found {featured_count} featured products")
            return True
        else:
            self.log_test("Featured Products", False, f"Error: {data}")
            return False

    def test_new_arrivals(self):
        """Test new arrivals endpoint"""
        success, data = self.make_request('GET', '/products/new-arrivals')
        
        if success and isinstance(data, list):
            arrivals_count = len(data)
            self.log_test("New Arrivals", True, f"Found {arrivals_count} new arrivals")
            return True
        else:
            self.log_test("New Arrivals", False, f"Error: {data}")
            return False

    def test_product_detail(self):
        """Test individual product detail"""
        if not self.test_product_id:
            self.log_test("Product Detail", False, "No product ID available")
            return False
            
        success, data = self.make_request('GET', f'/products/{self.test_product_id}')
        
        if success and 'id' in data and 'title' in data:
            self.log_test("Product Detail", True, f"Product: {data['title'][:50]}...")
            return True
        else:
            self.log_test("Product Detail", False, f"Error: {data}")
            return False

    def test_auctions_endpoint(self):
        """Test auctions listing"""
        success, data = self.make_request('GET', '/auctions')
        
        if success and isinstance(data, list):
            auctions_count = len(data)
            self.log_test("Auctions Listing", True, f"Found {auctions_count} active auctions")
            
            # Store first auction ID for later tests
            if data:
                self.test_auction_id = data[0]['id']
            return True
        else:
            self.log_test("Auctions Listing", False, f"Error: {data}")
            return False

    def test_auction_detail(self):
        """Test individual auction detail"""
        if not self.test_auction_id:
            self.log_test("Auction Detail", False, "No auction ID available")
            return False
            
        success, data = self.make_request('GET', f'/auctions/{self.test_auction_id}')
        
        if success and 'id' in data and 'current_price' in data:
            self.log_test("Auction Detail", True, 
                         f"Auction price: €{data['current_price']}")
            return True
        else:
            self.log_test("Auction Detail", False, f"Error: {data}")
            return False

    def test_cart_operations(self):
        """Test cart functionality (requires auth)"""
        if not self.test_product_id:
            self.log_test("Cart Operations", False, "No product ID available")
            return False

        # Test get empty cart
        success, data = self.make_request('GET', '/cart', use_auth=True)
        if success:
            self.log_test("Get Cart", True, f"Cart items: {len(data.get('items', []))}")
        else:
            self.log_test("Get Cart", False, f"Error: {data}")
            return False

        # Test add to cart
        cart_data = {"product_id": self.test_product_id, "quantity": 1}
        success, data = self.make_request('POST', '/cart/add', cart_data, use_auth=True)
        if success:
            self.log_test("Add to Cart", True, "Product added successfully")
        else:
            self.log_test("Add to Cart", False, f"Error: {data}")
            return False

        return True

    def test_orders_endpoint(self):
        """Test orders listing"""
        success, data = self.make_request('GET', '/orders', use_auth=True)
        
        if success and isinstance(data, list):
            orders_count = len(data)
            self.log_test("Orders Listing", True, f"Found {orders_count} orders")
            return True
        else:
            self.log_test("Orders Listing", False, f"Error: {data}")
            return False

    def test_wishlist_operations(self):
        """Test wishlist functionality"""
        if not self.test_product_id:
            self.log_test("Wishlist Operations", False, "No product ID available")
            return False

        # Test get wishlist
        success, data = self.make_request('GET', '/wishlist', use_auth=True)
        if success:
            self.log_test("Get Wishlist", True, f"Wishlist items: {len(data)}")
        else:
            self.log_test("Get Wishlist", False, f"Error: {data}")
            return False

        # Test add to wishlist
        success, data = self.make_request('POST', f'/wishlist/{self.test_product_id}', 
                                        use_auth=True, expected_status=200)
        if success:
            self.log_test("Add to Wishlist", True, "Product added to wishlist")
        else:
            self.log_test("Add to Wishlist", False, f"Error: {data}")

        return True

    def test_admin_stats(self):
        """Test admin dashboard stats"""
        success, data = self.make_request('GET', '/admin/stats', use_auth=True)
        
        if success and 'revenue' in data and 'orders' in data:
            revenue = data['revenue']
            total_orders = data['orders']['total']
            self.log_test("Admin Stats", True, 
                         f"Revenue: €{revenue}, Orders: {total_orders}")
            return True
        else:
            self.log_test("Admin Stats", False, f"Error: {data}")
            return False

    def test_search_functionality(self):
        """Test product search"""
        search_params = "?search=brake&category=brakes&condition=new"
        success, data = self.make_request('GET', f'/products{search_params}')
        
        if success and 'products' in data:
            results_count = len(data['products'])
            self.log_test("Product Search", True, f"Search returned {results_count} results")
            return True
        else:
            self.log_test("Product Search", False, f"Error: {data}")
            return False

    def test_password_reset_flow(self):
        """Test password reset functionality"""
        reset_data = {"email": "admin@autoparts.com"}
        success, data = self.make_request('POST', '/auth/forgot-password', reset_data)
        
        if success and 'message' in data:
            self.log_test("Password Reset Request", True, "Reset email sent")
            return True
        else:
            self.log_test("Password Reset Request", False, f"Error: {data}")
            return False

    def run_all_tests(self):
        """Execute all test suites"""
        print("🧪 Running Backend API Tests...\n")
        
        # Basic API tests
        self.test_health_check()
        
        # Authentication tests
        admin_login_success = self.test_admin_login()
        self.test_user_registration()
        self.test_password_reset_flow()
        
        # Product & Category tests
        self.test_categories_endpoint()
        self.test_products_endpoint()
        self.test_featured_products()
        self.test_new_arrivals()
        self.test_product_detail()
        self.test_search_functionality()
        
        # Auction tests
        self.test_auctions_endpoint()
        self.test_auction_detail()
        
        # User functionality tests (require auth)
        if admin_login_success:
            self.test_cart_operations()
            self.test_orders_endpoint()
            self.test_wishlist_operations()
            self.test_admin_stats()
        
        # Print final results
        self.print_summary()
        
        return self.tests_passed == self.tests_run

    def print_summary(self):
        """Print test execution summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n🚨 FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   • {test['name']}: {test['details']}")
        
        print("\n🎯 KEY ENDPOINTS TESTED:")
        endpoints = [
            "/api/auth/login", "/api/auth/register", "/api/products", 
            "/api/categories", "/api/auctions", "/api/cart", "/api/orders"
        ]
        for endpoint in endpoints:
            print(f"   • {endpoint}")

def main():
    """Main test execution"""
    tester = AutoPartsAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
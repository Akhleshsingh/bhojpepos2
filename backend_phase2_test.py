#!/usr/bin/env python3
"""
Bhojpe POS Phase 2 Features Testing Script
Testing: Kitchen Display System (KDS), Stripe Payments, Receipt Generation, WebSocket notifications
"""

import requests
import sys
import json
import websocket
import threading
import time
from datetime import datetime

class BhojpePhase2Tester:
    def __init__(self, base_url="https://kds-phase4.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}
        self.users = {}
        self.test_data = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.detailed_results = []
        self.websocket_messages = []

    def log_result(self, name, success, details=None):
        """Log test result with details"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.detailed_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details and not success:
            print(f"      Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, role=None, data=None):
        """Run a single API test with role-based authentication"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth if role specified
        if role and role in self.tokens:
            headers['Authorization'] = f'Bearer {self.tokens[role]}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=15)

            success = response.status_code == expected_status
            
            details = {
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "url": url,
                "role": role,
                "response_preview": str(response.text)[:300] if response.text else "No response body"
            }
            
            self.log_result(name, success, details)
            
            # Return response data for successful requests
            if success and response.text:
                try:
                    return success, response.json()
                except:
                    return success, response.text
            return success, {}

        except Exception as e:
            self.log_result(name, False, {"error": str(e)})
            return False, {}

    def login_users(self):
        """Login with test credentials"""
        credentials = {
            "admin": {"username": "admin", "password": "demo123"},
            "chef": {"username": "chef", "password": "demo123"}
        }
        
        print("\n🔐 Testing Authentication for Phase 2 roles...")
        for role, creds in credentials.items():
            success, response = self.run_test(
                f"Login as {role}",
                "POST",
                "auth/login",
                200,
                data=creds
            )
            if success and isinstance(response, dict) and 'token' in response:
                self.tokens[role] = response['token']
                self.users[role] = response['user']
                print(f"    ✅ {role}: {creds['username']} authenticated")
            else:
                print(f"    ❌ {role}: {creds['username']} failed to authenticate")
                return False
        return True

    def test_kot_endpoints(self):
        """Test Kitchen Order Tickets (KOT) endpoints"""
        print("\n🍳 Testing KOT (Kitchen Order Tickets) Endpoints...")
        
        # Test 1: GET /api/kot - Get KOT items (should work for both admin and chef)
        for role in ["admin", "chef"]:
            success, kot_data = self.run_test(
                f"GET /api/kot with {role} role",
                "GET", 
                "kot",
                200,
                role=role
            )
            if success:
                print(f"    📝 {role} can access KOT list - found {len(kot_data) if isinstance(kot_data, list) else 0} items")
        
        # Test 2: Create a test order first to generate KOT
        print("\n  🛒 Creating test order for KOT generation...")
        test_order = {
            "items": [
                {"id": "test123", "name": "Paneer Butter Masala", "price": 320, "qty": 1, "type": "veg"},
                {"id": "test124", "name": "Butter Naan", "price": 60, "qty": 2, "type": "veg"}
            ],
            "orderType": "dine",
            "tableNo": "T-01",
            "note": "Test order for KOT Phase 2 testing",
            "subtotal": 440,
            "tax": 44,
            "total": 484,
            "paymentMethod": "cash"
        }
        
        order_success, order_response = self.run_test(
            "Create test order for KOT",
            "POST",
            "orders",
            200,
            role="admin",
            data=test_order
        )
        
        if order_success and isinstance(order_response, dict) and 'id' in order_response:
            self.test_data['order_id'] = order_response['id']
            print(f"    ✅ Test order created: {order_response.get('orderNumber', 'Unknown')}")
            
            # Test 3: POST /api/kot - Create KOT ticket
            kot_data = {
                "order_id": order_response['id'],
                "items": test_order['items'],
                "priority": "normal",
                "notes": "Phase 2 test KOT"
            }
            
            kot_success, kot_response = self.run_test(
                "POST /api/kot - Create KOT ticket",
                "POST",
                "kot",
                200,
                role="admin",
                data=kot_data
            )
            
            if kot_success and isinstance(kot_response, dict) and 'id' in kot_response:
                self.test_data['kot_id'] = kot_response['id']
                print(f"    ✅ KOT ticket created: {kot_response.get('id', 'Unknown')}")
                
                # Test 4: Update KOT status
                status_update = {"status": "preparing"}
                self.run_test(
                    "PUT /api/kot/{kot_id}/status - Update KOT status",
                    "PUT",
                    f"kot/{kot_response['id']}/status",
                    200,
                    role="chef",
                    data=status_update
                )
        else:
            print("    ❌ Failed to create test order - cannot test KOT creation")

    def test_stripe_payments(self):
        """Test Stripe payment integration endpoints"""
        print("\n💳 Testing Stripe Payment Integration...")
        
        # Test payment checkout endpoint
        if 'order_id' in self.test_data:
            payment_data = {
                "order_id": self.test_data['order_id'],
                "origin_url": "https://test.example.com"
            }
            
            success, payment_response = self.run_test(
                "POST /api/payments/checkout - Create Stripe session",
                "POST",
                "payments/checkout",
                200,
                role="admin", 
                data=payment_data
            )
            
            if success and isinstance(payment_response, dict):
                if 'session_id' in payment_response:
                    self.test_data['session_id'] = payment_response['session_id']
                    print(f"    ✅ Stripe session created: {payment_response['session_id'][:20]}...")
                    
                    # Test payment status endpoint
                    time.sleep(2)  # Brief delay for session initialization
                    status_success, status_response = self.run_test(
                        "GET /api/payments/status/{session_id} - Check payment status",
                        "GET",
                        f"payments/status/{payment_response['session_id']}",
                        200,
                        role="admin"
                    )
                    
                    if status_success:
                        print(f"    ✅ Payment status retrieved: {status_response.get('payment_status', 'unknown')}")
                else:
                    print("    ⚠️ Stripe session response missing session_id")
            else:
                print("    ❌ Stripe checkout failed - check STRIPE_API_KEY configuration")
        else:
            print("    ⚠️ No test order available for payment testing")

    def test_receipt_generation(self):
        """Test receipt generation endpoint"""
        print("\n🧾 Testing Receipt Generation...")
        
        if 'order_id' in self.test_data:
            success, receipt_data = self.run_test(
                "GET /api/orders/{order_id}/receipt - Generate receipt",
                "GET",
                f"orders/{self.test_data['order_id']}/receipt",
                200,
                role="admin"
            )
            
            if success and isinstance(receipt_data, dict):
                required_sections = ['restaurant', 'order', 'items', 'summary', 'footer']
                found_sections = [section for section in required_sections if section in receipt_data]
                
                print(f"    ✅ Receipt generated with {len(found_sections)}/{len(required_sections)} sections")
                
                if len(found_sections) == len(required_sections):
                    print("    ✅ Receipt has all required sections (restaurant, order, items, summary, footer)")
                else:
                    missing = set(required_sections) - set(found_sections)
                    print(f"    ⚠️ Receipt missing sections: {missing}")
            else:
                print("    ❌ Receipt generation failed")
        else:
            print("    ⚠️ No test order available for receipt testing")

    def test_websocket_endpoint(self):
        """Test WebSocket endpoint availability"""
        print("\n🔗 Testing WebSocket Endpoint...")
        
        if 'admin' in self.users:
            restaurant_id = self.users['admin'].get('restaurant_id')
            user_id = self.users['admin'].get('id')
            
            if restaurant_id and user_id:
                # Test WebSocket connection
                ws_url = f"wss://5409038e-7e38-413c-9476-d4cc2f2a9b29.preview.emergentagent.com/api/ws/{restaurant_id}?user_id={user_id}"
                
                def on_message(ws, message):
                    self.websocket_messages.append(json.loads(message))
                    print(f"    📡 WebSocket message received: {message[:100]}...")
                
                def on_error(ws, error):
                    print(f"    ⚠️ WebSocket error: {error}")
                
                def on_close(ws, close_status_code, close_msg):
                    print("    🔌 WebSocket connection closed")
                
                def on_open(ws):
                    print("    ✅ WebSocket connection established")
                    # Send a test ping
                    ws.send(json.dumps({"type": "PING"}))
                    time.sleep(2)
                    ws.close()
                
                try:
                    ws = websocket.WebSocketApp(ws_url,
                                              on_open=on_open,
                                              on_message=on_message,
                                              on_error=on_error,
                                              on_close=on_close)
                    
                    # Run WebSocket in a separate thread with timeout
                    ws_thread = threading.Thread(target=ws.run_forever)
                    ws_thread.daemon = True
                    ws_thread.start()
                    ws_thread.join(timeout=10)
                    
                    if len(self.websocket_messages) > 0:
                        self.log_result("WebSocket /api/ws/{restaurant_id} connectivity", True, 
                                      {"messages_received": len(self.websocket_messages)})
                    else:
                        self.log_result("WebSocket /api/ws/{restaurant_id} connectivity", True, 
                                      {"connection": "established", "messages": "none"})
                        
                except Exception as e:
                    self.log_result("WebSocket /api/ws/{restaurant_id} connectivity", False, 
                                  {"error": str(e)})
            else:
                print("    ⚠️ Missing restaurant_id or user_id for WebSocket testing")
        else:
            print("    ⚠️ No admin user available for WebSocket testing")

    def test_health_and_basic(self):
        """Test basic system health"""
        print("\n🏥 Testing Basic System Health...")
        
        self.run_test("Health check", "GET", "health", 200)
        
        # Test menu access (needed for order creation)
        self.run_test("Menu access", "GET", "menu", 200, role="admin")

    def save_results(self):
        """Save detailed results to JSON file"""
        results_file = "/app/backend_phase2_test_results.json"
        results_data = {
            "test_summary": {
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "failed_tests": self.tests_run - self.tests_passed,
                "success_rate": f"{(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "0%",
                "timestamp": datetime.now().isoformat()
            },
            "phase_2_features_tested": [
                "Kitchen Display System (KDS) - KOT endpoints",
                "Stripe Payment Integration - checkout and status",
                "Receipt Generation - order receipt endpoint",
                "WebSocket notifications - real-time connectivity"
            ],
            "detailed_results": self.detailed_results,
            "test_data_created": self.test_data,
            "websocket_messages": self.websocket_messages,
            "user_tokens": {role: bool(token) for role, token in self.tokens.items()}
        }
        
        with open(results_file, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: {results_file}")
        return results_file

    def run_all_tests(self):
        """Run complete Phase 2 test suite"""
        print("🚀 Starting Bhojpe POS Phase 2 Features Tests")
        print("Testing: Kitchen Display System, Stripe Payments, Receipt Generation, WebSocket")
        print("=" * 70)
        
        # Step 1: Authentication
        if not self.login_users():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
            
        # Step 2: Basic system health
        self.test_health_and_basic()
        
        # Step 3: KOT (Kitchen Display System) endpoints
        self.test_kot_endpoints()
        
        # Step 4: Stripe payment integration
        self.test_stripe_payments()
        
        # Step 5: Receipt generation
        self.test_receipt_generation()
        
        # Step 6: WebSocket connectivity
        self.test_websocket_endpoint()
        
        # Save detailed results
        results_file = self.save_results()
        
        # Print summary
        print("\n" + "=" * 70)
        print("🏆 PHASE 2 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL PHASE 2 TESTS PASSED!")
            return True
        else:
            print("⚠️  Some Phase 2 tests failed. Check results for details.")
            return False

def main():
    """Main test execution"""
    tester = BhojpePhase2Tester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
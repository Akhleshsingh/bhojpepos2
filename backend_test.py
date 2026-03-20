#!/usr/bin/env python3
"""
Bhojpe POS RBAC Permission Testing Script
Re-testing after permission fix for dotted permissions
"""

import requests
import sys
import json
from datetime import datetime

class BhojpePOSRBACTester:
    def __init__(self, base_url="https://kds-phase4.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}
        self.users = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.detailed_results = []

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
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            details = {
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "url": url,
                "role": role,
                "response_preview": str(response.text)[:200] if response.text else "No response body"
            }
            
            self.log_result(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_result(name, False, {"error": str(e)})
            return False, {}

    def login_all_roles(self):
        """Login with all test credentials"""
        credentials = {
            "admin": {"username": "admin", "password": "demo123"},
            "waiter": {"username": "waiter", "password": "demo123"},
            "chef": {"username": "chef", "password": "demo123"},
            "cashier": {"username": "cashier", "password": "demo123"}
        }
        
        print("\n🔐 Testing Authentication for all roles...")
        for role, creds in credentials.items():
            success, response = self.run_test(
                f"Login as {role}",
                "POST",
                "auth/login",
                200,
                data=creds
            )
            if success and 'token' in response:
                self.tokens[role] = response['token']
                self.users[role] = response['user']
                print(f"    ✅ {role}: {creds['username']} authenticated")
            else:
                print(f"    ❌ {role}: {creds['username']} failed to authenticate")
                return False
        return True

    def test_rbac_permissions(self):
        """Test specific RBAC permission scenarios that were previously failing"""
        print("\n🔒 Testing RBAC Permission Fixes...")
        
        # Test 1: Waiter should access orders endpoint (orders.view, orders.create)
        self.run_test(
            "Waiter access to orders (should pass - orders.view permission)",
            "GET", 
            "orders",
            200,
            role="waiter"
        )
        
        # Test 2: Chef should access orders endpoint (orders.view)
        self.run_test(
            "Chef access to orders (should pass - orders.view permission)",
            "GET",
            "orders", 
            200,
            role="chef"
        )
        
        # Test 3: Cashier should access customers endpoint (customers.view)
        self.run_test(
            "Cashier access to customers (should pass - customers.view permission)",
            "GET",
            "customers",
            200,
            role="cashier"
        )
        
        # Test 4: Waiter should access reservations endpoint (reservations.view)
        self.run_test(
            "Waiter access to reservations (should pass - reservations.view permission)",
            "GET",
            "reservations",
            200,
            role="waiter"
        )
        
        # Test 5: Admin should have full access
        self.run_test(
            "Admin access to orders (should pass - full permissions)",
            "GET",
            "orders",
            200,
            role="admin"
        )
        
        self.run_test(
            "Admin access to customers (should pass - full permissions)",
            "GET",
            "customers", 
            200,
            role="admin"
        )
        
        self.run_test(
            "Admin access to reservations (should pass - full permissions)",
            "GET",
            "reservations",
            200,
            role="admin"
        )

    def test_permission_denials(self):
        """Test that permissions are properly denied where they should be"""
        print("\n🚫 Testing Permission Denials...")
        
        # Chef should NOT have access to customers (not in permissions)
        self.run_test(
            "Chef denied access to customers (should fail - no permission)",
            "GET",
            "customers",
            403,
            role="chef"
        )
        
        # Chef should NOT have access to staff management
        self.run_test(
            "Chef denied access to staff (should fail - no permission)", 
            "GET",
            "staff",
            403,
            role="chef"
        )
        
        # Waiter should NOT have access to staff management
        self.run_test(
            "Waiter denied access to staff (should fail - no permission)",
            "GET", 
            "staff",
            403,
            role="waiter"
        )

    def test_basic_endpoints(self):
        """Test basic system endpoints"""
        print("\n🏥 Testing Basic System Health...")
        
        self.run_test("Health check", "GET", "health", 200)
        
        # Test user profile endpoint for each role
        for role in ["admin", "waiter", "chef", "cashier"]:
            self.run_test(
                f"{role} user profile",
                "GET",
                "auth/me", 
                200,
                role=role
            )

    def test_menu_access(self):
        """Test menu access for different roles"""
        print("\n🍽️ Testing Menu Access...")
        
        # All roles should be able to access menu for POS
        for role in ["admin", "waiter", "chef", "cashier"]:
            self.run_test(
                f"{role} access to menu",
                "GET",
                "menu",
                200, 
                role=role
            )

    def create_order_test(self):
        """Test order creation with waiter role"""
        print("\n📝 Testing Order Creation...")
        
        # First get menu to create a valid order
        success, menu_response = self.run_test(
            "Get menu for order creation",
            "GET",
            "menu",
            200,
            role="waiter"
        )
        
        if success and menu_response:
            # Create a test order with menu items
            test_order = {
                "items": [
                    {"name": "Paneer Butter Masala", "price": 320, "quantity": 1},
                    {"name": "Butter Naan", "price": 60, "quantity": 2}
                ],
                "orderType": "dine",
                "tableNo": "T-01",
                "note": "Test order for RBAC testing",
                "subtotal": 440,
                "tax": 44,
                "total": 484,
                "paymentMethod": "cash"
            }
            
            self.run_test(
                "Waiter create order (should pass - orders.create permission)",
                "POST",
                "orders",
                200,
                role="waiter",
                data=test_order
            )

    def save_results(self):
        """Save detailed results to JSON file"""
        results_file = "/app/backend_rbac_test_results.json"
        results_data = {
            "test_summary": {
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "failed_tests": self.tests_run - self.tests_passed,
                "success_rate": f"{(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "0%",
                "timestamp": datetime.now().isoformat()
            },
            "detailed_results": self.detailed_results,
            "user_tokens": {role: bool(token) for role, token in self.tokens.items()},
            "focus_areas": [
                "RBAC dotted permissions (orders.view, customers.view, reservations.view)",
                "Role-based endpoint access",
                "Permission denial verification"
            ]
        }
        
        with open(results_file, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: {results_file}")
        return results_file

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Bhojpe POS RBAC Permission Tests")
        print("=" * 50)
        
        # Step 1: Authentication
        if not self.login_all_roles():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
            
        # Step 2: Basic system tests
        self.test_basic_endpoints()
        
        # Step 3: Core RBAC tests (the main focus)
        self.test_rbac_permissions()
        
        # Step 4: Permission denial tests
        self.test_permission_denials()
        
        # Step 5: Menu access tests
        self.test_menu_access()
        
        # Step 6: Order creation test
        self.create_order_test()
        
        # Save detailed results
        results_file = self.save_results()
        
        # Print summary
        print("\n" + "=" * 50)
        print("🏆 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! RBAC permissions are working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Check results for details.")
            return False

def main():
    """Main test execution"""
    tester = BhojpePOSRBACTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
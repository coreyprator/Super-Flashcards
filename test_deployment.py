"""
Deployment verification test suite.
Tests critical functionality after deployment to catch issues before users do.
"""
import requests
import time
import sys
from urllib.parse import urlparse, parse_qs

# Configuration
PRODUCTION_URL = "https://learn.rentyourcio.com"
STAGING_URL = "https://super-flashcards-57478301787.us-central1.run.app"

class DeploymentTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        # Add retry logic for transient failures
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        self.passed = 0
        self.failed = 0
        
    def log_test(self, name, passed, details=""):
        """Log test result with color coding"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
        if details:
            print(f"     {details}")
        
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        print()
    
    def test_health_check(self):
        """Test 1: Health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            passed = response.status_code == 200
            self.log_test(
                "Health Check", 
                passed,
                f"Status: {response.status_code}"
            )
            return passed
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {e}")
            return False
    
    def test_frontend_loads(self):
        """Test 2: Frontend HTML loads"""
        try:
            response = self.session.get(f"{self.base_url}/", timeout=10)
            passed = response.status_code == 200 and "Super-Flashcards" in response.text
            self.log_test(
                "Frontend Loads",
                passed,
                f"Status: {response.status_code}, Contains title: {'Super-Flashcards' in response.text}"
            )
            return passed
        except Exception as e:
            self.log_test("Frontend Loads", False, f"Error: {e}")
            return False
    
    def test_static_assets(self):
        """Test 3: Static JavaScript loads"""
        try:
            response = self.session.get(f"{self.base_url}/static/app.js", timeout=10)
            passed = response.status_code == 200 and len(response.content) > 1000
            self.log_test(
                "Static Assets (app.js)",
                passed,
                f"Status: {response.status_code}, Size: {len(response.content)} bytes"
            )
            return passed
        except Exception as e:
            self.log_test("Static Assets", False, f"Error: {e}")
            return False
    
    def test_api_languages(self):
        """Test 4: API languages endpoint (requires DB)"""
        try:
            response = self.session.get(f"{self.base_url}/api/languages", timeout=10)
            passed = response.status_code == 200
            
            if passed:
                languages = response.json()
                passed = isinstance(languages, list) and len(languages) > 0
                self.log_test(
                    "API Languages Endpoint",
                    passed,
                    f"Status: {response.status_code}, Languages found: {len(languages) if isinstance(languages, list) else 0}"
                )
            else:
                self.log_test(
                    "API Languages Endpoint",
                    False,
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
            return passed
        except Exception as e:
            self.log_test("API Languages Endpoint", False, f"Error: {e}")
            return False
    
    def test_oauth_redirect(self):
        """Test 5: OAuth redirect initiates correctly"""
        try:
            # Don't follow redirects - we just want to verify the endpoint works
            response = self.session.get(
                f"{self.base_url}/api/auth/google/login",
                allow_redirects=False,
                timeout=10
            )
            
            # Should redirect to Google OAuth (302/307)
            passed = response.status_code in [302, 307]
            
            if passed:
                location = response.headers.get('Location', '')
                google_oauth = 'accounts.google.com' in location
                has_state = 'state=' in location
                has_redirect_uri = 'redirect_uri=' in location
                
                passed = google_oauth and has_state and has_redirect_uri
                
                self.log_test(
                    "OAuth Redirect",
                    passed,
                    f"Status: {response.status_code}, Redirects to Google: {google_oauth}, Has state: {has_state}, Has redirect_uri: {has_redirect_uri}"
                )
            else:
                self.log_test(
                    "OAuth Redirect",
                    False,
                    f"Status: {response.status_code}, Expected 302/307 redirect"
                )
            
            return passed
        except Exception as e:
            self.log_test("OAuth Redirect", False, f"Error: {e}")
            return False
    
    def test_oauth_callback_route(self):
        """Test 6: OAuth callback route exists (will fail without valid state, but shouldn't 404)"""
        try:
            # Try to hit callback with dummy params - should get auth error, NOT 404
            response = self.session.get(
                f"{self.base_url}/api/auth/google/callback?state=test&code=test",
                timeout=10
            )
            
            # Should NOT be 404 - any other error (400, 401, 500) means route exists
            passed = response.status_code != 404
            
            self.log_test(
                "OAuth Callback Route Exists",
                passed,
                f"Status: {response.status_code} (404 = route missing, anything else = route exists)"
            )
            
            return passed
        except Exception as e:
            self.log_test("OAuth Callback Route Exists", False, f"Error: {e}")
            return False
    
    def test_database_connection(self):
        """Test 7: Database connection works (via languages endpoint)"""
        # This is covered by test_api_languages, but let's be explicit
        try:
            response = self.session.get(f"{self.base_url}/api/languages", timeout=10)
            
            if response.status_code == 200:
                languages = response.json()
                passed = len(languages) > 0
                self.log_test(
                    "Database Connection",
                    passed,
                    f"Successfully retrieved {len(languages)} languages from database"
                )
            else:
                # Check if error is database-related
                error_text = response.text.lower()
                is_db_error = any(keyword in error_text for keyword in ['login failed', 'connection', 'database', 'sql'])
                
                self.log_test(
                    "Database Connection",
                    False,
                    f"Database error detected: {response.text[:200]}"
                )
                passed = False
            
            return passed
        except Exception as e:
            self.log_test("Database Connection", False, f"Error: {e}")
            return False
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("="*80)
        print(f"🚀 DEPLOYMENT VERIFICATION TEST SUITE")
        print(f"Target: {self.base_url}")
        print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        print()
        
        # Run tests in order
        self.test_health_check()
        self.test_frontend_loads()
        self.test_static_assets()
        self.test_database_connection()
        self.test_api_languages()
        self.test_oauth_redirect()
        self.test_oauth_callback_route()
        
        # Summary
        print("="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"📈 Success Rate: {(self.passed / (self.passed + self.failed) * 100):.1f}%")
        print()
        
        if self.failed == 0:
            print("🎉 ALL TESTS PASSED! Deployment verified successfully.")
            return 0
        else:
            print("⚠️  SOME TESTS FAILED! Review errors above.")
            return 1


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Verify deployment health")
    parser.add_argument(
        '--url',
        default=PRODUCTION_URL,
        help=f"Base URL to test (default: {PRODUCTION_URL})"
    )
    parser.add_argument(
        '--staging',
        action='store_true',
        help="Test staging URL instead of production"
    )
    
    args = parser.parse_args()
    
    url = STAGING_URL if args.staging else args.url
    
    tester = DeploymentTester(url)
    exit_code = tester.run_all_tests()
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

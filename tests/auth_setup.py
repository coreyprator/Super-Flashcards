# tests/auth_setup.py
"""
One-time authentication setup for Playwright tests
Run this once to save your authenticated session
"""

from playwright.sync_api import sync_playwright
import json
import os
import sys

def setup_auth_manual():
    """
    Manual login - for Google OAuth (requires user interaction)
    Use this if you want to test with Google OAuth
    """
    with sync_playwright() as p:
        # Launch browser with visible UI
        browser = p.chromium.launch(headless=False)
        
        # Create context with HTTP Basic Auth credentials for production
        context = browser.new_context(
            http_credentials={"username": "beta", "password": "flashcards2025"}
        )
        page = context.new_page()
        
        print("\n🔐 Starting MANUAL authentication setup...")
        print("=" * 70)
        print("📱 INSTRUCTIONS:")
        print("  1. A browser window will open")
        print("  2. Click 'Continue with Google'")
        print("  3. Use your iPhone QR code if needed - TAKE YOUR TIME!")
        print("  4. Complete Google authentication")
        print("  5. Wait until you see the main app (Study/Browse/Read)")
        print("  6. Then come back here and press Enter")
        print("=" * 70)
        print("\n⏰ The browser will stay open as long as you need.\n")
        
        # Go to the app
        page.goto("https://learn.rentyourcio.com/")
        
        # Wait for user to complete login (no timeout - take as long as needed)
        input("\n✋ Press Enter ONLY AFTER you're logged in and see the main app screen...")
        
        # Save the authentication state
        storage_state_path = os.path.join(os.path.dirname(__file__), "auth_state.json")
        context.storage_state(path=storage_state_path)
        
        print(f"\n✅ Authentication state saved to: {storage_state_path}")
        print("✅ Future tests will use this session!")
        
        browser.close()

def setup_auth_automatic(email="test_playwright@example.com", password="TestPassword123!"):
    """
    Automatic login using email/password
    This works reliably in Playwright (no OAuth issues)
    
    Uses a test account (test_playwright@example.com) for automated testing.
    If login fails, it will try to register the account first.
    """
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        
        # Create context with HTTP Basic Auth credentials for production
        context = browser.new_context(
            http_credentials={"username": "beta", "password": "flashcards2025"}
        )
        page = context.new_page()
        
        print("\n🔐 Starting AUTOMATIC authentication setup...")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {'*' * len(password)}\n")
        
        # Go to the login page
        page.goto("https://learn.rentyourcio.com/login")
        
        # Wait for page to load
        page.wait_for_load_state("networkidle")
        
        print("📝 Filling in login form...")
        
        # Fill in the login form
        page.fill('#loginEmail', email)
        page.fill('#loginPassword', password)
        
        # Click the submit button INSIDE #loginForm (not the Google OAuth button!)
        print("🚀 Submitting login...")
        page.click('#loginForm button[type="submit"]')
        
        # Wait a moment and check where we are
        page.wait_for_timeout(2000)
        current_url = page.url
        print(f"📍 Current URL after submit: {current_url}")
        
        # Check if there's an error message (login failed)
        error_el = page.query_selector('.error-message, .alert, [role="alert"]')
        if error_el and current_url.endswith('/login'):
            error_text = error_el.inner_text()
            print(f"⚠️  Login failed: {error_text}")
            
            # If login failed, try to register the account
            if "Incorrect email or password" in error_text or "not found" in error_text.lower():
                print("\n📝 Account doesn't exist. Creating test account...")
                
                # Switch to Register tab
                page.click('button:has-text("Register")')
                page.wait_for_timeout(500)
                
                # Fill in registration form
                page.fill('#registerUsername', 'playwright_test')
                page.fill('#registerEmail', email)
                page.fill('#registerPassword', password)
                
                # Submit registration
                print("✍️  Submitting registration...")
                page.click('#registerForm button[type="submit"]')
                page.wait_for_timeout(2000)
                
                print("✅ Test account created! Now logging in...")
        
        # Wait for navigation to complete (either from login or registration)
        try:
            page.wait_for_url("https://learn.rentyourcio.com/", timeout=10000)
        except Exception as e:
            print(f"❌ Navigation failed!")
            print(f"   Final URL: {page.url}")
            print(f"   Page title: {page.title()}")
            
            # Check console logs for errors
            print("\n📋 Browser console logs:")
            # Note: Console logs need to be captured with page.on('console')
            
            # Take a screenshot for debugging
            page.screenshot(path="auth_error.png")
            print("📸 Screenshot saved to auth_error.png")
            raise
        
        print("✅ Login successful! Waiting for app to initialize...")
        
        # Wait a bit for the app to fully initialize
        page.wait_for_timeout(2000)
        
        # Save the authentication state
        storage_state_path = os.path.join(os.path.dirname(__file__), "auth_state.json")
        context.storage_state(path=storage_state_path)
        
        print(f"\n✅ Authentication state saved to: {storage_state_path}")
        print("✅ Future tests will use this session!")
        
        browser.close()

if __name__ == "__main__":
    # For now, always use Google OAuth (manual)
    # Email/password needs full credential complexity testing and email verification
    print("\n" + "="*60)
    print("🔐 GOOGLE OAUTH AUTHENTICATION SETUP")
    print("="*60)
    print("\nThis will open a browser for you to log in with Google.")
    print("After logging in, press Enter to save the session.\n")
    
    setup_auth_manual()


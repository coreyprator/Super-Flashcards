# tests/conftest.py
"""
Pytest configuration for Playwright tests
Automatically loads saved authentication state
"""

import pytest
import os
from playwright.sync_api import Page, Browser, BrowserContext


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """
    Configure browser context for all tests
    Loads saved authentication state if available
    Includes HTTP Basic Auth for production access
    """
    auth_state_path = os.path.join(os.path.dirname(__file__), "auth_state.json")
    
    # HTTP Basic Auth for production site protection
    http_credentials = {"username": "beta", "password": "flashcards2025"}
    
    if os.path.exists(auth_state_path):
        print(f"\n🔑 Using saved authentication from: {auth_state_path}")
        return {
            **browser_context_args,
            "viewport": {"width": 1920, "height": 1080},
            "ignore_https_errors": True,
            "storage_state": auth_state_path,  # Load saved cookies/session
            "http_credentials": http_credentials,  # HTTP Basic Auth
        }
    else:
        print(f"\n⚠️ No saved authentication found at: {auth_state_path}")
        print("   Run: python tests/auth_setup.py to save your login")
        return {
            **browser_context_args,
            "viewport": {"width": 1920, "height": 1080},
            "ignore_https_errors": True,
            "http_credentials": http_credentials,  # HTTP Basic Auth
        }


@pytest.fixture(scope="function")
def context(browser: Browser, browser_context_args):
    """Create a new context for each test with saved auth"""
    context = browser.new_context(**browser_context_args)
    yield context
    context.close()


@pytest.fixture(scope="function")
def page(context: BrowserContext) -> Page:
    """Create a new page for each test"""
    page = context.new_page()
    yield page
    page.close()

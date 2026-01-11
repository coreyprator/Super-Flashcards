"""
Quick helper to find selectors in your app

Run this and click elements to see their selectors!
"""
from playwright.sync_api import sync_playwright

def find_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        
        # Use saved auth
        context = browser.new_context(storage_state="tests/auth_state.json")
        page = context.new_page()
        
        print("\n" + "="*60)
        print("🔍 SELECTOR FINDER")
        print("="*60)
        print("\nBrowser opened with your saved login!")
        print("\n📋 Instructions:")
        print("1. In the browser, open DevTools (F12)")
        print("2. Click the 'Elements' tab")
        print("3. Click the 'Select element' tool (top-left of DevTools)")
        print("4. Click on any element in your app")
        print("5. In the Elements tab, you'll see the HTML")
        print("6. Look for id= or class= attributes")
        print("\n💡 Quick Reference:")
        print("   - If you see: id=\"mode-study\"")
        print("     → Selector is: #mode-study")
        print("   - If you see: class=\"version-badge\"")
        print("     → Selector is: .version-badge")
        print("\nNavigating to your app...")
        
        page.goto("https://learn.rentyourcio.com/")
        
        print("\n✅ Page loaded! Now inspect elements in DevTools")
        print("\nOR: Click 'Explore' in Playwright Inspector to record selectors")
        
        # Pause to let user inspect
        page.pause()
        
        browser.close()

if __name__ == "__main__":
    find_selectors()

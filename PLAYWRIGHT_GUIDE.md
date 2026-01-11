# 🎭 Playwright Testing Guide for Super-Flashcards

## ✅ Setup Complete!

Playwright is now installed and ready to use.

## 🚀 Quick Start

### 1. Record a Test (CURRENTLY RUNNING)
```powershell
python -m playwright codegen https://learn.rentyourcio.com
```

This opens TWO windows:
- **Browser**: Click through your test scenario
- **Playwright Inspector**: Shows generated code as you click

**What to click:**
1. Hard refresh (Ctrl+Shift+R)
2. Check version badge
3. Click each navigation button (Study, Read, Browse, Import)
4. Test Add Card workflow
5. Test Batch Generation
6. Check delete buttons in Browse

**Copy the generated code** from Inspector window!

---

### 2. Run Existing Tests

#### Run all tests (headless):
```powershell
pytest tests/test_v2_6_33_deployment.py -v
```

#### Run with browser visible (headed):
```powershell
pytest tests/test_v2_6_33_deployment.py -v --headed
```

#### Run slower (easier to watch):
```powershell
pytest tests/test_v2_6_33_deployment.py -v --headed --slowmo=500
```

#### Run single test:
```powershell
pytest tests/test_v2_6_33_deployment.py::test_version_badge -v --headed
```

#### Run with HTML report:
```powershell
pip install pytest-html
pytest tests/test_v2_6_33_deployment.py -v --html=test-report.html --self-contained-html
```

---

## 📝 Test Files Created

### `tests/conftest.py`
- Pytest configuration
- Browser fixtures
- Shared setup/teardown

### `tests/test_v2_6_33_deployment.py`
- 8 tests for v2.6.33 deployment
- Tests navigation, version, URL parameters, delete buttons

### `pytest.ini`
- Pytest configuration
- Test discovery settings
- Output formatting

---

## 🎯 Current Tests

1. ✅ **test_simple_page_load** - Smoke test
2. ✅ **test_version_badge** - Check v2.6.33 visible
3. ✅ **test_navigation_buttons_visible** - All 4 buttons visible
4. ✅ **test_navigation_buttons_clickable** - Buttons work
5. ✅ **test_delete_buttons_in_browse** - Delete buttons in Browse
6. ⚠️ **test_url_parameter_cardid** - URL ?cardId=UUID (needs real UUID)
7. ⚠️ **test_url_parameter_word** - URL ?word=X&language=Y
8. ✅ **test_full_hard_refresh** - Hard refresh works

---

## 🔧 VS Code Playwright Extension

1. **Install Extension:**
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search: "Playwright Test for VSCode"
   - Install

2. **Features:**
   - ▶️ Run button appears next to each test
   - Debug with breakpoints
   - Record test from VS Code
   - View trace files

---

## 📸 Debug Features

### Take Screenshots
```python
def test_example(page: Page):
    try:
        page.goto("https://learn.rentyourcio.com/")
        # ... test code ...
    except Exception as e:
        page.screenshot(path="test-failure.png")
        raise
```

### Use Trace Viewer
```powershell
# Run with trace
pytest tests/test_v2_6_33_deployment.py --tracing=on

# View trace
python -m playwright show-trace trace.zip
```

### Pause for Inspection
```python
def test_example(page: Page):
    page.goto("https://learn.rentyourcio.com/")
    page.pause()  # Opens Playwright Inspector
    # ... continue test ...
```

---

## 🎬 Recording Your Own Tests

### Method 1: Codegen (Running Now)
```powershell
python -m playwright codegen https://learn.rentyourcio.com
```

### Method 2: From Existing Browser
```powershell
# Start recording from current state
python -m playwright codegen --target python -o my_test.py https://learn.rentyourcio.com
```

### Method 3: Record Specific Browser
```powershell
# Record in Firefox
python -m playwright codegen --browser firefox https://learn.rentyourcio.com

# Record in WebKit (Safari)
python -m playwright codegen --browser webkit https://learn.rentyourcio.com
```

---

## 🔍 Common Selectors

```python
# By button text
page.get_by_role("button", name="Add Card")

# By ID
page.locator("#word-input")

# By class
page.locator(".flashcard-item")

# By text content
page.locator("text=Study")

# By placeholder
page.get_by_placeholder("Enter word...")

# By test ID
page.locator("[data-testid='card-123']")

# Combined
page.locator(".flashcard:has-text('hello')")

# First/Last
page.locator(".flashcard").first
page.locator(".flashcard").last
```

---

## ✏️ Converting Recorded Code to pytest

Codegen gives you code like this:
```python
from playwright.sync_api import Playwright, sync_playwright

def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    
    page.goto("https://learn.rentyourcio.com/")
    page.get_by_role("button", name="Study").click()
    # ... more actions ...
    
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
```

**Convert to pytest:**
```python
def test_my_scenario(page: Page):
    """Test description"""
    page.goto("https://learn.rentyourcio.com/")
    page.get_by_role("button", name="Study").click()
    
    # Add assertions!
    expect(page.locator(".study-mode")).to_be_visible()
```

---

## 🎯 Next Steps

1. **Click through your test scenario** in the codegen browser
2. **Copy the generated code** from Inspector
3. **Paste into a new test file** (e.g., `test_my_workflow.py`)
4. **Add assertions** (`expect(...)` statements)
5. **Run your test:** `pytest tests/test_my_workflow.py -v --headed`

---

## 📚 Resources

- **Playwright Docs**: https://playwright.dev/python/
- **pytest-playwright**: https://github.com/microsoft/playwright-pytest
- **Selectors Guide**: https://playwright.dev/python/docs/selectors
- **Best Practices**: https://playwright.dev/python/docs/best-practices

---

## 🐛 Troubleshooting

### "playwright not recognized"
```powershell
python -m playwright codegen <url>
```

### "Browser not installed"
```powershell
python -m playwright install
```

### Tests timing out
```python
# Increase timeout
expect(element).to_be_visible(timeout=10000)  # 10 seconds
```

### Can't find element
```python
# Wait for page to load
page.wait_for_load_state("networkidle")

# Wait for specific element
page.wait_for_selector(".my-element")
```

---

## ✅ You're Ready!

The codegen tool is currently running. Click through your test scenario and watch the code generate in real-time!

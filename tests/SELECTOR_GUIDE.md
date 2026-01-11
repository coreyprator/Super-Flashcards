# 🔧 Selector Replacement Guide

## ❌ Current Failing Tests (Need Your Selectors!)

Below are the **5 tests that need selector updates**. I've marked exactly what needs to be replaced with `← REPLACE THIS`.

### Test 2: Version Badge (Line 45)
```python
# Current (failing):
version = page.locator("text=v2.6.33")  ← REPLACE THIS

# What we need from inspector:
# Look for the version badge element in your app
# Common selectors might be:
#   - #version-badge
#   - .version-badge
#   - .font-mono (if it has that class)
#   - span.version
```

### Test 3: Navigation Buttons (Lines 62-66)
```python
# Current (failing):
button = page.locator(f"button:has-text('{button_text}')")  ← REPLACE THIS

# What we need from inspector:
# Click on Study button and look for:
#   - id="mode-study" → selector: #mode-study
#   - data-mode="study" → selector: button[data-mode="study"]
#   - class="nav-button" → selector: .nav-button
```

### Test 4: Navigation Buttons Clickable (Lines 85-94)
```python
# Current (failing):
button = page.locator(f"button:has-text('{button_text}')")  ← REPLACE THIS

# Same as Test 3 - needs the button selectors
```

### Test 5: Delete Buttons (Line 111)
```python
# Current (failing):
delete_buttons = page.locator("button[title='Delete'], button:has-text('🗑️'), .delete-button")  ← REPLACE THIS

# What we need from inspector:
# Go to Browse mode, click on a delete button and look for:
#   - class="delete-button"
#   - button[onclick*="deleteCard"]
#   - .delete-card-button
#   - button.btn-delete
```

### Test 8: Version Badge After Refresh (Line 188)
```python
# Current (failing):
version = page.locator("text=v2.6.33")  ← REPLACE THIS

# Same as Test 2 - needs the version badge selector
```

---

## 📋 **What to Look For in Inspector**

When you clicked elements in the Playwright Inspector, it showed code like:

```python
# Example of what you might have seen:
page.locator("#mode-study").click()  # ← "#mode-study" is the selector!
page.locator(".version-badge")       # ← ".version-badge" is the selector!
page.get_by_role("button", name="Study")  # ← Alternative selector
```

---

## ✅ **Easy Option: Just Tell Me What You See!**

**Option 1:** Paste the entire code block from the Inspector here

**Option 2:** Tell me what you see for each element:
```
Version badge: ______
Study button: ______
Read button: ______
Browse button: ______
Import button: ______
Delete button: ______
```

**Option 3:** Run the selector finder script:
```powershell
python tests/extract_selectors.py
```
Then use DevTools to inspect each element and tell me the id/class values!

---

## 🎯 **Quick Visual Guide**

When you inspect an element in the browser, you'll see HTML like:

```html
<!-- Example 1: Element with ID -->
<button id="mode-study">📚 Study</button>
Selector: #mode-study

<!-- Example 2: Element with class -->
<span class="version-badge font-mono">v2.6.33</span>
Selector: .version-badge  OR  .font-mono

<!-- Example 3: Element with data attribute -->
<button data-mode="study" class="nav-btn">Study</button>
Selector: button[data-mode="study"]  OR  .nav-btn

<!-- Example 4: Multiple classes -->
<button class="btn btn-danger delete-card">Delete</button>
Selector: .delete-card  OR  .btn-danger
```

---

## 🚀 **Once You Share, I'll Update Everything!**

Just paste any of these:
1. The full code from Playwright Inspector
2. Individual selectors for each element
3. The HTML you see in DevTools

And I'll update all 5 failing tests to use the correct selectors! 🎉

# Manual Logout Helper

If the logout button doesn't work, run this in the browser console:

```javascript
// Complete logout - clears EVERYTHING
(async function forceLogout() {
    console.log('🚪 FORCE LOGOUT - Clearing all local data...');
    
    // 1. Clear localStorage
    localStorage.clear();
    console.log('✅ Local storage cleared');
    
    // 2. Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ Session storage cleared');
    
    // 3. Clear ALL cookies
    document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + location.hostname;
    });
    console.log('✅ All cookies cleared');
    
    // 4. Delete IndexedDB
    try {
        await indexedDB.deleteDatabase('flashcard_db');
        console.log('✅ IndexedDB deleted');
    } catch (e) {
        console.warn('⚠️ IndexedDB delete error:', e);
    }
    
    // 5. Clear service worker caches
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('✅ Service worker caches cleared (' + cacheNames.length + ' caches)');
        } catch (e) {
            console.warn('⚠️ Cache clear error:', e);
        }
    }
    
    // 6. Unregister service workers
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(r => r.unregister()));
            console.log('✅ Service workers unregistered (' + registrations.length + ' workers)');
        } catch (e) {
            console.warn('⚠️ Service worker unregister error:', e);
        }
    }
    
    console.log('✅ LOGOUT COMPLETE!');
    console.log('🔄 Redirecting to login page in 2 seconds...');
    
    setTimeout(() => {
        window.location.href = '/login?logout=force';
        window.location.reload(true);
    }, 2000);
})();
```

## Alternative: DevTools Method

1. **Open DevTools** (F12)
2. Go to **Application** tab
3. In left sidebar, click **"Clear storage"**
4. Check ALL boxes:
   - Local storage
   - Session storage
   - IndexedDB
   - Cookies
   - Cache storage
5. Click **"Clear site data"** button
6. **Reload** the page (F5)
7. You should be redirected to login

## What Changed?

### Performance Fix
- **Before**: Background sync re-saved ALL 755 flashcards every time
- **After**: Only saves flashcards that are actually new or changed
- **Result**: Massive performance improvement for returning users

### Logout Fix
- **Before**: Didn't clear cookies or localStorage completely
- **After**: Clears EVERYTHING including session cookies
- **Result**: Clean logout that forces login screen

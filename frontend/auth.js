// frontend/auth.js
/**
 * Authentication module for Super-Flashcards
 * Handles user authentication, token management, and auth state.
 *
 * Token strategy (BUG-006 fix):
 *   - Access token (15min): in-memory + localStorage fallback
 *   - Refresh token (30 days): HTTP-only cookie (set by backend)
 *   - Auto-refresh before expiry + on visibility change
 */

class Auth {
    constructor() {
        this.accessToken = null;  // Primary: in-memory
        this.user = this.getStoredUser();
        this._refreshTimer = null;
        this._toastContainer = null;
        this._initialRefreshPromise = null;  // Track startup refresh for requireAuth()

        // Recover access token from localStorage (page reload fallback)
        const stored = localStorage.getItem('auth_token');
        if (stored && !this._isExpired(stored)) {
            this.accessToken = stored;
            this._scheduleRefresh(stored);
        }

        // Handle OAuth callback - extract token from URL parameters
        this.handleOAuthCallback();

        // iOS fix: if no access token recovered from localStorage, attempt
        // cookie-based refresh. iOS Safari ITP can purge localStorage after
        // 7 days of inactivity, but HTTP-only cookies (30 day, SameSite=None)
        // survive. This recovers the session without forcing re-login.
        if (!this.accessToken && !this._isOAuthCallback()) {
            console.log('🔄 No stored token — attempting cookie-based session recovery');
            this._initialRefreshPromise = this.refreshToken().then(ok => {
                if (ok) {
                    console.log('✅ Session recovered from refresh cookie (iOS recovery path)');
                } else {
                    console.log('ℹ️ No valid refresh cookie — user must log in');
                }
                return ok;
            });
        }

        // Re-verify/refresh when app returns to foreground (Phase 4)
        // Also attempt refresh when accessToken is null — iOS may have
        // purged localStorage while app was in background but cookie survives
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                if (this.accessToken) {
                    this._checkAndRefresh();
                } else if (!this._isOAuthCallback()) {
                    console.log('🔄 App resumed with no token — attempting cookie recovery');
                    this.refreshToken();
                }
            }
        });
    }

    /**
     * Check if current page load is an OAuth callback (avoid competing with handleOAuthCallback)
     */
    _isOAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        return params.get('auth') === 'success' && params.get('token');
    }

    // ==================== Toast notifications ====================

    _showAuthToast(message, type = 'info') {
        console.log(`[AUTH TOAST] ${type}: ${message}`);
        if (!this._toastContainer) {
            this._toastContainer = document.createElement('div');
            this._toastContainer.id = 'auth-toast-container';
            this._toastContainer.style.cssText = 'position:fixed;bottom:80px;left:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
            document.body.appendChild(this._toastContainer);
            console.log('[AUTH TOAST] Container created, appended to body');
        }
        const colors = {
            success: 'background:#065f46;color:#6ee7b7;border:1px solid #059669;',
            error: 'background:#7f1d1d;color:#fca5a5;border:1px solid #dc2626;',
            info: 'background:#1e3a5f;color:#93c5fd;border:1px solid #3b82f6;',
        };
        const icons = { success: '\u2705', error: '\u274c', info: '\ud83d\udd04' };
        const toast = document.createElement('div');
        toast.style.cssText = `${colors[type] || colors.info}padding:10px 16px;border-radius:8px;font-size:14px;font-weight:500;font-family:system-ui,sans-serif;opacity:0;transition:opacity 0.3s;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.3);`;
        toast.textContent = `${icons[type] || ''} ${message}`;
        this._toastContainer.appendChild(toast);
        console.log(`[AUTH TOAST] Element created: ${toast.outerHTML}`);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // ==================== Token helpers ====================

    /**
     * Decode JWT payload (no verification, just read claims)
     */
    _decodePayload(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    /**
     * Check if a JWT is expired (or expires within 60s)
     */
    _isExpired(token) {
        const payload = this._decodePayload(token);
        if (!payload || !payload.exp) return true;
        // Consider expired if less than 60 seconds remaining
        return payload.exp * 1000 < Date.now() + 60000;
    }

    /**
     * Schedule automatic token refresh before expiry
     */
    _scheduleRefresh(token) {
        if (this._refreshTimer) clearTimeout(this._refreshTimer);

        const payload = this._decodePayload(token);
        if (!payload || !payload.exp) return;

        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        // Refresh 60 seconds before expiry, minimum 5 seconds
        const refreshIn = Math.max(expiresAt - now - 60000, 5000);

        const mins = Math.round(refreshIn / 60000);
        const secs = Math.round(refreshIn / 1000);
        const label = mins >= 1 ? `${mins}m` : `${secs}s`;
        console.log(`🔄 Token refresh scheduled in ${secs}s (${label})`);
        this._showAuthToast(`Session refresh in ${label}`, 'info');
        this._refreshTimer = setTimeout(() => this.refreshToken(), refreshIn);

        // Console countdown poller (every 60s)
        if (this._countdownInterval) clearInterval(this._countdownInterval);
        this._refreshTarget = Date.now() + refreshIn;
        this._countdownInterval = setInterval(() => {
            const remaining = Math.round((this._refreshTarget - Date.now()) / 1000);
            if (remaining <= 0) {
                console.log('🔄 Token refresh firing NOW');
                clearInterval(this._countdownInterval);
            } else {
                const m = Math.floor(remaining / 60);
                const s = remaining % 60;
                console.log(`⏱️ Token refresh in ${m}m ${s}s`);
            }
        }, 60000);
    }

    /**
     * Check token freshness and refresh if needed (called on visibility change)
     */
    async _checkAndRefresh() {
        if (!this.accessToken) return;

        if (this._isExpired(this.accessToken)) {
            console.log('🔄 Token expired on resume, refreshing...');
            this._showAuthToast('App resumed - refreshing session...', 'info');
            await this.refreshToken();
        }
    }

    // ==================== Refresh flow ====================

    /**
     * Use refresh token (HTTP-only cookie) to get a new access token
     */
    async refreshToken() {
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include',  // Send HTTP-only cookies
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.access_token;
                localStorage.setItem('auth_token', data.access_token);
                this._scheduleRefresh(data.access_token);
                console.log('✅ Token refreshed successfully');
                this._showAuthToast('Session refreshed', 'success');
                return true;
            } else {
                console.warn('⚠️ Refresh failed, status:', response.status);
                this._showAuthToast('Session expired - please log in again', 'error');
                // Refresh token is also expired/invalid — user must re-login
                this.clearAuth();
                window.location.href = '/login';
                return false;
            }
        } catch (error) {
            console.error('❌ Token refresh error:', error);
            this._showAuthToast('Network error - offline?', 'error');
            // Network error — don't redirect, user might be offline
            return false;
        }
    }

    // ==================== OAuth callback ====================

    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const authSuccess = urlParams.get('auth');

        if (token && authSuccess === 'success') {
            console.log('🔐 OAuth callback detected - storing token');

            const payload = this._decodePayload(token);
            if (payload) {
                const user = {
                    id: payload.user_id,
                    email: payload.email,
                    picture: null,
                    name: null
                };

                this.setAuth(token, user);
                console.log('✅ Token stored from OAuth callback');

                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);

                // Fetch full user profile
                this.verifyToken();
            } else {
                console.error('❌ Failed to decode OAuth token');
            }
        }
    }

    // ==================== Storage ====================

    getStoredUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    isAuthenticated() {
        return !!this.accessToken;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.accessToken;
    }

    setAuth(token, user) {
        this.accessToken = token;
        this.user = user;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this._scheduleRefresh(token);
    }

    clearAuth() {
        if (this._refreshTimer) clearTimeout(this._refreshTimer);
        this.accessToken = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    }

    // ==================== Logout ====================

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                credentials: 'include',  // Send refresh cookie for server-side cleanup
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            console.log('🚪 Logging out - clearing all local data...');

            this.clearAuth();
            localStorage.clear();
            console.log('✅ Local storage cleared');

            sessionStorage.clear();
            console.log('✅ Session storage cleared');

            // Clear all cookies (including refresh_token path variants)
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/api/auth";
            });
            console.log('✅ Cookies cleared');

            // Clear IndexedDB
            try {
                await indexedDB.deleteDatabase('flashcard_db');
                console.log('✅ IndexedDB cleared');
            } catch (dbError) {
                console.warn('⚠️ Could not clear IndexedDB:', dbError);
            }

            // Clear service worker cache
            if ('serviceWorker' in navigator && 'caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    console.log('✅ Service worker caches cleared');
                } catch (cacheError) {
                    console.warn('⚠️ Could not clear caches:', cacheError);
                }
            }

            console.log('✅ Logout complete - redirecting to login page');

            window.location.href = '/login?logout=true';
            window.location.reload(true);
        }
    }

    // ==================== API helpers ====================

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        return headers;
    }

    async verifyToken() {
        if (!this.accessToken) return false;

        try {
            const response = await fetch('/api/auth/me', {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const user = await response.json();
                this.user = user;
                localStorage.setItem('user', JSON.stringify(user));
                return true;
            } else if (response.status === 401) {
                // Access token expired — try refresh
                console.log('🔄 Access token rejected, attempting refresh...');
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry verify with new token
                    const retryRes = await fetch('/api/auth/me', {
                        headers: this.getAuthHeaders()
                    });
                    if (retryRes.ok) {
                        const user = await retryRes.json();
                        this.user = user;
                        localStorage.setItem('user', JSON.stringify(user));
                        return true;
                    }
                }
                this.clearAuth();
                return false;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    async requireAuth() {
        // If constructor's cookie refresh is in-flight, wait for it first
        if (this._initialRefreshPromise) {
            await this._initialRefreshPromise;
            this._initialRefreshPromise = null;
        }

        // Then check if we have a token
        if (!this.accessToken) {
            // Try refresh from cookie before giving up
            const refreshed = await this.refreshToken();
            if (!refreshed) {
                window.location.href = '/login';
                return false;
            }
        }

        const isValid = await this.verifyToken();
        if (!isValid) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    redirectIfNotAuthenticated() {
        if (!this.isAuthenticated()) {
            // Try silent refresh before redirecting
            this.refreshToken().then(ok => {
                if (!ok) window.location.href = '/login';
            });
        }
    }

    renderUserProfile(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.user) return;

        container.innerHTML = `
            <div class="user-profile">
                ${this.user.picture ? `<img src="${this.user.picture}" alt="${this.user.name || this.user.username}" class="user-avatar">` : ''}
                <div class="user-info">
                    <div class="user-name">${this.user.name || this.user.username}</div>
                    <div class="user-email">${this.user.email}</div>
                </div>
                <button id="logoutBtn" class="logout-btn">Logout</button>
            </div>
        `;

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }
}

// Create global auth instance
window.auth = new Auth();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}

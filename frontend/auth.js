// frontend/auth.js
/**
 * Authentication module for Super-Flashcards
 * Handles user authentication, token management, and auth state
 */

class Auth {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = this.getStoredUser();
        
        // Handle OAuth callback - extract token from URL parameters
        this.handleOAuthCallback();
    }

    /**
     * Handle OAuth callback from Google
     * Extracts token from URL parameters and stores it
     */
    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const authSuccess = urlParams.get('auth');

        if (token && authSuccess === 'success') {
            console.log('🔐 OAuth callback detected - storing token');
            
            // Decode JWT to get user info (simple decode, not verified)
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );
                const payload = JSON.parse(jsonPayload);
                
                // Create basic user object from JWT claims
                const user = {
                    id: payload.user_id,
                    email: payload.email,
                    picture: null, // Will be fetched from /api/auth/me
                    name: null     // Will be fetched from /api/auth/me
                };
                
                // Store token and user
                this.setAuth(token, user);
                console.log('✅ Token stored from OAuth callback');
                
                // Clean URL to remove auth parameters
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Fetch full user profile to get picture and name
                this.verifyToken();
            } catch (error) {
                console.error('❌ Failed to process OAuth token:', error);
            }
        }
    }

    /**
     * Get stored user from localStorage
     */
    getStoredUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Failed to parse stored user:', e);
                return null;
            }
        }
        return null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }

    /**
     * Get auth token
     */
    getToken() {
        return this.token;
    }

    /**
     * Set auth token and user
     */
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Clear auth data (logout)
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            console.log('🚪 Logging out - clearing all local data...');
            
            // Clear authentication
            this.clearAuth();
            
            // Clear ALL localStorage (not just auth tokens)
            localStorage.clear();
            console.log('✅ Local storage cleared');
            
            // Clear session storage (OAuth tracking)
            sessionStorage.clear();
            console.log('✅ Session storage cleared');
            
            // Clear ALL cookies
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
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
            
            // Force hard reload to clear any in-memory state
            window.location.href = '/login?logout=true';
            window.location.reload(true);
        }
    }

    /**
     * Get headers with authentication
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * Verify token is still valid
     */
    async verifyToken() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/me', {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const user = await response.json();
                this.user = user;
                localStorage.setItem('user', JSON.stringify(user));
                return true;
            } else {
                // Token is invalid
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    /**
     * Ensure user is authenticated, redirect to login if not
     */
    async requireAuth() {
        const isValid = await this.verifyToken();
        if (!isValid) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    /**
     * Redirect to login if not authenticated
     */
    redirectIfNotAuthenticated() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login';
        }
    }

    /**
     * Render user profile in UI
     */
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

        // Add logout handler
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

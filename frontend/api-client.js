/**
 * API Client
 * Offline-first API wrapper that handles network requests with fallback to IndexedDB
 * 
 * Features:
 * - Automatic offline detection and fallback
 * - Request queuing when offline
 * - Optimistic updates with rollback on failure
 * - Consistent API interface regardless of network state
 * - Background sync integration
 */

class ApiClient {
    constructor(offlineDB, syncManager) {
        this.db = offlineDB;
        this.sync = syncManager;
        this.baseUrl = this.detectBaseUrl();
        this.retryAttempts = 3;
        this.retryDelay = 1000; // Start with 1 second
        
        console.log(`🌐 API Client initialized with base URL: ${this.baseUrl}`);
    }
    
    /**
     * Auto-detect base URL based on current location
     */
    detectBaseUrl() {
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const port = window.location.port;
            
            // Development: localhost or local IP
            if (hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
                // Use port 8080 for backend API
                return `${protocol}//${hostname}:8080`;
            }
            
            // Production: same origin
            return `${protocol}//${hostname}`;
        }
        
        // Fallback
        return 'http://localhost:8080';
    }
    
    /**
     * Make HTTP request with offline fallback
     * @param {String} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {String} endpoint - API endpoint
     * @param {Object} data - Request data for POST/PUT
     * @param {Object} options - Additional options
     * @returns {Promise} Response data
     */
    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        console.log(`📡 ${method} ${endpoint}${navigator.onLine ? ' (online)' : ' (offline)'}`);
        
        // If offline, handle request through offline strategy
        if (!navigator.onLine) {
            return this.handleOfflineRequest(method, endpoint, data, options);
        }
        
        // Online: try request with retry logic
        return this.makeHttpRequest(method, url, data, options);
    }
    
    /**
     * Make actual HTTP request with retry logic
     * @param {String} method - HTTP method
     * @param {String} url - Full URL
     * @param {Object} data - Request data
     * @param {Object} options - Additional options
     * @returns {Promise} Response data
     */
    async makeHttpRequest(method, url, data, options) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const requestOptions = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                };
                
                if (data && (method === 'POST' || method === 'PUT')) {
                    requestOptions.body = JSON.stringify(data);
                }
                
                const response = await fetch(url, requestOptions);
                
                if (!response.ok) {
                    if (response.status >= 500 && attempt < this.retryAttempts) {
                        // Server error - retry
                        console.warn(`  ⚠️  Server error (${response.status}), retrying... (${attempt}/${this.retryAttempts})`);
                        await this.sleep(this.retryDelay * attempt);
                        continue;
                    }
                    
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Success
                if (response.status === 204) {
                    return null; // No content
                }
                
                const responseData = await response.json();
                console.log(`  ✅ Success (${response.status})`);
                return responseData;
                
            } catch (error) {
                lastError = error;
                
                if (attempt < this.retryAttempts && this.isNetworkError(error)) {
                    console.warn(`  🔄 Network error, retrying... (${attempt}/${this.retryAttempts})`);
                    await this.sleep(this.retryDelay * attempt);
                    continue;
                }
                
                break; // Don't retry on non-network errors
            }
        }
        
        // All attempts failed - fall back to offline mode
        console.error(`  ❌ Request failed after ${this.retryAttempts} attempts:`, lastError);
        
        // If this was a read operation, try offline fallback
        if (method === 'GET') {
            console.log(`  🔄 Falling back to offline data...`);
            return this.handleOfflineRequest(method, url.replace(this.baseUrl, ''), data, options);
        }
        
        throw lastError;
    }
    
    /**
     * Handle requests when offline
     * @param {String} method - HTTP method
     * @param {String} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {Object} options - Additional options
     * @returns {Promise} Local data or queued operation result
     */
    async handleOfflineRequest(method, endpoint, data, options) {
        console.log(`  📴 Handling offline: ${method} ${endpoint}`);
        
        if (method === 'GET') {
            return this.handleOfflineRead(endpoint, options);
        } else {
            return this.handleOfflineWrite(method, endpoint, data, options);
        }
    }
    
    /**
     * Handle offline read operations
     * @param {String} endpoint - API endpoint
     * @param {Object} options - Additional options
     * @returns {Promise} Local data
     */
    async handleOfflineRead(endpoint, options) {
        // Parse endpoint to determine what to read
        if (endpoint.startsWith('/api/flashcards')) {
            if (endpoint.includes('/search')) {
                const params = new URLSearchParams(endpoint.split('?')[1]);
                const query = params.get('q') || '';
                const languageId = params.get('language_id');
                return this.db.searchFlashcards(query, languageId ? parseInt(languageId) : null);
            } else if (endpoint.match(/\/api\/flashcards\/\d+$/)) {
                const id = parseInt(endpoint.split('/').pop());
                return this.db.getFlashcard(id);
            } else {
                return this.db.getAllFlashcards();
            }
        } else if (endpoint.startsWith('/api/languages')) {
            return this.db.getAllLanguages();
        }
        
        throw new Error(`Offline read not implemented for: ${endpoint}`);
    }
    
    /**
     * Handle offline write operations (queue for later sync)
     * @param {String} method - HTTP method
     * @param {String} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {Object} options - Additional options
     * @returns {Promise} Optimistic result
     */
    async handleOfflineWrite(method, endpoint, data, options) {
        console.log(`  📝 Queuing offline write: ${method} ${endpoint}`);
        
        // Perform optimistic update locally
        let result;
        
        if (endpoint.startsWith('/api/flashcards')) {
            result = await this.handleOfflineFlashcardWrite(method, endpoint, data);
        } else if (endpoint.startsWith('/api/languages')) {
            result = await this.handleOfflineLanguageWrite(method, endpoint, data);
        } else {
            throw new Error(`Offline write not implemented for: ${endpoint}`);
        }
        
        // Queue operation for sync when online
        await this.queueSyncOperation(method, endpoint, data, result);
        
        return result;
    }
    
    /**
     * Handle offline flashcard write operations
     * @param {String} method - HTTP method
     * @param {String} endpoint - API endpoint
     * @param {Object} data - Flashcard data
     * @returns {Promise} Local result
     */
    async handleOfflineFlashcardWrite(method, endpoint, data) {
        if (method === 'POST') {
            // Create new flashcard with temporary ID
            const tempId = -Date.now(); // Negative timestamp as temp ID
            const flashcard = {
                ...data,
                id: tempId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced: false
            };
            
            await this.db.saveFlashcard(flashcard);
            console.log(`  💾 Created local flashcard with temp ID: ${tempId}`);
            return flashcard;
            
        } else if (method === 'PUT') {
            // Update existing flashcard
            const id = parseInt(endpoint.split('/').pop());
            const updatedFlashcard = {
                ...data,
                id: id,
                updated_at: new Date().toISOString(),
                synced: false
            };
            
            await this.db.saveFlashcard(updatedFlashcard);
            console.log(`  💾 Updated local flashcard: ${id}`);
            return updatedFlashcard;
            
        } else if (method === 'DELETE') {
            // Delete flashcard
            const id = parseInt(endpoint.split('/').pop());
            await this.db.deleteFlashcard(id);
            console.log(`  🗑️ Deleted local flashcard: ${id}`);
            return null;
        }
    }
    
    /**
     * Handle offline language write operations
     * @param {String} method - HTTP method
     * @param {String} endpoint - API endpoint
     * @param {Object} data - Language data
     * @returns {Promise} Local result
     */
    async handleOfflineLanguageWrite(method, endpoint, data) {
        if (method === 'POST') {
            // Create new language
            const tempId = -Date.now();
            const language = {
                ...data,
                id: tempId,
                synced: false
            };
            
            await this.db.saveLanguage(language);
            console.log(`  💾 Created local language with temp ID: ${tempId}`);
            return language;
        }
    }
    
    /**
     * Queue sync operation for when online
     * @param {String} method - HTTP method
     * @param {String} endpoint - API endpoint  
     * @param {Object} data - Request data
     * @param {Object} result - Local operation result
     */
    async queueSyncOperation(method, endpoint, data, result) {
        let entity, entityId;
        
        if (endpoint.startsWith('/api/flashcards')) {
            entity = 'flashcard';
            if (method === 'POST') {
                entityId = result.id;
            } else {
                entityId = parseInt(endpoint.split('/').pop());
            }
        } else if (endpoint.startsWith('/api/languages')) {
            entity = 'language';
            entityId = result.id;
        }
        
        await this.db.queueSync(method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' : 'DELETE', entity, entityId, data);
        
        console.log(`  📋 Queued ${method} ${entity} operation for sync`);
    }
    
    /**
     * Check if error is network-related (should retry)
     * @param {Error} error - Error object
     * @returns {Boolean} True if network error
     */
    isNetworkError(error) {
        return error.name === 'TypeError' || 
               error.message.includes('fetch') ||
               error.message.includes('network') ||
               error.message.includes('Failed to fetch');
    }
    
    /**
     * Sleep utility for retry delays
     * @param {Number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ==================== FLASHCARD API METHODS ====================
    
    /**
     * Get all flashcards
     * @returns {Promise<Array>} Array of flashcards
     */
    async getFlashcards() {
        return this.request('GET', '/api/flashcards');
    }
    
    /**
     * Search flashcards
     * @param {String} query - Search query
     * @param {Number} languageId - Optional language filter
     * @returns {Promise<Array>} Matching flashcards
     */
    async searchFlashcards(query, languageId = null) {
        let endpoint = `/api/flashcards/search?q=${encodeURIComponent(query)}`;
        if (languageId) {
            endpoint += `&language_id=${languageId}`;
        }
        return this.request('GET', endpoint);
    }
    
    /**
     * Get single flashcard by ID
     * @param {Number} id - Flashcard ID
     * @returns {Promise<Object>} Flashcard object
     */
    async getFlashcard(id) {
        return this.request('GET', `/api/flashcards/${id}`);
    }
    
    /**
     * Create new flashcard
     * @param {Object} flashcard - Flashcard data
     * @returns {Promise<Object>} Created flashcard
     */
    async createFlashcard(flashcard) {
        return this.request('POST', '/api/flashcards', flashcard);
    }
    
    /**
     * Update existing flashcard
     * @param {Number} id - Flashcard ID
     * @param {Object} flashcard - Updated flashcard data
     * @returns {Promise<Object>} Updated flashcard
     */
    async updateFlashcard(id, flashcard) {
        return this.request('PUT', `/api/flashcards/${id}`, flashcard);
    }
    
    /**
     * Delete flashcard
     * @param {Number} id - Flashcard ID
     * @returns {Promise<null>} Success
     */
    async deleteFlashcard(id) {
        return this.request('DELETE', `/api/flashcards/${id}`);
    }
    
    // ==================== LANGUAGE API METHODS ====================
    
    /**
     * Get all languages
     * @returns {Promise<Array>} Array of languages
     */
    async getLanguages() {
        return this.request('GET', '/api/languages');
    }
    
    /**
     * Create new language
     * @param {Object} language - Language data
     * @returns {Promise<Object>} Created language
     */
    async createLanguage(language) {
        return this.request('POST', '/api/languages', language);
    }
    
    // ==================== TTS API METHODS ====================
    
    /**
     * Generate audio for text (TTS)
     * Note: This always requires online connection
     * @param {String} text - Text to convert
     * @param {String} language - Language code
     * @param {String} voice - Voice name (optional)
     * @returns {Promise<Object>} Audio data
     */
    async generateAudio(text, language, voice = null) {
        if (!navigator.onLine) {
            throw new Error('TTS requires internet connection');
        }
        
        let endpoint = `/api/tts/generate?text=${encodeURIComponent(text)}&language=${language}`;
        if (voice) {
            endpoint += `&voice=${voice}`;
        }
        
        return this.request('GET', endpoint);
    }
    
    /**
     * Get available TTS voices
     * @returns {Promise<Array>} Available voices
     */
    async getVoices() {
        return this.request('GET', '/api/tts/voices');
    }
    
    // ==================== IPA API METHODS ====================
    
    /**
     * Get IPA pronunciation for text
     * @param {String} text - Text to convert
     * @param {String} language - Language code
     * @returns {Promise<Object>} IPA data
     */
    async getIPA(text, language) {
        return this.request('GET', `/api/ipa/convert?text=${encodeURIComponent(text)}&language=${language}`);
    }
    
    // ==================== UTILITY METHODS ====================
    
    /**
     * Check API health/connectivity
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await this.request('GET', '/health');
            return { online: true, ...response };
        } catch (error) {
            return { online: false, error: error.message };
        }
    }
    
    /**
     * Force sync now (if sync manager available)
     * @returns {Promise<void>}
     */
    async forceSync() {
        if (this.sync) {
            await this.sync.forceSync();
        } else {
            console.warn('Sync manager not available');
        }
    }
    
    /**
     * Get connection status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            online: navigator.onLine,
            baseUrl: this.baseUrl,
            syncing: this.sync ? this.sync.syncing : false
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient };
}

console.log('🌐 API Client module loaded');
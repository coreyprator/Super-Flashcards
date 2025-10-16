/**
 * IndexedDB Database Module
 * Offline storage for flashcards, languages, and sync queue
 * 
 * Architecture:
 * - Stores all flashcards locally for offline access
 * - Maintains sync queue for offline changes
 * - Handles conflict resolution with server
 * - Provides fast local search and filtering
 */

const DB_NAME = 'SuperFlashcardsDB';
const DB_VERSION = 1;

// Object store names
const STORES = {
    FLASHCARDS: 'flashcards',
    LANGUAGES: 'languages',
    PREFERENCES: 'preferences',
    SYNC_QUEUE: 'syncQueue',
    METADATA: 'metadata'
};

class OfflineDatabase {
    constructor() {
        this.db = null;
        this.initPromise = null;
    }
    
    /**
     * Initialize IndexedDB
     * Creates all object stores and indexes
     */
    async init() {
        // Return existing promise if initialization already in progress
        if (this.initPromise) {
            return this.initPromise;
        }
        
        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('❌ IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔄 Upgrading IndexedDB schema...');
                
                // Flashcards store
                if (!db.objectStoreNames.contains(STORES.FLASHCARDS)) {
                    const flashcardStore = db.createObjectStore(STORES.FLASHCARDS, { 
                        keyPath: 'id' 
                    });
                    flashcardStore.createIndex('language_id', 'language_id', { unique: false });
                    flashcardStore.createIndex('updated_at', 'updated_at', { unique: false });
                    flashcardStore.createIndex('word', 'word_or_phrase', { unique: false });
                    console.log('  ✓ Created flashcards store');
                }
                
                // Languages store
                if (!db.objectStoreNames.contains(STORES.LANGUAGES)) {
                    const langStore = db.createObjectStore(STORES.LANGUAGES, { 
                        keyPath: 'id' 
                    });
                    langStore.createIndex('code', 'code', { unique: true });
                    langStore.createIndex('name', 'name', { unique: false });
                    console.log('  ✓ Created languages store');
                }
                
                // Preferences store
                if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
                    db.createObjectStore(STORES.PREFERENCES, { keyPath: 'key' });
                    console.log('  ✓ Created preferences store');
                }
                
                // Sync queue store
                if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    queueStore.createIndex('timestamp', 'timestamp', { unique: false });
                    queueStore.createIndex('type', 'type', { unique: false });
                    queueStore.createIndex('entity', 'entity', { unique: false });
                    console.log('  ✓ Created sync queue store');
                }
                
                // Metadata store
                if (!db.objectStoreNames.contains(STORES.METADATA)) {
                    db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
                    console.log('  ✓ Created metadata store');
                }
                
                console.log('✅ IndexedDB schema upgrade complete');
            };
        });
        
        return this.initPromise;
    }
    
    /**
     * Ensure database is initialized
     */
    async ensureInitialized() {
        if (!this.db) {
            await this.init();
        }
    }
    
    // ============================================================================
    // FLASHCARD OPERATIONS
    // ============================================================================
    
    /**
     * Save flashcard to IndexedDB
     * @param {Object} flashcard - Flashcard object to save
     * @returns {Object} Saved flashcard
     */
    async saveFlashcard(flashcard) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.FLASHCARDS], 'readwrite');
            const store = tx.objectStore(STORES.FLASHCARDS);
            
            // Add local timestamp
            flashcard.local_updated_at = new Date().toISOString();
            
            const request = store.put(flashcard);
            
            request.onsuccess = () => {
                console.log(`💾 Saved flashcard: ${flashcard.word_or_phrase} (ID: ${flashcard.id})`);
                resolve(flashcard);
            };
            
            request.onerror = () => {
                console.error('❌ Error saving flashcard:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Save multiple flashcards at once (batch operation)
     * @param {Array} flashcards - Array of flashcard objects
     * @returns {Number} Count of saved flashcards
     */
    async saveFlashcardsBatch(flashcards) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.FLASHCARDS], 'readwrite');
            const store = tx.objectStore(STORES.FLASHCARDS);
            
            let saved = 0;
            
            flashcards.forEach(flashcard => {
                flashcard.local_updated_at = new Date().toISOString();
                store.put(flashcard);
                saved++;
            });
            
            tx.oncomplete = () => {
                console.log(`💾 Batch saved ${saved} flashcards`);
                resolve(saved);
            };
            
            tx.onerror = () => {
                console.error('❌ Error in batch save:', tx.error);
                reject(tx.error);
            };
        });
    }
    
    /**
     * Get all flashcards from IndexedDB
     * @param {Number|null} languageId - Optional language filter
     * @returns {Array} Array of flashcard objects
     */
    async getAllFlashcards(languageId = null) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.FLASHCARDS], 'readonly');
            const store = tx.objectStore(STORES.FLASHCARDS);
            
            let request;
            if (languageId) {
                const index = store.index('language_id');
                request = index.getAll(languageId);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => {
                const flashcards = request.result;
                console.log(`📚 Retrieved ${flashcards.length} flashcards${languageId ? ' for language ' + languageId : ''}`);
                resolve(flashcards);
            };
            
            request.onerror = () => {
                console.error('❌ Error retrieving flashcards:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Get single flashcard by ID
     * @param {Number|String} id - Flashcard ID
     * @returns {Object|null} Flashcard object or null if not found
     */
    async getFlashcard(id) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.FLASHCARDS], 'readonly');
            const store = tx.objectStore(STORES.FLASHCARDS);
            const request = store.get(id);
            
            request.onsuccess = () => {
                if (request.result) {
                    console.log(`📖 Retrieved flashcard: ${request.result.word_or_phrase}`);
                } else {
                    console.log(`❌ Flashcard not found: ${id}`);
                }
                resolve(request.result || null);
            };
            
            request.onerror = () => {
                console.error('❌ Error retrieving flashcard:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Delete flashcard from IndexedDB
     * @param {Number|String} id - Flashcard ID to delete
     */
    async deleteFlashcard(id) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.FLASHCARDS], 'readwrite');
            const store = tx.objectStore(STORES.FLASHCARDS);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log(`🗑️ Deleted flashcard: ${id}`);
                resolve();
            };
            
            request.onerror = () => {
                console.error('❌ Error deleting flashcard:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Search flashcards locally
     * @param {String} query - Search query
     * @param {Number|null} languageId - Optional language filter
     * @returns {Array} Matching flashcards
     */
    async searchFlashcards(query, languageId = null) {
        const allCards = await this.getAllFlashcards(languageId);
        
        if (!query || query.trim() === '') {
            return allCards;
        }
        
        const searchLower = query.toLowerCase().trim();
        
        return allCards.filter(card => {
            return (
                card.word_or_phrase.toLowerCase().includes(searchLower) ||
                (card.translation && card.translation.toLowerCase().includes(searchLower)) ||
                (card.definition && card.definition.toLowerCase().includes(searchLower)) ||
                (card.etymology && card.etymology.toLowerCase().includes(searchLower)) ||
                (card.example_sentences && card.example_sentences.toLowerCase().includes(searchLower))
            );
        });
    }
    
    // ============================================================================
    // LANGUAGE OPERATIONS
    // ============================================================================
    
    /**
     * Save language to IndexedDB
     * @param {Object} language - Language object
     * @returns {Object} Saved language
     */
    async saveLanguage(language) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.LANGUAGES], 'readwrite');
            const store = tx.objectStore(STORES.LANGUAGES);
            const request = store.put(language);
            
            request.onsuccess = () => {
                console.log(`💾 Saved language: ${language.name}`);
                resolve(language);
            };
            
            request.onerror = () => {
                console.error('❌ Error saving language:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Get all languages
     * @returns {Array} Array of language objects
     */
    async getAllLanguages() {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.LANGUAGES], 'readonly');
            const store = tx.objectStore(STORES.LANGUAGES);
            const request = store.getAll();
            
            request.onsuccess = () => {
                console.log(`🌍 Retrieved ${request.result.length} languages`);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('❌ Error retrieving languages:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Get language by code
     * @param {String} code - Language code (e.g., 'fr', 'el')
     * @returns {Object|null} Language object or null
     */
    async getLanguageByCode(code) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.LANGUAGES], 'readonly');
            const store = tx.objectStore(STORES.LANGUAGES);
            const index = store.index('code');
            const request = index.get(code);
            
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
    
    // ============================================================================
    // SYNC QUEUE OPERATIONS
    // ============================================================================
    
    /**
     * Add operation to sync queue
     * @param {Object} operation - Operation to queue
     * @returns {Number} Queue item ID
     */
    async queueSync(operation) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
            const store = tx.objectStore(STORES.SYNC_QUEUE);
            
            const syncItem = {
                type: operation.type, // 'CREATE', 'UPDATE', 'DELETE'
                entity: operation.entity, // 'flashcard', 'language'
                entityId: operation.entityId,
                data: operation.data,
                timestamp: new Date().toISOString(),
                retries: 0,
                lastError: null
            };
            
            const request = store.add(syncItem);
            
            request.onsuccess = () => {
                console.log(`📤 Queued sync: ${operation.type} ${operation.entity} (ID: ${request.result})`);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('❌ Error queueing sync:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Get all pending sync operations
     * @returns {Array} Array of sync operations
     */
    async getSyncQueue() {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readonly');
            const store = tx.objectStore(STORES.SYNC_QUEUE);
            const request = store.getAll();
            
            request.onsuccess = () => {
                console.log(`📋 Retrieved ${request.result.length} pending sync operations`);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('❌ Error retrieving sync queue:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Remove operation from sync queue
     * @param {Number} id - Queue item ID
     */
    async removeSyncOperation(id) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
            const store = tx.objectStore(STORES.SYNC_QUEUE);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log(`✅ Removed sync operation: ${id}`);
                resolve();
            };
            
            request.onerror = () => {
                console.error('❌ Error removing sync operation:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Update sync operation (for retry tracking)
     * @param {Number} id - Queue item ID
     * @param {Object} updates - Fields to update
     */
    async updateSyncOperation(id, updates) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
            const store = tx.objectStore(STORES.SYNC_QUEUE);
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const operation = getRequest.result;
                if (operation) {
                    Object.assign(operation, updates);
                    const putRequest = store.put(operation);
                    
                    putRequest.onsuccess = () => {
                        console.log(`📝 Updated sync operation: ${id}`);
                        resolve(operation);
                    };
                    
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Operation not found'));
                }
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }
    
    /**
     * Clear all sync queue items
     */
    async clearSyncQueue() {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
            const store = tx.objectStore(STORES.SYNC_QUEUE);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('🧹 Cleared sync queue');
                resolve();
            };
            
            request.onerror = () => {
                console.error('❌ Error clearing sync queue:', request.error);
                reject(request.error);
            };
        });
    }
    
    // ============================================================================
    // PREFERENCES OPERATIONS
    // ============================================================================
    
    /**
     * Save preference
     * @param {String} key - Preference key
     * @param {*} value - Preference value
     */
    async savePreference(key, value) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.PREFERENCES], 'readwrite');
            const store = tx.objectStore(STORES.PREFERENCES);
            const request = store.put({ 
                key, 
                value, 
                updated_at: new Date().toISOString() 
            });
            
            request.onsuccess = () => {
                console.log(`⚙️ Saved preference: ${key}`);
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Get preference
     * @param {String} key - Preference key
     * @returns {*} Preference value or null
     */
    async getPreference(key) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.PREFERENCES], 'readonly');
            const store = tx.objectStore(STORES.PREFERENCES);
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    // ============================================================================
    // METADATA OPERATIONS
    // ============================================================================
    
    /**
     * Save metadata (sync status, timestamps, etc.)
     * @param {String} key - Metadata key
     * @param {*} value - Metadata value
     */
    async saveMetadata(key, value) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.METADATA], 'readwrite');
            const store = tx.objectStore(STORES.METADATA);
            const request = store.put({ 
                key, 
                value, 
                updated_at: new Date().toISOString() 
            });
            
            request.onsuccess = () => {
                console.log(`📊 Saved metadata: ${key}`);
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Get metadata
     * @param {String} key - Metadata key
     * @returns {*} Metadata value or null
     */
    async getMetadata(key) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.METADATA], 'readonly');
            const store = tx.objectStore(STORES.METADATA);
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    // ============================================================================
    // UTILITY OPERATIONS
    // ============================================================================
    
    /**
     * Get database statistics
     * @returns {Object} Database stats
     */
    async getStats() {
        await this.ensureInitialized();
        
        const flashcards = await this.getAllFlashcards();
        const languages = await this.getAllLanguages();
        const syncQueue = await this.getSyncQueue();
        
        return {
            flashcards: flashcards.length,
            languages: languages.length,
            syncQueue: syncQueue.length,
            lastSync: await this.getMetadata('last_sync_time')
        };
    }
    
    /**
     * Clear all data (for testing/reset)
     */
    async clearAll() {
        await this.ensureInitialized();
        
        const stores = [
            STORES.FLASHCARDS,
            STORES.LANGUAGES,
            STORES.PREFERENCES,
            STORES.SYNC_QUEUE,
            STORES.METADATA
        ];
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(stores, 'readwrite');
            
            stores.forEach(storeName => {
                tx.objectStore(storeName).clear();
            });
            
            tx.oncomplete = () => {
                console.log('🧹 All IndexedDB data cleared');
                resolve();
            };
            
            tx.onerror = () => {
                console.error('❌ Error clearing data:', tx.error);
                reject(tx.error);
            };
        });
    }
    
    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initPromise = null;
            console.log('🔒 IndexedDB connection closed');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OfflineDatabase, STORES };
}

console.log('📦 IndexedDB module loaded');
/**
 * Sync Manager
 * Handles synchronization between IndexedDB and server
 * 
 * Features:
 * - Automatic background sync every 5 minutes
 * - Online/offline detection
 * - Conflict resolution (last-write-wins)
 * - Retry failed operations
 * - Visual sync status updates
 */

class SyncManager {
    constructor(offlineDB) {
        this.db = offlineDB;
        this.syncing = false;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.onlineStatusHandler = null;
        this.syncIntervalMinutes = 5; // Sync every 5 minutes
    }
    
    /**
     * Initialize sync manager
     */
    async init() {
        console.log('🔄 Initializing sync manager...');
        
        // Load last sync time
        this.lastSyncTime = await this.db.getMetadata('last_sync_time');
        
        if (this.lastSyncTime) {
            console.log(`📅 Last sync: ${new Date(this.lastSyncTime).toLocaleString()}`);
        }
        
        // Set up online/offline event listeners
        this.setupOnlineHandlers();
        
        // Start periodic sync check (every 5 minutes when online)
        this.syncInterval = setInterval(() => {
            if (navigator.onLine && !this.syncing) {
                console.log('⏰ Periodic sync triggered');
                this.sync();
            }
        }, this.syncIntervalMinutes * 60 * 1000);
        
        // Initial sync if online
        if (navigator.onLine) {
            console.log('🌐 Online - performing initial sync');
            await this.sync();
        } else {
            console.log('📴 Offline - sync will happen when connection restored');
        }
        
        console.log('✅ Sync manager initialized');
    }
    
    /**
     * Set up online/offline event handlers
     */
    setupOnlineHandlers() {
        this.onlineStatusHandler = async () => {
            const status = navigator.onLine ? 'online' : 'offline';
            console.log(`📡 Network status changed: ${status.toUpperCase()}`);
            
            // Update UI
            this.updateSyncStatus(status);
            
            // Sync when coming back online
            if (navigator.onLine && !this.syncing) {
                console.log('🔄 Connection restored - syncing...');
                await this.sync();
            }
        };
        
        window.addEventListener('online', this.onlineStatusHandler);
        window.addEventListener('offline', this.onlineStatusHandler);
        
        // Initial status
        this.updateSyncStatus(navigator.onLine ? 'online' : 'offline');
    }
    
    /**
     * Update sync status in UI
     * @param {String} status - Status: 'online', 'offline', 'syncing', 'error'
     */
    updateSyncStatus(status) {
        const statusElement = document.getElementById('sync-status');
        if (!statusElement) return;
        
        const statusConfig = {
            online: { icon: '🟢', text: 'Online', class: 'online' },
            offline: { icon: '🔴', text: 'Offline', class: 'offline' },
            syncing: { icon: '🔄', text: 'Syncing...', class: 'syncing' },
            error: { icon: '⚠️', text: 'Sync Error', class: 'error' }
        };
        
        const config = statusConfig[status] || statusConfig.offline;
        statusElement.innerHTML = `${config.icon} ${config.text}`;
        statusElement.className = `sync-status ${config.class}`;
        
        // Update last sync time
        const lastSyncElement = document.getElementById('last-sync-time');
        if (lastSyncElement && this.lastSyncTime) {
            const timeAgo = this.getTimeAgo(new Date(this.lastSyncTime));
            lastSyncElement.textContent = `Last synced: ${timeAgo}`;
        }
    }
    
    /**
     * Get human-readable time ago
     * @param {Date} date - Date to compare
     * @returns {String} Time ago string
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
    
    /**
     * Main sync function
     * Two-way sync:
     * 1. Upload local changes to server (sync queue)
     * 2. Download server changes to local (full sync)
     */
    async sync() {
        if (this.syncing) {
            console.log('⏳ Sync already in progress, skipping...');
            return;
        }
        
        if (!navigator.onLine) {
            console.log('📴 Offline - skipping sync');
            return;
        }
        
        this.syncing = true;
        this.updateSyncStatus('syncing');
        
        const syncStartTime = Date.now();
        
        try {
            console.log('╔════════════════════════════════════════╗');
            console.log('║          SYNC STARTED                  ║');
            console.log('╚════════════════════════════════════════╝');
            
            // Step 1: Process sync queue (upload local changes)
            const uploadResult = await this.processSyncQueue();
            console.log(`📤 Upload phase: ${uploadResult.success} succeeded, ${uploadResult.failed} failed`);
            
            // Step 2: Download changes from server
            const downloadResult = await this.downloadServerChanges();
            console.log(`📥 Download phase: ${downloadResult.flashcards} flashcards, ${downloadResult.languages} languages`);
            
            // Update last sync time
            this.lastSyncTime = new Date().toISOString();
            await this.db.saveMetadata('last_sync_time', this.lastSyncTime);
            
            const syncDuration = ((Date.now() - syncStartTime) / 1000).toFixed(2);
            
            console.log('╔════════════════════════════════════════╗');
            console.log(`║     SYNC COMPLETE (${syncDuration}s)           ║`);
            console.log('╚════════════════════════════════════════╝');
            
            this.updateSyncStatus('online');
            
        } catch (error) {
            console.error('❌ Sync error:', error);
            this.updateSyncStatus('error');
            
            // Don't throw - allow app to continue working offline
        } finally {
            this.syncing = false;
        }
    }
    
    /**
     * Process sync queue (upload local changes to server)
     * @returns {Object} Result with success/failed counts
     */
    async processSyncQueue() {
        const queue = await this.db.getSyncQueue();
        
        if (queue.length === 0) {
            console.log('📭 No pending operations in sync queue');
            return { success: 0, failed: 0 };
        }
        
        console.log(`📋 Processing ${queue.length} queued operations...`);
        
        let successCount = 0;
        let failedCount = 0;
        
        for (const operation of queue) {
            try {
                console.log(`  ⚙️  Processing: ${operation.type} ${operation.entity} (ID: ${operation.entityId})`);
                
                await this.processSyncOperation(operation);
                await this.db.removeSyncOperation(operation.id);
                
                successCount++;
                console.log(`    ✅ Synced successfully`);
                
            } catch (error) {
                console.error(`    ❌ Failed: ${error.message}`);
                failedCount++;
                
                // Update retry count
                const newRetries = operation.retries + 1;
                await this.db.updateSyncOperation(operation.id, {
                    retries: newRetries,
                    lastError: error.message
                });
                
                // Give up after 5 retries
                if (newRetries >= 5) {
                    console.error(`    ⛔ Max retries reached, removing operation`);
                    await this.db.removeSyncOperation(operation.id);
                }
            }
        }
        
        return { success: successCount, failed: failedCount };
    }
    
    /**
     * Process a single sync operation
     * @param {Object} operation - Sync operation to process
     */
    async processSyncOperation(operation) {
        const { type, entity, entityId, data } = operation;
        
        if (entity === 'flashcard') {
            if (type === 'CREATE') {
                await this.createFlashcardOnServer(data);
            } else if (type === 'UPDATE') {
                await this.updateFlashcardOnServer(entityId, data);
            } else if (type === 'DELETE') {
                await this.deleteFlashcardOnServer(entityId);
            }
        } else if (entity === 'language') {
            if (type === 'CREATE') {
                await this.createLanguageOnServer(data);
            }
        }
    }
    
    /**
     * Create flashcard on server
     * @param {Object} flashcard - Flashcard data
     */
    async createFlashcardOnServer(flashcard) {
        const response = await fetch('/api/flashcards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flashcard)
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const serverFlashcard = await response.json();
        
        // Update local copy with server ID if different (temp ID -> real ID)
        if (serverFlashcard.id !== flashcard.id) {
            await this.db.deleteFlashcard(flashcard.id);
            await this.db.saveFlashcard(serverFlashcard);
            console.log(`    🔄 Updated temp ID ${flashcard.id} to server ID ${serverFlashcard.id}`);
        }
    }
    
    /**
     * Update flashcard on server
     * @param {Number} id - Flashcard ID
     * @param {Object} flashcard - Updated flashcard data
     */
    async updateFlashcardOnServer(id, flashcard) {
        const response = await fetch(`/api/flashcards/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flashcard)
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const serverFlashcard = await response.json();
        await this.db.saveFlashcard(serverFlashcard);
    }
    
    /**
     * Delete flashcard on server
     * @param {Number} id - Flashcard ID
     */
    async deleteFlashcardOnServer(id) {
        const response = await fetch(`/api/flashcards/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
    }
    
    /**
     * Create language on server
     * @param {Object} language - Language data
     */
    async createLanguageOnServer(language) {
        const response = await fetch('/api/languages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(language)
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const serverLanguage = await response.json();
        
        // Update with server ID if different
        if (serverLanguage.id !== language.id) {
            await this.db.saveLanguage(serverLanguage);
        }
    }
    
    /**
     * Download changes from server (full sync)
     * @returns {Object} Result with counts
     */
    async downloadServerChanges() {
        console.log('📥 Downloading server changes...');
        
        let flashcardsCount = 0;
        let languagesCount = 0;
        
        try {
            // Get flashcards from server
            const flashcardsResponse = await fetch('/api/flashcards');
            if (flashcardsResponse.ok) {
                const serverFlashcards = await flashcardsResponse.json();
                
                // Get local flashcards for comparison
                const localFlashcards = await this.db.getAllFlashcards();
                const localMap = new Map(localFlashcards.map(c => [c.id, c]));
                
                // Update/add server flashcards
                let updated = 0;
                let added = 0;
                
                for (const serverCard of serverFlashcards) {
                    const localCard = localMap.get(serverCard.id);
                    
                    // Conflict resolution: last-write-wins based on updated_at
                    if (!localCard) {
                        await this.db.saveFlashcard(serverCard);
                        added++;
                    } else if (new Date(serverCard.updated_at) > new Date(localCard.updated_at)) {
                        await this.db.saveFlashcard(serverCard);
                        updated++;
                    }
                    // If local is newer, keep local (will be uploaded in next sync)
                }
                
                flashcardsCount = serverFlashcards.length;
                console.log(`  📚 Flashcards: ${added} added, ${updated} updated`);
            }
        } catch (error) {
            console.error('  ❌ Error downloading flashcards:', error);
        }
        
        try {
            // Get languages from server
            const languagesResponse = await fetch('/api/languages');
            if (languagesResponse.ok) {
                const serverLanguages = await languagesResponse.json();
                
                for (const language of serverLanguages) {
                    await this.db.saveLanguage(language);
                }
                
                languagesCount = serverLanguages.length;
                console.log(`  🌍 Languages: ${languagesCount} synced`);
            }
        } catch (error) {
            console.error('  ❌ Error downloading languages:', error);
        }
        
        return { flashcards: flashcardsCount, languages: languagesCount };
    }
    
    /**
     * Force immediate sync
     * Useful for manual sync button
     */
    async forceSync() {
        console.log('🔄 Manual sync triggered');
        await this.sync();
    }
    
    /**
     * Get sync status information
     * @returns {Object} Sync status
     */
    async getSyncStatus() {
        const queue = await this.db.getSyncQueue();
        const stats = await this.db.getStats();
        
        return {
            online: navigator.onLine,
            syncing: this.syncing,
            lastSync: this.lastSyncTime,
            pendingOperations: queue.length,
            stats: stats
        };
    }
    
    /**
     * Cleanup - remove event listeners
     */
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            console.log('⏱️ Stopped periodic sync');
        }
        
        if (this.onlineStatusHandler) {
            window.removeEventListener('online', this.onlineStatusHandler);
            window.removeEventListener('offline', this.onlineStatusHandler);
            console.log('📡 Removed network listeners');
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SyncManager };
}

console.log('🔄 Sync manager module loaded');
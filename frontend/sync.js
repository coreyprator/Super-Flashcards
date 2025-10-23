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
     * Batch save flashcards to IndexedDB
     * Reduces UI blocking by processing in chunks
     */
    async saveBatch(cards, currentIndex = 0, total = 0) {
        const promises = cards.map(card => this.db.saveFlashcard(card));
        await Promise.all(promises);
        
        // Update progress UI if in initial sync
        if (total > 0) {
            this.updateSyncProgress(currentIndex + cards.length, total);
        }
        
        // Brief yield to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    /**
     * Update sync progress UI
     */
    updateSyncProgress(current, total) {
        const overlay = document.getElementById('sync-loading-overlay');
        const progressBar = document.getElementById('sync-progress-bar');
        const statsText = document.getElementById('sync-stats');
        
        if (overlay && progressBar && statsText) {
            const percentage = Math.round((current / total) * 100);
            progressBar.style.width = `${percentage}%`;
            statsText.textContent = `${current} / ${total} flashcards`;
        }
    }
    
    /**
     * Show sync loading overlay
     */
    showSyncOverlay() {
        const overlay = document.getElementById('sync-loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }
    
    /**
     * Hide sync loading overlay
     */
    hideSyncOverlay() {
        const overlay = document.getElementById('sync-loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
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
            // DON'T await the sync - let it run in background after first 10 cards
            // This allows the UI to initialize immediately
            this.sync().then(() => {
                console.log('✅ Background sync completed');
            }).catch(err => {
                console.error('❌ Background sync failed:', err);
            });
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
            
            // IMPORTANT: If progressive loading started, wait for it to complete
            if (this._backgroundLoadingPromise) {
                console.log('⏳ Waiting for background loading to complete...');
                try {
                    await this._backgroundLoadingPromise;
                    console.log('✅ Background loading finished, sync truly complete');
                } catch (error) {
                    console.warn('⚠️  Background loading had errors but sync continues:', error);
                }
            }
            
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
            credentials: 'include',  // Include Basic Auth credentials
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
            credentials: 'include',  // Include Basic Auth credentials
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
            method: 'DELETE',
            credentials: 'include'  // Include Basic Auth credentials
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
            credentials: 'include',  // Include Basic Auth credentials
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
        
        // Mark performance start
        performance.mark('sync-start');
        
        let flashcardsCount = 0;
        let languagesCount = 0;
        
        try {
            // Check if this is first-time user (no local data = first time, regardless of localStorage)
            const localFlashcards = await this.db.getAllFlashcards();
            const hasNoLocalData = localFlashcards.length === 0;
            
            if (hasNoLocalData) {
                console.log('👋 First-time user detected (0 local flashcards) - using progressive loading');
                return await this.progressiveFirstTimeSync();
            }
            
            // Returning user or incremental sync - use normal flow
            console.log('🔄 Returning user - checking for updates');
            
            // Get flashcards from server
            const flashcardsResponse = await fetch('/api/flashcards', {
                credentials: 'include'
            });
            if (flashcardsResponse.ok) {
                const serverFlashcards = await flashcardsResponse.json();
                const localMap = new Map(localFlashcards.map(c => [c.id, c]));
                
                // Update/add server flashcards - BATCH MODE
                let updated = 0;
                let added = 0;
                
                // Batch size for IndexedDB operations
                const BATCH_SIZE = 50;
                const cardsToSave = [];
                
                for (const serverCard of serverFlashcards) {
                    const localCard = localMap.get(serverCard.id);
                    
                    // Conflict resolution: last-write-wins based on updated_at
                    if (!localCard) {
                        cardsToSave.push(serverCard);
                        added++;
                    } else if (new Date(serverCard.updated_at) > new Date(localCard.updated_at)) {
                        cardsToSave.push(serverCard);
                        updated++;
                    }
                }
                
                // Show sync overlay only if significant updates (>20 cards)
                const needsProgressUI = cardsToSave.length > 20;
                if (needsProgressUI) {
                    this.showSyncOverlay();
                }
                
                // Process in batches
                let processed = 0;
                const totalToSave = cardsToSave.length;
                
                while (cardsToSave.length > 0) {
                    const batch = cardsToSave.splice(0, BATCH_SIZE);
                    await this.saveBatch(batch, processed, totalToSave);
                    processed += batch.length;
                }
                
                if (needsProgressUI) {
                    this.hideSyncOverlay();
                }
                
                flashcardsCount = serverFlashcards.length;
                console.log(`  📚 Flashcards: ${added} added, ${updated} updated`);
                
                // Show toast if updates were found
                if (added > 0 && window.firstTimeLoader) {
                    window.firstTimeLoader.showToast(`✨ ${added} new flashcard${added > 1 ? 's' : ''} available!`);
                }
            }
        } catch (error) {
            console.error('  ❌ Error downloading flashcards:', error);
            this.hideSyncOverlay();
        }
        
        try {
            // Get languages from server
            const languagesResponse = await fetch('/api/languages', {
                credentials: 'include'
            });
            if (languagesResponse.ok) {
                const serverLanguages = await languagesResponse.json();
                
                for (const language of serverLanguages) {
                    try {
                        await this.db.saveLanguage(language);
                        languagesCount++;
                    } catch (error) {
                        if (error.name === 'ConstraintError') {
                            console.log(`  ⚠️ Skipping duplicate language: ${language.name} (${language.code})`);
                        } else {
                            throw error;
                        }
                    }
                }
                
                console.log(`  🌍 Languages: ${languagesCount} synced`);
            }
        } catch (error) {
            console.error('  ❌ Error downloading languages:', error);
        }
        
        // Mark performance end
        performance.mark('sync-end');
        performance.measure('sync-duration', 'sync-start', 'sync-end');
        const syncTime = performance.getEntriesByName('sync-duration')[0]?.duration || 0;
        console.log(`⏱️ Sync completed in ${(syncTime / 1000).toFixed(1)}s`);
        
        return { flashcards: flashcardsCount, languages: languagesCount };
    }
    
    /**
     * Progressive first-time sync with instant first card
     * @returns {Object} Result with counts
     */
    async progressiveFirstTimeSync() {
        console.log('\n🚀 ===== PROGRESSIVE FIRST-TIME SYNC =====');
        performance.mark('T13-progressive-sync-start');
        const syncStart = performance.now();
        
        // Track timing
        if (window.oauthTracker) {
            window.oauthTracker.start('initial-sync');
        }
        
        // Show first-time loading overlay
        if (window.firstTimeLoader) {
            window.firstTimeLoader.showLoadingOverlay();
        }
        
        try {
            // STEP 1: Load first 10 cards immediately (< 2 seconds)
            performance.mark('first-cards-start');
            if (window.oauthTracker) {
                window.oauthTracker.start('load-first-10-cards');
            }
            
            console.log('📦 STEP 1/2: Loading first 10 cards for immediate UI...');
            const firstBatchStart = performance.now();
            
            const firstBatchResponse = await fetch('/api/flashcards?limit=10&skip=0', {
                credentials: 'include'
            });
            
            if (!firstBatchResponse.ok) {
                throw new Error(`Failed to load flashcards: ${firstBatchResponse.status}`);
            }
            
            const firstBatch = await firstBatchResponse.json();
            const fetchTime = performance.now() - firstBatchStart;
            console.log(`📥 First batch fetched (${firstBatch.length} cards) in ${fetchTime.toFixed(2)}ms`);
            
            // Save first batch immediately
            const saveStart = performance.now();
            for (const card of firstBatch) {
                await this.db.saveFlashcard(card);
            }
            const saveTime = performance.now() - saveStart;
            console.log(`💾 First batch saved to IndexedDB in ${saveTime.toFixed(2)}ms`);
            
            if (window.oauthTracker) {
                window.oauthTracker.end('load-first-10-cards');
            }
            
            performance.mark('first-cards-end');
            performance.measure('first-cards', 'first-cards-start', 'first-cards-end');
            const firstCardsTime = performance.getEntriesByName('first-cards')[0]?.duration || 0;
            console.log(`⚡ First ${firstBatch.length} cards READY in ${(firstCardsTime / 1000).toFixed(3)}s`);
            
            // Update progress
            if (window.firstTimeLoader) {
                window.firstTimeLoader.updateProgress(10, 755); // Estimate total
            }
            
            // Mark that we have initial data cached
            localStorage.setItem('indexeddb-populated', 'true');
            
            // **CRITICAL: Dispatch event so UI can render immediately**
            console.log('🎯 Dispatching "first-cards-ready" event to UI...');
            window.dispatchEvent(new CustomEvent('first-cards-ready', {
                detail: { 
                    count: firstBatch.length,
                    timestamp: performance.now()
                }
            }));
            window.timingCheckpoint?.('T14-first-cards-ready', `First ${firstBatch.length} cards ready, UI can render now`);
            
            // STEP 2: Load remaining cards IN BACKGROUND (non-blocking)
            console.log('📥 STEP 2/2: Starting background load of remaining flashcards...');
            console.log('⚡ RETURNING CONTROL TO APP - User can start studying now!');
            
            // Store the promise so sync() can wait for it if needed
            this._backgroundLoadingPromise = this.loadRemainingCardsInBackground(10).then(() => {
                console.log('✅ Background loading complete!');
                window.dispatchEvent(new CustomEvent('background-sync-complete'));
                window.timingCheckpoint?.('T15-background-complete', 'All cards loaded in background');
                
                if (window.firstTimeLoader) {
                    window.firstTimeLoader.showCompletion();
                }
                if (window.oauthTracker) {
                    window.oauthTracker.end('load-remaining-cards');
                    window.oauthTracker.end('initial-sync');
                    window.oauthTracker.getReport();
                }
            }).catch(error => {
                console.error('❌ Background loading failed:', error);
                window.timingCheckpoint?.('T15-ERROR-background-failed', `Background loading error: ${error.message}`);
            });
            
            // RETURN IMMEDIATELY after first 10 cards
            // This allows the app to render and user to start studying
            const totalTime = performance.now() - syncStart;
            console.log(`⚡ Progressive sync initial phase complete in ${totalTime.toFixed(2)}ms`);
            console.log('🚀 ===== RETURNING CONTROL (${firstBatch.length} cards ready) =====\n');
            
            return { flashcards: firstBatch.length, languages: 0 };
            
        } catch (error) {
            const errorTime = performance.now() - syncStart;
            console.error(`❌ Progressive sync failed after ${errorTime.toFixed(2)}ms:`, error);
            
            if (window.oauthTracker) {
                window.oauthTracker.mark('sync-error');
                window.oauthTracker.end('initial-sync');
            }
            
            if (window.firstTimeLoader) {
                window.firstTimeLoader.hideLoadingOverlay();
            }
            
            window.timingCheckpoint?.('T14-ERROR-progressive-sync-failed', `Progressive sync error: ${error.message}`);
            
            throw error;
        }
    }
    
    /**
     * Load remaining cards in background (non-blocking helper)
     */
    async loadRemainingCardsInBackground(alreadyLoaded) {
        console.log(`\n📥 ===== BACKGROUND LOADING =====`);
        const bgStart = performance.now();
        
        if (window.oauthTracker) {
            window.oauthTracker.start('load-remaining-cards');
        }
        
        try {
            console.log(`📡 Fetching remaining flashcards (skip=${alreadyLoaded})...`);
            const fetchStart = performance.now();
            
            const allCardsResponse = await fetch(`/api/flashcards?limit=1000&skip=${alreadyLoaded}`, {
                credentials: 'include'
            });
            
            if (allCardsResponse.ok) {
                const remainingCards = await allCardsResponse.json();
                const fetchTime = performance.now() - fetchStart;
                const totalCards = alreadyLoaded + remainingCards.length;
                
                console.log(`📊 Fetched ${remainingCards.length} remaining cards in ${fetchTime.toFixed(2)}ms`);
                console.log(`📊 Total flashcards: ${totalCards} (${alreadyLoaded} already loaded, ${remainingCards.length} remaining)`);
                
                // Update progress with actual total
                if (window.firstTimeLoader) {
                    window.firstTimeLoader.updateProgress(alreadyLoaded, totalCards);
                }
                
                // Batch save remaining cards
                console.log(`💾 Saving ${remainingCards.length} cards in batches...`);
                const BATCH_SIZE = 50;
                let processed = alreadyLoaded;
                const saveStart = performance.now();
                
                for (let i = 0; i < remainingCards.length; i += BATCH_SIZE) {
                    const batch = remainingCards.slice(i, i + BATCH_SIZE);
                    const batchStart = performance.now();
                    
                    // Save batch in parallel
                    await Promise.all(batch.map(card => this.db.saveFlashcard(card)));
                    
                    processed += batch.length;
                    const batchTime = performance.now() - batchStart;
                    
                    // Log progress every batch
                    console.log(`   💾 Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} cards saved in ${batchTime.toFixed(2)}ms (${processed}/${totalCards})`);
                    
                    // Update progress
                    if (window.firstTimeLoader) {
                        window.firstTimeLoader.updateProgress(processed, totalCards);
                    }
                    
                    // Yield to main thread to prevent blocking UI
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                
                const saveTime = performance.now() - saveStart;
                const totalTime = performance.now() - bgStart;
                
                console.log(`✅ All ${remainingCards.length} remaining cards saved in ${saveTime.toFixed(2)}ms`);
                console.log(`✅ Background loading COMPLETE in ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(3)}s)`);
                console.log(`📥 ===== BACKGROUND LOADING DONE (${totalCards} total cards) =====\n`);
                
                return totalCards;
            }
            
            return alreadyLoaded;
        } catch (error) {
            const errorTime = performance.now() - bgStart;
            console.error(`❌ Background loading failed after ${errorTime.toFixed(2)}ms:`, error);
            
            if (window.oauthTracker) {
                window.oauthTracker.mark('sync-error');
                window.oauthTracker.end('initial-sync');
            }
            
            if (window.firstTimeLoader) {
                window.firstTimeLoader.hideLoadingOverlay();
            }
            
            throw error;
        }
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
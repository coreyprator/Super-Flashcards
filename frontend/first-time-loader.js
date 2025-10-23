/**
 * First-Time User Experience
 * Handles progressive loading with feedback for new users
 */

class FirstTimeLoader {
    constructor() {
        this.ONBOARDING_KEY = 'onboarding_v1_complete';
        this.startTime = null;
        this.loadedCount = 0;
        this.totalCount = 0;
    }
    
    /**
     * Check if this is a first-time user
     */
    isFirstTime() {
        return !localStorage.getItem(this.ONBOARDING_KEY);
    }
    
    /**
     * Mark onboarding as complete
     */
    completeOnboarding() {
        localStorage.setItem(this.ONBOARDING_KEY, Date.now());
        console.log('✅ Onboarding complete!');
    }
    
    /**
     * Show loading overlay
     */
    showLoadingOverlay() {
        const overlay = document.getElementById('first-time-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.startTime = performance.now();
        }
    }
    
    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('first-time-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            
            const totalTime = ((performance.now() - this.startTime) / 1000).toFixed(1);
            console.log(`⏱️ First-time setup completed in ${totalTime}s`);
        }
    }
    
    /**
     * Update progress display
     */
    updateProgress(loaded, total) {
        this.loadedCount = loaded;
        this.totalCount = total;
        
        const percentage = Math.round((loaded / total) * 100);
        
        // Update progress bar
        const progressBar = document.getElementById('first-time-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        // Update count text
        const countText = document.getElementById('first-time-count');
        if (countText) {
            countText.textContent = `${loaded} / ${total} flashcards`;
        }
        
        // Calculate and show ETA
        if (loaded > 5) { // Wait for some samples
            const elapsed = performance.now() - this.startTime;
            const rate = loaded / elapsed; // cards per ms
            const remaining = total - loaded;
            const etaMs = remaining / rate;
            const etaSec = Math.round(etaMs / 1000);
            
            const etaText = document.getElementById('first-time-eta');
            if (etaText && etaSec > 0) {
                etaText.textContent = `About ${etaSec}s remaining`;
            }
        }
        
        // Update stage message
        const stageText = document.getElementById('first-time-stage');
        if (stageText) {
            if (percentage < 25) {
                stageText.textContent = 'Loading your flashcards...';
            } else if (percentage < 75) {
                stageText.textContent = 'Building your vocabulary library...';
            } else if (percentage < 95) {
                stageText.textContent = 'Almost ready...';
            } else {
                stageText.textContent = 'Finalizing setup...';
            }
        }
    }
    
    /**
     * Show completion message
     */
    showCompletion() {
        const totalTime = ((performance.now() - this.startTime) / 1000).toFixed(1);
        
        // Update overlay to show success
        const stageText = document.getElementById('first-time-stage');
        if (stageText) {
            stageText.textContent = '🎉 All set! Your flashcards are ready for offline use.';
        }
        
        // Hide after brief delay
        setTimeout(() => {
            this.hideLoadingOverlay();
            this.completeOnboarding();
            
            // Show toast notification
            this.showToast(`✨ Setup complete in ${totalTime}s! Your flashcards are now available offline.`);
        }, 1500);
    }
    
    /**
     * Show toast notification
     */
    showToast(message) {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    /**
     * Prefetch next N cards' assets
     */
    prefetchNextCards(flashcards, currentIndex, count = 3) {
        const nextCards = flashcards.slice(currentIndex + 1, currentIndex + 1 + count);
        
        nextCards.forEach(card => {
            // Prefetch image
            if (card.image_url) {
                const img = new Image();
                img.src = fixAssetUrl(card.image_url);
                console.log(`🖼️ Prefetching image: ${card.front_text}`);
            }
            
            // Prefetch audio
            if (card.audio_url && window.audioPlayer) {
                window.audioPlayer.cacheAudio(fixAssetUrl(card.audio_url), card.id)
                    .catch(err => console.warn('Failed to prefetch audio:', err));
            }
        });
    }
}

// Global instance
const firstTimeLoader = new FirstTimeLoader();

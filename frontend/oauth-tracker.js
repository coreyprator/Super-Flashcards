/**
 * OAuth Performance Tracker
 * Comprehensive timing analysis for OAuth flow and app initialization
 * 
 * Usage:
 *   window.oauthTracker.start('action-name');
 *   window.oauthTracker.end('action-name');
 *   window.oauthTracker.mark('event-name');
 *   window.oauthTracker.getReport();
 */

class OAuthPerformanceTracker {
    constructor() {
        this.events = [];
        this.startTime = null;
        this.phases = {};
    }
    
    /**
     * Start timing an action
     */
    start(action) {
        const timestamp = performance.now();
        this.startTime = this.startTime || timestamp;
        
        this.events.push({
            action,
            timestamp,
            elapsed: timestamp - this.startTime,
            type: 'start'
        });
        
        // Also use Performance API
        performance.mark(`${action}-start`);
        
        console.log(`⏱️ [${this.formatTime(timestamp - this.startTime)}] ▶️  START: ${action}`);
    }
    
    /**
     * End timing an action
     */
    end(action) {
        const timestamp = performance.now();
        const startEvent = this.events.find(e => e.action === action && e.type === 'start');
        const duration = startEvent ? timestamp - startEvent.timestamp : 0;
        
        this.events.push({
            action,
            timestamp,
            elapsed: timestamp - this.startTime,
            duration,
            type: 'end'
        });
        
        // Also use Performance API
        performance.mark(`${action}-end`);
        try {
            performance.measure(action, `${action}-start`, `${action}-end`);
        } catch (e) {
            // Ignore if marks don't exist
        }
        
        // Store phase duration
        this.phases[action] = duration;
        
        const icon = duration > 5000 ? '🐌' : duration > 1000 ? '⚠️' : '✅';
        console.log(`⏱️ [${this.formatTime(timestamp - this.startTime)}] ${icon} END: ${action} (took ${this.formatTime(duration)})`);
    }
    
    /**
     * Mark a point in time without duration
     */
    mark(event) {
        const timestamp = performance.now();
        this.events.push({
            action: event,
            timestamp,
            elapsed: timestamp - this.startTime,
            type: 'mark'
        });
        
        performance.mark(event);
        
        console.log(`⏱️ [${this.formatTime(timestamp - this.startTime)}] 📍 MARK: ${event}`);
    }
    
    /**
     * Format milliseconds to human-readable time
     */
    formatTime(ms) {
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
    }
    
    /**
     * Get comprehensive report
     */
    getReport() {
        console.group('📊 OAuth & App Performance Report');
        
        // Summary
        console.log('%c=== SUMMARY ===', 'font-weight: bold; font-size: 14px;');
        console.table(Object.entries(this.phases).map(([name, duration]) => ({
            Phase: name,
            Duration: this.formatTime(duration),
            Status: duration > 5000 ? '🐌 SLOW' : duration > 1000 ? '⚠️ OK' : '✅ FAST'
        })));
        
        // Detailed timeline
        console.log('%c=== TIMELINE ===', 'font-weight: bold; font-size: 14px;');
        console.table(this.events.map(e => ({
            Time: this.formatTime(e.elapsed),
            Type: e.type,
            Action: e.action,
            Duration: e.duration ? this.formatTime(e.duration) : '-'
        })));
        
        // Analysis
        console.log('%c=== ANALYSIS ===', 'font-weight: bold; font-size: 14px;');
        
        const totalTime = this.events[this.events.length - 1]?.elapsed || 0;
        console.log(`Total time: ${this.formatTime(totalTime)}`);
        
        // Find slowest phase
        const slowest = Object.entries(this.phases).sort((a, b) => b[1] - a[1])[0];
        if (slowest) {
            console.log(`Slowest phase: ${slowest[0]} (${this.formatTime(slowest[1])})`);
        }
        
        // OAuth vs Sync breakdown
        const oauthTime = this.phases['oauth-flow'] || 0;
        const syncTime = this.phases['initial-sync'] || 0;
        const firstCardTime = this.phases['load-first-card'] || 0;
        
        console.log('%c=== BREAKDOWN ===', 'font-weight: bold; font-size: 14px;');
        console.log(`OAuth flow: ${this.formatTime(oauthTime)}`);
        console.log(`Initial sync: ${this.formatTime(syncTime)}`);
        console.log(`First card load: ${this.formatTime(firstCardTime)}`);
        
        if (oauthTime > 10000) {
            console.warn('⚠️ OAuth is taking longer than expected (>10s)');
        }
        if (syncTime > 10000) {
            console.warn('⚠️ Initial sync is taking longer than expected (>10s)');
        }
        
        console.groupEnd();
        
        return {
            events: this.events,
            phases: this.phases,
            totalTime,
            summary: {
                oauth: oauthTime,
                sync: syncTime,
                firstCard: firstCardTime
            }
        };
    }
    
    /**
     * Export data for analysis
     */
    export() {
        return JSON.stringify({
            events: this.events,
            phases: this.phases,
            browser: navigator.userAgent,
            timestamp: new Date().toISOString()
        }, null, 2);
    }
    
    /**
     * Reset tracker
     */
    reset() {
        this.events = [];
        this.phases = {};
        this.startTime = null;
        console.log('🔄 Performance tracker reset');
    }
}

// Create global instance
window.oauthTracker = new OAuthPerformanceTracker();

// Auto-start tracking on page load
if (document.readyState === 'loading') {
    window.oauthTracker.mark('page-loading');
} else {
    window.oauthTracker.mark('page-ready');
}

document.addEventListener('DOMContentLoaded', () => {
    window.oauthTracker.mark('dom-content-loaded');
});

window.addEventListener('load', () => {
    window.oauthTracker.mark('window-loaded');
});

console.log('✅ OAuth Performance Tracker initialized');
console.log('   Use: window.oauthTracker.getReport() to see timing data');

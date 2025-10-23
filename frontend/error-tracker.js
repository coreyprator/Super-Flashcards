/**
 * Global Error Tracker
 * Catches unhandled errors, promise rejections, and resource load failures
 * to identify silent failures that may be causing delays
 */

class ErrorTracker {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.setupGlobalHandlers();
        console.log('🛡️ Error Tracker initialized');
    }
    
    setupGlobalHandlers() {
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const timestamp = performance.now();
            const error = {
                type: 'unhandled-rejection',
                reason: event.reason?.message || event.reason,
                stack: event.reason?.stack,
                timestamp: timestamp,
                timeFormatted: (timestamp / 1000).toFixed(3) + 's',
                isoTime: new Date().toISOString()
            };
            
            this.errors.push(error);
            
            console.error('🚨 UNHANDLED PROMISE REJECTION at', error.timeFormatted);
            console.error('   Reason:', error.reason);
            console.error('   Stack:', error.stack);
            console.error('   Time:', error.isoTime);
        });
        
        // Catch synchronous errors
        window.addEventListener('error', (event) => {
            // Skip if this is a resource error (handled separately)
            if (event.target !== window) return;
            
            const timestamp = performance.now();
            const error = {
                type: 'uncaught-error',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: timestamp,
                timeFormatted: (timestamp / 1000).toFixed(3) + 's',
                isoTime: new Date().toISOString()
            };
            
            this.errors.push(error);
            
            console.error('🚨 UNCAUGHT ERROR at', error.timeFormatted);
            console.error('   Message:', error.message);
            console.error('   Source:', error.source, 'Line:', error.line, 'Col:', error.column);
            console.error('   Stack:', error.stack);
            console.error('   Time:', error.isoTime);
        });
        
        // Catch resource loading errors (scripts, stylesheets, images)
        window.addEventListener('error', (event) => {
            if (event.target instanceof HTMLScriptElement || 
                event.target instanceof HTMLLinkElement ||
                event.target instanceof HTMLImageElement) {
                
                const timestamp = performance.now();
                const resource = event.target.src || event.target.href;
                const error = {
                    type: 'resource-load-error',
                    resource: resource,
                    tagName: event.target.tagName,
                    timestamp: timestamp,
                    timeFormatted: (timestamp / 1000).toFixed(3) + 's',
                    isoTime: new Date().toISOString()
                };
                
                this.errors.push(error);
                
                console.error('🚨 RESOURCE LOAD FAILED at', error.timeFormatted);
                console.error('   Resource:', resource);
                console.error('   Tag:', error.tagName);
                console.error('   Time:', error.isoTime);
            }
        }, true); // Use capture phase to catch before other handlers
        
        // Catch console warnings (may indicate fallback behavior)
        const originalWarn = console.warn;
        console.warn = (...args) => {
            const timestamp = performance.now();
            this.warnings.push({
                message: args.join(' '),
                timestamp: timestamp,
                timeFormatted: (timestamp / 1000).toFixed(3) + 's',
                isoTime: new Date().toISOString()
            });
            originalWarn.apply(console, args);
        };
    }
    
    getErrors() {
        return this.errors;
    }
    
    getWarnings() {
        return this.warnings;
    }
    
    hasErrors() {
        return this.errors.length > 0;
    }
    
    hasWarnings() {
        return this.warnings.length > 0;
    }
    
    printReport() {
        console.log('\n' + '='.repeat(80));
        console.log('🛡️ ERROR TRACKER REPORT');
        console.log('='.repeat(80));
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ No errors or warnings detected!');
        } else {
            if (this.errors.length > 0) {
                console.log('\n🚨 ERRORS (' + this.errors.length + '):');
                console.table(this.errors.map(e => ({
                    Type: e.type,
                    Message: e.reason || e.message || e.resource,
                    Time: e.timeFormatted,
                    Source: e.source || e.tagName || 'N/A'
                })));
            }
            
            if (this.warnings.length > 0) {
                console.log('\n⚠️ WARNINGS (' + this.warnings.length + '):');
                console.table(this.warnings.map(w => ({
                    Message: w.message,
                    Time: w.timeFormatted
                })));
            }
        }
        
        console.log('='.repeat(80) + '\n');
    }
    
    // Check for common fallback scenarios
    detectFallbacks() {
        const fallbacks = [];
        
        // Check if IndexedDB is available
        if (!window.indexedDB) {
            fallbacks.push({
                type: 'indexeddb-unavailable',
                message: 'IndexedDB not available - app may use memory storage',
                severity: 'high'
            });
        }
        
        // Check if offline
        if (!navigator.onLine) {
            fallbacks.push({
                type: 'offline-mode',
                message: 'Browser is offline - using cached data only',
                severity: 'medium'
            });
        }
        
        // Check for storage errors (common when IndexedDB fails)
        const storageErrors = this.errors.filter(e => 
            e.message?.includes('storage') || 
            e.message?.includes('quota') ||
            e.message?.includes('IndexedDB')
        );
        
        if (storageErrors.length > 0) {
            fallbacks.push({
                type: 'storage-errors',
                message: 'Storage errors detected - IndexedDB may have failed',
                severity: 'high',
                count: storageErrors.length
            });
        }
        
        return fallbacks;
    }
}

// Initialize globally and expose to window
window.errorTracker = new ErrorTracker();

// Log initialization
console.log('🛡️ Error tracking active - all unhandled errors will be logged');

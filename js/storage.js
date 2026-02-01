// Mobile Tools - Storage Module
// Handles IndexedDB and localStorage for mobile app

const DB_NAME = 'MobileScraperDB';
const DB_VERSION = 1;
const STORE_NAME = 'scrapedMovies';
const SETTINGS_KEY = 'scraperSettings';

let db = null;

// ============================================================================
// IndexedDB Operations
// ============================================================================

/**
 * Initialize IndexedDB
 */
export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Failed to open IndexedDB'));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('✅ IndexedDB initialized');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create object store if it doesn't exist
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = database.createObjectStore(STORE_NAME, {
                    keyPath: 'id'
                });

                // Create indexes
                objectStore.createIndex('title', 'title', { unique: false });
                objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                objectStore.createIndex('info4_type', 'info4_type', { unique: false });

                console.log('✅ Object store created');
            }
        };
    });
}

/**
 * Save movies to IndexedDB
 */
export async function saveMovies(movies) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        let successCount = 0;
        let errorCount = 0;

        movies.forEach(movie => {
            const request = objectStore.put(movie);
            request.onsuccess = () => successCount++;
            request.onerror = () => errorCount++;
        });

        transaction.oncomplete = () => {
            console.log(`✅ Saved ${successCount} movies to IndexedDB`);
            resolve({ success: successCount, errors: errorCount });
        };

        transaction.onerror = () => {
            reject(new Error('Transaction failed'));
        };
    });
}

/**
 * Load all movies from IndexedDB
 */
export async function loadMovies() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            console.log(`✅ Loaded ${request.result.length} movies from IndexedDB`);
            resolve(request.result);
        };

        request.onerror = () => {
            reject(new Error('Failed to load movies'));
        };
    });
}

/**
 * Clear all movies from IndexedDB
 */
export async function clearMovies() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.clear();

        request.onsuccess = () => {
            console.log('✅ Cleared all movies from IndexedDB');
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to clear movies'));
        };
    });
}

/**
 * Get storage usage info
 */
export async function getStorageInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentUsed = quota > 0 ? (usage / quota * 100).toFixed(2) : 0;

        return {
            usage: formatBytes(usage),
            quota: formatBytes(quota),
            percentUsed: percentUsed,
            usageBytes: usage,
            quotaBytes: quota
        };
    }

    return {
        usage: 'Unknown',
        quota: 'Unknown',
        percentUsed: 0,
        usageBytes: 0,
        quotaBytes: 0
    };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// localStorage Operations (Settings)
// ============================================================================

/**
 * Save settings to localStorage
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        console.log('✅ Settings saved');
        return true;
    } catch (error) {
        console.error('❌ Failed to save settings:', error);
        return false;
    }
}

/**
 * Load settings from localStorage
 */
export function loadSettings() {
    try {
        const settings = localStorage.getItem(SETTINGS_KEY);
        return settings ? JSON.parse(settings) : getDefaultSettings();
    } catch (error) {
        console.error('❌ Failed to load settings:', error);
        return getDefaultSettings();
    }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
    return {
        theme: 'dark',
        proxyUrl: 'https://mobile-scraper-proxy.saimakanddo.workers.dev/',
        autoSave: true,
        notificationsEnabled: true,
        delayBetweenRequests: 500,
        lastWebsiteUrl: '',
        lastJsonUrl: '',
        mergePosition: 'append',
        scrapingDirection: 'start-to-end'
    };
}

// ============================================================================
// Export/Import JSON
// ============================================================================

/**
 * Export movies as JSON file
 */
export function exportJSON(movies, filename = 'scraped-movies.json') {
    try {
        const jsonString = JSON.stringify(movies, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        console.log('✅ JSON exported');
        return true;
    } catch (error) {
        console.error('❌ Failed to export JSON:', error);
        return false;
    }
}

/**
 * Import JSON from URL
 */
export async function importJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Invalid JSON format: expected an array');
        }

        console.log(`✅ Imported ${data.length} movies from JSON`);
        return data;
    } catch (error) {
        console.error('❌ Failed to import JSON:', error);
        throw error;
    }
}

/**
 * Copy JSON to clipboard
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            console.log('✅ Copied to clipboard');
            return true;
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (success) {
                console.log('✅ Copied to clipboard (fallback)');
                return true;
            }
            throw new Error('Copy failed');
        }
    } catch (error) {
        console.error('❌ Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Share using Web Share API (mobile)
 */
export async function shareJSON(movies, title = 'Scraped Movies') {
    try {
        if (navigator.share) {
            const jsonString = JSON.stringify(movies, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const file = new File([blob], 'movies.json', { type: 'application/json' });

            await navigator.share({
                title: title,
                text: `${movies.length} movies scraped`,
                files: [file]
            });

            console.log('✅ Shared successfully');
            return true;
        } else {
            throw new Error('Web Share API not supported');
        }
    } catch (error) {
        console.error('❌ Failed to share:', error);
        return false;
    }
}

export default {
    initDB,
    saveMovies,
    loadMovies,
    clearMovies,
    getStorageInfo,
    saveSettings,
    loadSettings,
    exportJSON,
    importJSON,
    copyToClipboard,
    shareJSON
};

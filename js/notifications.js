// Mobile Tools - Notifications Module
// Handles push notifications and notification permissions

let notificationPermission = 'default';

// ============================================================================
// Permission Management
// ============================================================================

/**
 * Check if notifications are supported
 */
export function isNotificationSupported() {
    return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus() {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestPermission() {
    if (!isNotificationSupported()) {
        throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        throw new Error('Notification permission denied');
    }

    const permission = await Notification.requestPermission();
    notificationPermission = permission;

    return permission;
}

// ============================================================================
// Show Notifications
// ============================================================================

/**
 * Show a simple notification
 */
export function showNotification(title, options = {}) {
    if (!isNotificationSupported()) {
        console.warn('Notifications not supported');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
    }

    const defaultOptions = {
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'mobile-scraper',
        requireInteraction: false
    };

    const notification = new Notification(title, {
        ...defaultOptions,
        ...options
    });

    return notification;
}

/**
 * Show scraping started notification
 */
export function notifyScrapingStarted(mode) {
    return showNotification('Scraping Started', {
        body: `Scraping in ${mode} mode`,
        icon: '/assets/icons/icon-192.png',
        tag: 'scraping-status'
    });
}

/**
 * Show scraping progress notification
 */
export function notifyProgress(current, total) {
    const percentage = Math.round((current / total) * 100);

    return showNotification('Scraping Progress', {
        body: `${current}/${total} pages scraped (${percentage}%)`,
        icon: '/assets/icons/icon-192.png',
        tag: 'scraping-progress',
        requireInteraction: false
    });
}

/**
 * Show scraping completed notification
 */
export function notifyScrapingCompleted(cardsScraped, duplicatesSkipped) {
    return showNotification('Scraping Completed! ✅', {
        body: `Scraped ${cardsScraped} movies, skipped ${duplicatesSkipped} duplicates`,
        icon: '/assets/icons/icon-192.png',
        tag: 'scraping-complete',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200]
    });
}

/**
 * Show scraping error notification
 */
export function notifyError(errorMessage) {
    return showNotification('Scraping Error ❌', {
        body: errorMessage,
        icon: '/assets/icons/icon-192.png',
        tag: 'scraping-error',
        requireInteraction: true
    });
}

// ============================================================================
// Service Worker Notifications (for background)
// ============================================================================

/**
 * Send notification via service worker (for background sync)
 */
export async function sendServiceWorkerNotification(title, options = {}) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;

        if (registration.showNotification) {
            return registration.showNotification(title, {
                icon: '/assets/icons/icon-192.png',
                badge: '/assets/icons/icon-192.png',
                vibrate: [200, 100, 200],
                ...options
            });
        }
    }

    // Fallback to regular notification
    return showNotification(title, options);
}

// ============================================================================
// Notification Click Handlers
// ============================================================================

/**
 * Setup notification click handlers
 */
export function setupNotificationHandlers() {
    if (!isNotificationSupported()) return;

    // Handle notification clicks (for regular notifications)
    // Service worker handles its own notification clicks

    console.log('✅ Notification handlers ready');
}

// ============================================================================
// Battery-Aware Notifications
// ============================================================================

/**
 * Check if device is in battery saver mode
 */
export async function isBatterySaverMode() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            return battery.level < 0.2 || battery.charging === false;
        } catch (error) {
            return false;
        }
    }
    return false;
}

/**
 * Show notification only if not in battery saver mode
 */
export async function showNotificationSmart(title, options = {}) {
    const batterySaver = await isBatterySaverMode();

    if (batterySaver) {
        console.log('⚡ Battery saver mode: notification suppressed');
        return null;
    }

    return showNotification(title, options);
}

export default {
    isNotificationSupported,
    getPermissionStatus,
    requestPermission,
    showNotification,
    notifyScrapingStarted,
    notifyProgress,
    notifyScrapingCompleted,
    notifyError,
    sendServiceWorkerNotification,
    setupNotificationHandlers,
    isBatterySaverMode,
    showNotificationSmart
};

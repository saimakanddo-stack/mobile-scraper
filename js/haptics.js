// Mobile Tools - Haptic Feedback Module
// Provides tactile feedback for user interactions

export const Haptics = {
    /**
     * Check if vibration API is supported
     */
    isSupported() {
        return 'vibrate' in navigator;
    },

    /**
     * Light haptic feedback (10ms)
     * Use for: button taps, selections
     */
    light() {
        if (this.isSupported()) {
            navigator.vibrate(10);
        }
    },

    /**
     * Medium haptic feedback (20ms)
     * Use for: toggle switches, checkboxes
     */
    medium() {
        if (this.isSupported()) {
            navigator.vibrate(20);
        }
    },

    /**
     * Heavy haptic feedback (50ms)
     * Use for: important actions, warnings
     */
    heavy() {
        if (this.isSupported()) {
            navigator.vibrate(50);
        }
    },

    /**
     * Success pattern (short-long-short)
     * Use for: successful operations
     */
    success() {
        if (this.isSupported()) {
            navigator.vibrate([10, 50, 10]);
        }
    },

    /**
     * Error pattern (long pulses)
     * Use for: errors, failures
     */
    error() {
        if (this.isSupported()) {
            navigator.vibrate([50, 100, 50, 100, 50]);
        }
    },

    /**
     * Warning pattern (medium pulses)
     * Use for: warnings, confirmations
     */
    warning() {
        if (this.isSupported()) {
            navigator.vibrate([30, 50, 30]);
        }
    },

    /**
     * Selection feedback (very light)
     * Use for: scrolling through lists, swiping
     */
    selection() {
        if (this.isSupported()) {
            navigator.vibrate(5);
        }
    },

    /**
     * Notification pattern
     * Use for: incoming notifications
     */
    notification() {
        if (this.isSupported()) {
            navigator.vibrate([100, 50, 100]);
        }
    },

    /**
     * Custom vibration pattern
     * @param {number[]} pattern - Array of vibration durations
     */
    custom(pattern) {
        if (this.isSupported() && Array.isArray(pattern)) {
            navigator.vibrate(pattern);
        }
    },

    /**
     * Stop all vibrations
     */
    stop() {
        if (this.isSupported()) {
            navigator.vibrate(0);
        }
    }
};

console.log('📳 Haptics Module Loaded');

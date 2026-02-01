// Mobile Tools - Battery Manager Module
// Optimizes app behavior based on battery status

export class BatteryManager {
    constructor() {
        this.battery = null;
        this.isLowPower = false;
        this.level = 1;
        this.charging = false;
        this.listeners = [];

        this.init();
    }

    async init() {
        if ('getBattery' in navigator) {
            try {
                this.battery = await navigator.getBattery();
                this.updateStatus();

                // Listen for battery changes
                this.battery.addEventListener('levelchange', () => this.updateStatus());
                this.battery.addEventListener('chargingchange', () => this.updateStatus());

                console.log('🔋 Battery Manager initialized');
            } catch (error) {
                console.warn('Battery API not available:', error);
            }
        } else {
            console.warn('Battery API not supported');
        }
    }

    updateStatus() {
        if (!this.battery) return;

        this.level = this.battery.level;
        this.charging = this.battery.charging;

        // Low power mode if battery < 20% and not charging
        const wasLowPower = this.isLowPower;
        this.isLowPower = this.level < 0.2 && !this.charging;

        console.log(`🔋 Battery: ${(this.level * 100).toFixed(0)}% ${this.charging ? '⚡ Charging' : ''}`);

        // Notify listeners if low power status changed
        if (wasLowPower !== this.isLowPower) {
            this.notifyListeners();
        }
    }

    /**
     * Check if device is in low power mode
     */
    shouldReduceActivity() {
        return this.isLowPower;
    }

    /**
     * Get optimal delay between operations based on battery status
     * @returns {number} Delay in milliseconds
     */
    getOptimalDelay() {
        if (this.isLowPower) {
            return 2000; // 2s delay in low power mode
        } else if (this.battery && !this.charging) {
            return 1000; // 1s delay on battery
        }
        return 500; // 500ms delay when charging or no battery info
    }

    /**
     * Get optimal batch size for operations
     * @returns {number} Number of items to process at once
     */
    getOptimalBatchSize() {
        if (this.isLowPower) {
            return 5; // Process 5 items at a time
        } else if (this.battery && !this.charging) {
            return 10; // Process 10 items at a time
        }
        return 20; // Process 20 items at a time when charging
    }

    /**
     * Check if notifications should be reduced
     */
    shouldReduceNotifications() {
        return this.isLowPower;
    }

    /**
     * Check if animations should be reduced
     */
    shouldReduceAnimations() {
        return this.isLowPower;
    }

    /**
     * Get battery level as percentage
     */
    getBatteryLevel() {
        return this.level * 100;
    }

    /**
     * Check if device is charging
     */
    isCharging() {
        return this.charging;
    }

    /**
     * Add listener for battery status changes
     * @param {Function} callback - Called when low power status changes
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     * @param {Function} callback - Callback to remove
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Notify all listeners of status change
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.isLowPower, this.level, this.charging);
            } catch (error) {
                console.error('Battery listener error:', error);
            }
        });
    }

    /**
     * Get battery info object
     */
    getInfo() {
        return {
            level: this.level,
            percentage: this.getBatteryLevel(),
            charging: this.charging,
            isLowPower: this.isLowPower,
            supported: this.battery !== null
        };
    }
}

// Singleton instance
export const batteryManager = new BatteryManager();

console.log('🔋 Battery Manager Module Loaded');

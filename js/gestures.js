// Mobile Tools - Touch Gestures Module
// Handles pull-to-refresh and swipe detection

// ============================================================================
// Pull-to-Refresh
// ============================================================================

export class PullToRefresh {
    constructor(container, onRefresh) {
        this.container = container;
        this.onRefresh = onRefresh;
        this.startY = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.threshold = 80;
        this.maxPull = 150;
        this.indicator = null;

        this.init();
    }

    init() {
        // Create pull indicator
        this.createIndicator();

        // Add touch listeners
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'pull-to-refresh';
        this.indicator.innerHTML = `
            <div class="pull-indicator">
                <span class="pull-icon">↓</span>
                <span class="pull-text">Pull to refresh</span>
            </div>
        `;
        this.container.insertBefore(this.indicator, this.container.firstChild);
    }

    handleTouchStart(e) {
        // Only activate if scrolled to top
        if (this.container.scrollTop === 0) {
            this.startY = e.touches[0].pageY;
            this.isDragging = true;
        }
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;

        this.currentY = e.touches[0].pageY;
        const diff = this.currentY - this.startY;

        // Only pull down
        if (diff > 0) {
            // Prevent default scrolling
            e.preventDefault();

            // Apply resistance
            const pullDistance = Math.min(diff / 2, this.maxPull);

            // Update container transform
            this.container.style.transform = `translateY(${pullDistance}px)`;

            // Update indicator
            if (pullDistance >= this.threshold) {
                this.indicator.classList.add('pulling');
                this.indicator.querySelector('.pull-text').textContent = 'Release to refresh';
                this.indicator.querySelector('.pull-icon').textContent = '↑';
            } else {
                this.indicator.classList.remove('pulling');
                this.indicator.querySelector('.pull-text').textContent = 'Pull to refresh';
                this.indicator.querySelector('.pull-icon').textContent = '↓';
            }
        }
    }

    async handleTouchEnd() {
        if (!this.isDragging) return;

        const diff = this.currentY - this.startY;
        const pullDistance = Math.min(diff / 2, this.maxPull);

        if (pullDistance >= this.threshold) {
            // Show loading state
            this.indicator.querySelector('.pull-text').textContent = 'Refreshing...';
            this.indicator.querySelector('.pull-icon').textContent = '⟳';

            // Trigger refresh
            try {
                await this.onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            }
        }

        // Reset
        this.container.style.transform = '';
        this.indicator.classList.remove('pulling');
        this.indicator.querySelector('.pull-text').textContent = 'Pull to refresh';
        this.indicator.querySelector('.pull-icon').textContent = '↓';
        this.isDragging = false;
    }

    destroy() {
        this.container.removeEventListener('touchstart', this.handleTouchStart);
        this.container.removeEventListener('touchmove', this.handleTouchMove);
        this.container.removeEventListener('touchend', this.handleTouchEnd);
        this.indicator?.remove();
    }
}

// ============================================================================
// Swipe Detector
// ============================================================================

export class SwipeDetector {
    constructor(element, callbacks) {
        this.element = element;
        this.callbacks = callbacks; // { left, right, up, down }
        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.minSwipeDistance = 50;
        this.maxSwipeTime = 500; // ms

        this.init();
    }

    init() {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    handleTouchStart(e) {
        this.startX = e.touches[0].pageX;
        this.startY = e.touches[0].pageY;
        this.startTime = Date.now();
    }

    handleTouchEnd(e) {
        const endX = e.changedTouches[0].pageX;
        const endY = e.changedTouches[0].pageY;
        const endTime = Date.now();

        const diffX = endX - this.startX;
        const diffY = endY - this.startY;
        const diffTime = endTime - this.startTime;

        // Check if swipe was fast enough
        if (diffTime > this.maxSwipeTime) return;

        // Determine direction
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (Math.abs(diffX) > this.minSwipeDistance) {
                if (diffX > 0) {
                    this.callbacks.right?.();
                } else {
                    this.callbacks.left?.();
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(diffY) > this.minSwipeDistance) {
                if (diffY > 0) {
                    this.callbacks.down?.();
                } else {
                    this.callbacks.up?.();
                }
            }
        }
    }

    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
    }
}

// ============================================================================
// Long Press Detector
// ============================================================================

export class LongPressDetector {
    constructor(element, callback, duration = 500) {
        this.element = element;
        this.callback = callback;
        this.duration = duration;
        this.timer = null;

        this.init();
    }

    init() {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    }

    handleTouchStart(e) {
        this.timer = setTimeout(() => {
            this.callback(e);
        }, this.duration);
    }

    handleTouchEnd() {
        clearTimeout(this.timer);
    }

    handleTouchMove() {
        clearTimeout(this.timer);
    }

    destroy() {
        clearTimeout(this.timer);
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
    }
}

console.log('📱 Gestures Module Loaded');

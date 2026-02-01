// Mobile Tools - UI Module
// Handles all UI interactions and updates

// ============================================================================
// Toast Notifications
// ============================================================================

/**
 * Show toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-dismiss
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================================
// Progress Updates
// ============================================================================

/**
 * Update progress bar
 */
export function updateProgress(current, total) {
    const progressFill = document.getElementById('progressFill');
    if (!progressFill || !total || total <= 0) return;

    const percentage = Math.min(100, Math.max(0, (current / total) * 100));
    progressFill.style.width = `${percentage}%`;
}

/**
 * Update status panel
 */
export function updateStatus(statusText, currentPage, cardsScraped, duplicatesSkipped) {
    const elements = {
        statusText: document.getElementById('statusText'),
        currentPage: document.getElementById('currentPage'),
        cardsScraped: document.getElementById('cardsScraped'),
        duplicatesSkipped: document.getElementById('duplicatesSkipped')
    };

    if (elements.statusText) elements.statusText.textContent = statusText;
    if (elements.currentPage && currentPage !== undefined) elements.currentPage.textContent = currentPage;
    if (elements.cardsScraped && cardsScraped !== undefined) elements.cardsScraped.textContent = cardsScraped;
    if (elements.duplicatesSkipped && duplicatesSkipped !== undefined) elements.duplicatesSkipped.textContent = duplicatesSkipped;
}

// ============================================================================
// JSON Viewer
// ============================================================================

/**
 * Update JSON viewer with syntax highlighting
 */
export function updateJsonViewer(data, viewerId = 'jsonViewer') {
    const viewer = document.getElementById(viewerId);
    if (!viewer) return;

    const jsonString = JSON.stringify(data, null, 2);

    // Simple syntax highlighting
    const highlighted = jsonString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false|null)/g, ': <span class="json-boolean">$1</span>');

    viewer.innerHTML = `<pre>${highlighted}</pre>`;
}

// ============================================================================
// Collapsible Sections
// ============================================================================

/**
 * Setup collapsible section handlers
 */
export function setupCollapsibles() {
    const collapsibles = document.querySelectorAll('.collapsible-header');

    collapsibles.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.collapsible-icon');

            if (content && content.classList.contains('collapsible-content')) {
                const isExpanded = content.classList.contains('expanded');

                if (isExpanded) {
                    content.classList.remove('expanded');
                    if (icon) icon.textContent = '▼';
                } else {
                    content.classList.add('expanded');
                    if (icon) icon.textContent = '▲';
                }
            }
        });
    });
}

// ============================================================================
// Theme Toggle
// ============================================================================

/**
 * Toggle theme between dark and light
 */
export function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update theme toggle button icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    return newTheme;
}

/**
 * Initialize theme from localStorage or system preference
 */
export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    return theme;
}

// ============================================================================
// Bottom Navigation
// ============================================================================

/**
 * Setup bottom navigation
 */
export function setupBottomNav() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active to clicked
            item.classList.add('active');

            // Get view name
            const view = item.getAttribute('data-view');

            // Show corresponding view (implement view switching logic)
            switchView(view);
        });
    });
}

function switchView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.add('hidden');
    });

    // Show selected view
    const selectedView = document.getElementById(`${viewName}View`);
    if (selectedView) {
        selectedView.classList.remove('hidden');
    }

    showToast(`Switched to ${viewName} view`, 'info', 1500);
}

// ============================================================================
// FAB (Floating Action Button)
// ============================================================================

/**
 * Update FAB state
 */
export function updateFAB(isRunning) {
    const fab = document.getElementById('fab');
    const fabIcon = document.getElementById('fabIcon');

    if (!fab || !fabIcon) return;

    if (isRunning) {
        fab.classList.add('active');
        fabIcon.textContent = '⏹️';
        fab.setAttribute('aria-label', 'Stop scraping');
    } else {
        fab.classList.remove('active');
        fabIcon.textContent = '▶️';
        fab.setAttribute('aria-label', 'Start scraping');
    }
}

// ============================================================================
// Mode Tabs
// ============================================================================

/**
 * Setup mode tabs (Page Range / Custom Links)
 */
export function setupModeTabs() {
    const tabs = document.querySelectorAll('.mode-tab');
    const pageRangeControls = document.getElementById('pageRangeControls');
    const customLinksControls = document.getElementById('customLinksControls');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));

            // Add active to clicked tab
            tab.classList.add('active');

            // Get mode
            const mode = tab.getAttribute('data-mode');

            // Show/hide controls
            if (mode === 'page-range') {
                if (pageRangeControls) pageRangeControls.style.display = 'block';
                if (customLinksControls) customLinksControls.style.display = 'none';
            } else if (mode === 'custom-links') {
                if (pageRangeControls) pageRangeControls.style.display = 'none';
                if (customLinksControls) customLinksControls.style.display = 'block';
            }
        });
    });
}

// ============================================================================
// Running Time Display
// ============================================================================

let runningTimeInterval = null;
let startTime = null;

/**
 * Start running time counter
 */
export function startRunningTimer() {
    startTime = Date.now();

    runningTimeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const formatted = formatTime(elapsed);

        const runningTimeEl = document.getElementById('runningTime');
        if (runningTimeEl) {
            runningTimeEl.textContent = formatted;
        }
    }, 1000);
}

/**
 * Stop running time counter
 */
export function stopRunningTimer() {
    if (runningTimeInterval) {
        clearInterval(runningTimeInterval);
        runningTimeInterval = null;
    }
}

/**
 * Reset running time
 */
export function resetRunningTimer() {
    stopRunningTimer();
    startTime = null;

    const runningTimeEl = document.getElementById('runningTime');
    if (runningTimeEl) {
        runningTimeEl.textContent = '00:00:00';
    }
}

function formatTime(ms) {
    if (ms < 0) ms = 0;
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

// ============================================================================
// PWA Install Prompt
// ============================================================================

let deferredPrompt = null;

/**
 * Setup PWA install prompt
 */
export function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show install button
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.classList.remove('hidden');
        }
    });

    // Handle install button click
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;

                if (outcome === 'accepted') {
                    showToast('App installed successfully!', 'success');
                } else {
                    showToast('Installation cancelled', 'info');
                }

                deferredPrompt = null;
                installBtn.classList.add('hidden');
            }
        });
    }
}

export default {
    showToast,
    updateProgress,
    updateStatus,
    updateJsonViewer,
    setupCollapsibles,
    toggleTheme,
    initTheme,
    setupBottomNav,
    updateFAB,
    setupModeTabs,
    startRunningTimer,
    stopRunningTimer,
    resetRunningTimer,
    setupPWAInstall
};

// Mobile Tools - Main App Controller
// Integrates all modules and handles app lifecycle

import * as Scraper from './scraper.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as Notifications from './notifications.js';
import * as Preview from './preview.js';
import { PullToRefresh, SwipeDetector } from './gestures.js';
import { Haptics } from './haptics.js';
import { batteryManager } from './battery.js';

// ============================================================================
// Global State
// ============================================================================

const state = {
    isRunning: false,
    shouldStop: false,
    scrapedData: [],
    newScrapedData: [],
    detectedDuplicates: [],
    existingData: [],
    currentPage: 0,
    cardsScraped: 0,
    duplicatesSkipped: 0,
    currentViewMode: 'full', // 'full' or 'new'
    settings: null
};

// ============================================================================
// App Initialization
// ============================================================================

async function initApp() {
    console.log('📱 Mobile Scraper App Initializing...');

    // Inject theme-color meta tag (avoids HTML lint warnings)
    const themeMeta = document.createElement('meta');
    themeMeta.name = 'theme-color';
    themeMeta.content = '#6366f1';
    document.head.appendChild(themeMeta);

    try {
        // Initialize theme
        UI.initTheme();

        // Initialize storage
        await Storage.initDB();

        // Load settings
        state.settings = Storage.loadSettings();

        // Load existing data from IndexedDB
        state.existingData = await Storage.loadMovies();
        state.scrapedData = [...state.existingData];

        // Setup UI components
        UI.setupCollapsibles();
        UI.setupBottomNav();
        UI.setupModeTabs();
        UI.setupPWAInstall();

        // Initialize Settings UI with loaded settings
        initializeSettingsUI();

        // Setup notification handlers
        Notifications.setupNotificationHandlers();

        // Setup event listeners
        setupEventListeners();

        // Setup touch gestures
        setupGestures();

        // Setup battery monitoring
        setupBatteryMonitoring();

        // Register service worker
        registerServiceWorker();

        // Update JSON viewer with existing data
        UI.updateJsonViewer(state.scrapedData);

        // Update status
        UI.updateStatus('Ready', 0, state.scrapedData.length, 0);

        console.log('✅ App initialized successfully');
        UI.showToast('App ready!', 'success');

        // Check for PWA installation
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('✅ Running as installed PWA');
        }

    } catch (error) {
        console.error('❌ App initialization failed:', error);
        UI.showToast('Failed to initialize app', 'error');
    }
}

// ============================================================================
// Service Worker Registration
// ============================================================================

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ Service Worker registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                console.log('🔄 Service Worker update found');
                UI.showToast('App update available', 'info');
            });

        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
    // FAB button
    const fab = document.getElementById('fab');
    if (fab) {
        fab.addEventListener('click', handleFABClick);
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = UI.toggleTheme();
            state.settings.theme = newTheme;
            Storage.saveSettings(state.settings);
        });
    }

    // Export buttons
    const viewFullBtn = document.getElementById('viewFullBtn');
    const viewNewBtn = document.getElementById('viewNewBtn');
    const copyFullBtn = document.getElementById('copyFullBtn');
    const saveBtn = document.getElementById('saveBtn');
    const shareBtn = document.getElementById('shareBtn');

    if (viewFullBtn) {
        viewFullBtn.addEventListener('click', () => {
            state.currentViewMode = 'full';
            UI.updateJsonViewer(state.scrapedData);
            UI.showToast('Viewing full JSON', 'info');
        });
    }

    if (viewNewBtn) {
        viewNewBtn.addEventListener('click', () => {
            state.currentViewMode = 'new';
            UI.updateJsonViewer(state.newScrapedData);
            UI.showToast('Viewing new items only', 'info');
        });
    }

    if (copyFullBtn) {
        copyFullBtn.addEventListener('click', async () => {
            const data = state.currentViewMode === 'new' ? state.newScrapedData : state.scrapedData;
            const jsonString = JSON.stringify(data, null, 2);
            const success = await Storage.copyToClipboard(jsonString);
            UI.showToast(success ? 'Copied to clipboard!' : 'Failed to copy', success ? 'success' : 'error');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const data = state.currentViewMode === 'new' ? state.newScrapedData : state.scrapedData;
            const filename = `scraped-movies-${Date.now()}.json`;
            const success = Storage.exportJSON(data, filename);
            UI.showToast(success ? 'JSON saved!' : 'Failed to save', success ? 'success' : 'error');
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const data = state.currentViewMode === 'new' ? state.newScrapedData : state.scrapedData;
            const success = await Storage.shareJSON(data);
            if (!success) {
                UI.showToast('Share not supported on this device', 'warning');
            }
        });
    }

    // Settings
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const proxyUrl = document.getElementById('proxyUrl')?.value.trim();
            const vibration = document.getElementById('vibrationSetting')?.value;

            if (proxyUrl) {
                state.settings.proxyUrl = proxyUrl;
                state.settings.notificationsEnabled = (vibration === 'enabled');

                Storage.saveSettings(state.settings);
                UI.showToast('Settings saved successfully!', 'success');
                Haptics.success();
            } else {
                UI.showToast('Proxy URL is required', 'error');
            }
        });
    }
}

/**
 * Initialize settings values in the UI
 */
function initializeSettingsUI() {
    if (!state.settings) return;

    const proxyInput = document.getElementById('proxyUrl');
    const vibrationSelect = document.getElementById('vibrationSetting');

    if (proxyInput) proxyInput.value = state.settings.proxyUrl || '';
    if (vibrationSelect) {
        vibrationSelect.value = state.settings.notificationsEnabled ? 'enabled' : 'disabled';
    }

    // Update environment label
    const envLabel = document.getElementById('envLabel');
    if (envLabel) {
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        envLabel.textContent = isMobile ? 'Mobile Browser' : 'Desktop Browser';
    }
}

// ============================================================================
// Touch Gestures Setup
// ============================================================================

function setupGestures() {
    // Pull-to-refresh on main content
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        new PullToRefresh(mainContent, async () => {
            Haptics.medium();
            UI.showToast('Refreshing data...', 'info');

            try {
                // Reload movies from IndexedDB
                state.existingData = await Storage.loadMovies();
                state.scrapedData = [...state.existingData];
                UI.updateJsonViewer(state.scrapedData);
                UI.updateStatus('Ready', 0, state.scrapedData.length, 0);

                Haptics.success();
                UI.showToast('Data refreshed!', 'success');
            } catch (error) {
                Haptics.error();
                UI.showToast('Refresh failed', 'error');
            }
        });
    }

    // Swipe navigation on bottom nav
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        const navItems = Array.from(document.querySelectorAll('.nav-item'));
        let currentIndex = 0;

        new SwipeDetector(bottomNav, {
            left: () => {
                // Next tab
                currentIndex = (currentIndex + 1) % navItems.length;
                navItems[currentIndex].click();
                Haptics.selection();
            },
            right: () => {
                // Previous tab
                currentIndex = (currentIndex - 1 + navItems.length) % navItems.length;
                navItems[currentIndex].click();
                Haptics.selection();
            }
        });
    }

    console.log('👆 Touch gestures enabled');
}

// ============================================================================
// Battery Monitoring Setup
// ============================================================================

function setupBatteryMonitoring() {
    // Listen for battery status changes
    batteryManager.addListener((isLowPower, level, charging) => {
        if (isLowPower) {
            UI.showToast(`⚠️ Low battery (${(level * 100).toFixed(0)}%) - Reducing activity`, 'warning');

            // Reduce notifications
            if (state.isRunning) {
                console.log('🔋 Low power mode: Reducing scraping speed');
            }
        } else if (charging) {
            console.log('⚡ Device charging - Full performance');
        }
    });

    // Display battery info
    const batteryInfo = batteryManager.getInfo();
    if (batteryInfo.supported) {
        console.log(`🔋 Battery: ${batteryInfo.percentage.toFixed(0)}% ${batteryInfo.charging ? '⚡' : ''}`);
    }
}

// ============================================================================
// Scraping Control
// ============================================================================

async function handleFABClick() {
    if (state.isRunning) {
        stopScraping();
    } else {
        startScraping();
    }
}

async function startScraping() {
    try {
        // Get active mode
        const activeTab = document.querySelector('.mode-tab.active');
        const mode = activeTab?.getAttribute('data-mode') || 'page-range';

        // Get inputs
        const websiteUrl = document.getElementById('websiteUrl')?.value.trim();
        const startPage = parseInt(document.getElementById('startPage')?.value) || 1;
        const endPage = parseInt(document.getElementById('endPage')?.value) || 1;
        const direction = document.getElementById('scrapingDirection')?.value || 'start-to-end';
        const customLinks = document.getElementById('customLinksTextarea')?.value.trim();
        const jsonUrl = document.getElementById('jsonUrl')?.value.trim();

        // Validate
        if (mode === 'page-range' && !websiteUrl) {
            UI.showToast('Please enter a website URL', 'error');
            return;
        }

        if (mode === 'custom-links' && !customLinks) {
            UI.showToast('Please enter at least one link', 'error');
            return;
        }

        // Reset state
        state.isRunning = true;
        state.shouldStop = false;
        state.newScrapedData = [];
        state.detectedDuplicates = [];
        state.currentPage = 0;
        state.cardsScraped = 0;
        state.duplicatesSkipped = 0;

        // Update UI
        UI.updateFAB(true);
        UI.updateStatus('Starting...', 0, 0, 0);
        UI.startRunningTimer();
        UI.showToast('Scraping started!', 'info');

        // Request notification permission
        try {
            await Notifications.requestPermission();
            Notifications.notifyScrapingStarted(mode);
        } catch (error) {
            console.warn('Notifications not available:', error);
        }

        // Load existing JSON if provided
        if (jsonUrl) {
            try {
                UI.showToast('Loading existing JSON...', 'info');
                const existingJson = await Storage.importJSON(jsonUrl);
                state.existingData = existingJson;
                state.scrapedData = [...existingJson];
                UI.showToast(`Loaded ${existingJson.length} existing movies`, 'success');
            } catch (error) {
                UI.showToast(`Failed to load JSON: ${error.message}`, 'error');
            }
        }

        // Start scraping based on mode
        if (mode === 'page-range') {
            await scrapePageRange(websiteUrl, startPage, endPage, direction);
        } else {
            await scrapeCustomLinks(customLinks);
        }

    } catch (error) {
        console.error('Scraping error:', error);
        UI.showToast(`Error: ${error.message}`, 'error');
        Notifications.notifyError(error.message);
        stopScraping();
    }
}

async function scrapePageRange(baseUrl, startPage, endPage, direction) {
    const pages = [];

    if (direction === 'start-to-end') {
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
    } else {
        for (let i = endPage; i >= startPage; i--) {
            pages.push(i);
        }
    }

    for (const pageNum of pages) {
        if (state.shouldStop) break;

        state.currentPage = pageNum;
        const pageUrl = `${baseUrl}?page=${pageNum}`;

        await Scraper.scrapePage(pageUrl, pageNum, {
            proxyUrl: state.settings.proxyUrl,
            onProgress: handleProgress,
            onMovieScraped: handleMovieScraped,
            shouldStop: () => state.shouldStop,
            existingData: state.existingData,
            scrapedData: state.scrapedData,
            newScrapedData: state.newScrapedData
        });

        UI.updateProgress(pages.indexOf(pageNum) + 1, pages.length);
    }

    finishScraping();
}

async function scrapeCustomLinks(linksText) {
    const links = linksText.split('\n').filter(l => l.trim());

    for (let i = 0; i < links.length; i++) {
        if (state.shouldStop) break;

        const link = links[i].trim();
        // Implement custom link scraping
        // This would call scrapeMovieDetails directly

        UI.updateProgress(i + 1, links.length);
    }

    finishScraping();
}

function stopScraping() {
    state.shouldStop = true;
    state.isRunning = false;

    UI.updateFAB(false);
    UI.stopRunningTimer();
    UI.updateStatus('Stopped', state.currentPage, state.cardsScraped, state.duplicatesSkipped);
    UI.showToast('Scraping stopped', 'warning');
}

async function finishScraping() {
    state.isRunning = false;

    UI.updateFAB(false);
    UI.stopRunningTimer();
    UI.updateStatus('Completed', state.currentPage, state.cardsScraped, state.duplicatesSkipped);
    UI.showToast(`Scraping completed! ${state.cardsScraped} movies scraped`, 'success');

    // Save to IndexedDB
    if (state.settings.autoSave && state.newScrapedData.length > 0) {
        try {
            await Storage.saveMovies(state.newScrapedData);
            UI.showToast('Data saved to device', 'success');
        } catch (error) {
            UI.showToast('Failed to save data', 'error');
        }
    }

    // Show completion notification
    Notifications.notifyScrapingCompleted(state.cardsScraped, state.duplicatesSkipped);
}

function handleProgress(event) {
    const { type, message } = event;
    UI.showToast(message, type, 2000);
}

function handleMovieScraped(event) {
    const { movie, isDuplicate, isUpdated, existingMovie } = event;

    if (isDuplicate) {
        state.duplicatesSkipped++;
        state.detectedDuplicates.push({
            title: existingMovie.title,
            isUpdated: isUpdated,
            status: existingMovie.info6_status
        });
    } else if (movie) {
        state.newScrapedData.push(movie);
        state.scrapedData.push(movie);
        state.cardsScraped++;

        // Render preview card for new movie
        Preview.renderPreview(movie);
    }

    UI.updateStatus('Scraping...', state.currentPage, state.cardsScraped, state.duplicatesSkipped);
    UI.updateJsonViewer(state.currentViewMode === 'new' ? state.newScrapedData : state.scrapedData);
}

// ============================================================================
// App Lifecycle
// ============================================================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Handle visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📴 App hidden');
    } else {
        console.log('📱 App visible');
    }
});

// Export for debugging and global access
window.MobileScraperApp = {
    state,
    Scraper,
    Storage,
    UI,
    Notifications,
    Preview,
    // Expose preview functions for onclick handlers
    handleDownload: Preview.handleDownload,
    downloadQuality: Preview.downloadQuality,
    showDetails: Preview.showDetails
};

console.log('📱 Mobile Scraper App Loaded');

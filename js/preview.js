// Mobile Tools - Results Preview Module
// Renders scraped movie cards with download buttons

// ============================================================================
// Render Preview
// ============================================================================

/**
 * Render a single movie card in the preview section
 */
export function renderPreview(movieData) {
    const previewContainer = document.getElementById('previewContainer');
    if (!previewContainer) return;

    const card = createMovieCard(movieData);
    previewContainer.insertBefore(card, previewContainer.firstChild);

    // Limit preview to 50 cards for performance
    const cards = previewContainer.querySelectorAll('.movie-card');
    if (cards.length > 50) {
        cards[cards.length - 1].remove();
    }
}

/**
 * Clear all preview cards
 */
export function clearPreview() {
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}

/**
 * Create a movie card element
 */
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-movie-id', movie.id);

    // Apply blur if adult content
    const blurClass = movie.enablePosterBlur ? 'blur-poster' : '';

    card.innerHTML = `
        <div class="movie-poster ${blurClass}">
            <img src="${movie.imageUrl}" alt="${movie.title}" loading="lazy">
            ${movie.enablePosterBlur ? '<div class="adult-badge">18+</div>' : ''}
            ${movie.info6_status !== 'Online' ? `<div class="status-badge">${movie.info6_status}</div>` : ''}
        </div>
        
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            
            <div class="movie-meta">
                ${movie.info2_quality ? `<span class="meta-badge quality">${movie.info2_quality}</span>` : ''}
                ${movie.info3_language ? `<span class="meta-badge language">${movie.info3_language}</span>` : ''}
                ${movie.info4_type ? `<span class="meta-badge type">${movie.info4_type}</span>` : ''}
            </div>
            
            ${movie.imdb ? `
                <div class="movie-rating">
                    <span class="rating-icon">⭐</span>
                    <span class="rating-value">${movie.imdb}</span>
                </div>
            ` : ''}
            
            ${movie.genre ? `<div class="movie-genre">${movie.genre}</div>` : ''}
            
            ${movie.storyline ? `
                <div class="movie-storyline">
                    ${truncateText(movie.storyline, 120)}
                </div>
            ` : ''}
            
            <div class="movie-actions">
                <button class="btn-download" onclick="window.MobileScraperApp.handleDownload('${movie.id}')">
                    <span class="btn-icon">⬇️</span>
                    <span class="btn-text">Download</span>
                </button>
                <button class="btn-details" onclick="window.MobileScraperApp.showDetails('${movie.id}')">
                    <span class="btn-icon">ℹ️</span>
                    <span class="btn-text">Details</span>
                </button>
            </div>
        </div>
    `;

    return card;
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ============================================================================
// Download Handling
// ============================================================================

/**
 * Handle download button click
 */
export async function handleDownload(movieId) {
    const movie = findMovieById(movieId);
    if (!movie) {
        console.error('Movie not found:', movieId);
        return;
    }

    // Check if movie has download options
    if (!movie.downloadOptions || movie.downloadOptions.length === 0) {
        showToast('No download links available', 'warning');
        return;
    }

    // Get first download option
    const downloadOption = movie.downloadOptions[0];

    if (!downloadOption.qualities || downloadOption.qualities.length === 0) {
        showToast('No download qualities available', 'warning');
        return;
    }

    // If only one quality, download directly
    if (downloadOption.qualities.length === 1) {
        const quality = downloadOption.qualities[0];
        await oneClickDownload(quality.path, movie.title);
    } else {
        // Show quality selection modal
        showQualitySelector(movie, downloadOption.qualities);
    }
}

/**
 * One-click download (resolve getLink URL and open)
 */
async function oneClickDownload(getLinkUrl, movieTitle) {
    try {
        showToast('Resolving download link...', 'info');

        // Fetch the getLink page
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: getLinkUrl })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to resolve link');
        }

        // Parse the HTML to find the actual download link
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.html, 'text/html');

        // Try multiple selectors for download link
        const selectors = [
            'a[href*="drive.google.com"]',
            'a.download-link',
            'a[href*="download"]',
            'a.btn-primary'
        ];

        let downloadLink = null;
        for (const selector of selectors) {
            const link = doc.querySelector(selector);
            if (link) {
                downloadLink = link.getAttribute('href');
                break;
            }
        }

        if (downloadLink) {
            // Open download link in new tab
            window.open(downloadLink, '_blank');
            showToast('Opening download link...', 'success');
        } else {
            // If no direct link found, open the getLink page
            window.open(getLinkUrl, '_blank');
            showToast('Opening download page...', 'info');
        }

    } catch (error) {
        console.error('Download error:', error);
        showToast(`Download failed: ${error.message}`, 'error');
    }
}

/**
 * Show quality selector modal
 */
function showQualitySelector(movie, qualities) {
    const modal = document.createElement('div');
    modal.className = 'quality-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Select Quality</h3>
                <button class="modal-close" onclick="this.closest('.quality-modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="quality-list">
                    ${qualities.map(q => `
                        <button class="quality-option" onclick="window.MobileScraperApp.downloadQuality('${q.path}', '${movie.title}')">
                            <span class="quality-text">${q.quality_text}</span>
                            <span class="quality-size">${q.file_size}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Download specific quality
 */
export async function downloadQuality(path, movieTitle) {
    // Close modal
    const modal = document.querySelector('.quality-modal');
    if (modal) modal.remove();

    await oneClickDownload(path, movieTitle);
}

// ============================================================================
// Details Modal
// ============================================================================

/**
 * Show movie details modal
 */
export function showDetails(movieId) {
    const movie = findMovieById(movieId);
    if (!movie) {
        console.error('Movie not found:', movieId);
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'details-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${movie.title}</h3>
                <button class="modal-close" onclick="this.closest('.details-modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="details-poster">
                    <img src="${movie.imageUrl}" alt="${movie.title}">
                </div>
                
                <div class="details-info">
                    ${movie.imdb ? `<div class="detail-row"><strong>IMDb:</strong> ${movie.imdb}</div>` : ''}
                    ${movie.genre ? `<div class="detail-row"><strong>Genre:</strong> ${movie.genre}</div>` : ''}
                    ${movie.released ? `<div class="detail-row"><strong>Released:</strong> ${movie.released}</div>` : ''}
                    ${movie.resolution ? `<div class="detail-row"><strong>Resolution:</strong> ${movie.resolution}</div>` : ''}
                    ${movie.cast ? `<div class="detail-row"><strong>Cast:</strong> ${movie.cast}</div>` : ''}
                    ${movie.storyline ? `<div class="detail-row"><strong>Storyline:</strong> ${movie.storyline}</div>` : ''}
                </div>
                
                ${movie.screenshotLinks && movie.screenshotLinks.length > 0 ? `
                    <div class="details-screenshots">
                        <h4>Screenshots</h4>
                        <div class="screenshot-grid">
                            ${movie.screenshotLinks.map(link => `
                                <img src="${link}" alt="Screenshot" loading="lazy">
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ============================================================================
// Helper Functions
// ============================================================================

function findMovieById(movieId) {
    const app = window.MobileScraperApp;
    if (!app || !app.state) return null;

    return app.state.scrapedData.find(m => m.id === movieId);
}

function showToast(message, type) {
    if (window.MobileScraperApp && window.MobileScraperApp.UI) {
        window.MobileScraperApp.UI.showToast(message, type);
    }
}

// ============================================================================
// Export for global access
// ============================================================================

export default {
    renderPreview,
    clearPreview,
    handleDownload,
    downloadQuality,
    showDetails
};

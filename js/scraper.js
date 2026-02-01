// Mobile Tools - Scraper Module
// Extracted and adapted from original web scraper

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse upload time text like "2 hours ago" to ISO timestamp
 */
export function parseUploadTime(uploadTimeText) {
    if (!uploadTimeText) return new Date().toISOString();

    const text = uploadTimeText.toLowerCase().trim();
    const now = new Date();

    const patterns = [
        { regex: /(\d+)\s*second[s]?\s*ago/i, unit: 'seconds' },
        { regex: /(\d+)\s*minute[s]?\s*ago/i, unit: 'minutes' },
        { regex: /(\d+)\s*hour[s]?\s*ago/i, unit: 'hours' },
        { regex: /(\d+)\s*day[s]?\s*ago/i, unit: 'days' },
        { regex: /(\d+)\s*week[s]?\s*ago/i, unit: 'weeks' },
        { regex: /(\d+)\s*month[s]?\s*ago/i, unit: 'months' },
        { regex: /(\d+)\s*year[s]?\s*ago/i, unit: 'years' }
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (match) {
            const value = parseInt(match[1]);
            const timestamp = new Date(now);

            switch (pattern.unit) {
                case 'seconds':
                    timestamp.setSeconds(timestamp.getSeconds() - value);
                    break;
                case 'minutes':
                    timestamp.setMinutes(timestamp.getMinutes() - value);
                    break;
                case 'hours':
                    timestamp.setHours(timestamp.getHours() - value);
                    break;
                case 'days':
                    timestamp.setDate(timestamp.getDate() - value);
                    break;
                case 'weeks':
                    timestamp.setDate(timestamp.getDate() - (value * 7));
                    break;
                case 'months':
                    timestamp.setMonth(timestamp.getMonth() - value);
                    break;
                case 'years':
                    timestamp.setFullYear(timestamp.getFullYear() - value);
                    break;
            }

            return timestamp.toISOString();
        }
    }

    return now.toISOString();
}

/**
 * Normalize language text (replace "Dual" with "Dual Audio", clean brackets)
 */
export function normalizeLanguage(language) {
    if (!language) return '';

    // Replace "Dual" with "Dual Audio"
    language = language.replace(/\bDual\b/gi, 'Dual Audio');

    // Replace [ ] and – with comma
    language = language.replace(/[\[\]–]/g, ',');

    // Clean up multiple commas
    language = language.replace(/,+/g, ',').replace(/^,|,$/g, '');

    return language.trim();
}

/**
 * Clean movie title (remove episode info like [S01 Ep 1-10 Added])
 */
export function cleanMovieTitle(title) {
    if (!title) return '';
    return title.replace(/\[\s*S\d+[^\]]*Added\s*\]/gi, '').trim().replace(/\s+/g, ' ');
}

/**
 * Extract info value from HTML using label
 */
export function extractInfoValue(html, label) {
    const regex = new RegExp(`<(b|strong)>\\s*${label}\\s*:?\\s*</\\1>\\s*([^<]+)`, 'i');
    const match = html.match(regex);
    return match ? match[2].trim().replace(/\s+/g, ' ') : '';
}

/**
 * Resolve relative URL to absolute
 */
export function resolveUrl(baseUrl, relativeUrl) {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    try {
        return new URL(relativeUrl, baseUrl).href;
    } catch (e) {
        return relativeUrl;
    }
}

/**
 * Generate unique ID for movie/series
 */
export function generateId(type, serial) {
    const cleanType = (type || 'movie').toString().toLowerCase().trim().replace(/\s+/g, '');
    return `${cleanType}${serial}`;
}

/**
 * Get highest ID number from existing data
 */
export function getHighestIdNumber(existingData, scrapedData) {
    const allData = [...existingData, ...scrapedData];
    let maxId = 0;

    allData.forEach(item => {
        if (item.id) {
            const match = item.id.match(/(\d+)$/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxId) {
                    maxId = num;
                }
            }
        }
    });

    return maxId;
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Find existing movie in data (advanced duplicate detection)
 */
export function findExistingMovie(movie, existingData, scrapedData) {
    const allData = [...existingData, ...scrapedData];
    const clean = (str) => (str || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

    // Helper to extract season number
    const extractSeason = (status) => {
        if (!status) return null;
        const match = status.match(/S(\d+)/i);
        return match ? match[1] : null;
    };

    return allData.find(item => {
        const matchTitle = clean(item.title) === clean(movie.title);
        const matchImageUrl = clean(item.imageUrl) === clean(movie.imageUrl);
        const matchQuality = clean(item.info2_quality) === clean(movie.info2_quality);
        const matchType = clean(item.info4_type) === clean(movie.info4_type);
        const matchGenre = clean(item.genre) === clean(movie.genre);
        const matchResolution = clean(item.resolution) === clean(movie.resolution);
        const matchReleased = clean(item.released) === clean(movie.released);
        const matchCast = clean(item.cast) === clean(movie.cast);
        const matchStoryline = clean(item.storyline) === clean(movie.storyline);
        const matchLangInfo = clean(item.language_info) === clean(movie.language_info);

        const basicMatch = matchTitle && matchImageUrl && matchQuality &&
            matchType && matchGenre && matchResolution &&
            matchReleased && matchCast && matchStoryline && matchLangInfo;

        if (!basicMatch) return false;

        // Season-aware duplicate detection
        const itemSeason = extractSeason(item.info6_status);
        const movieSeason = extractSeason(movie.info6_status);

        // Different seasons = NOT duplicate
        if (itemSeason && movieSeason && itemSeason !== movieSeason) {
            return false;
        }

        return true;
    });
}

// ============================================================================
// CORS PROXY / FETCH
// ============================================================================

/**
 * Fetch page content via CORS proxy
 */
export async function fetchPageContent(url, proxyUrl = '/api/proxy') {
    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (!data.success) {
            let errorMsg = data.error || 'Failed to fetch page';
            if (response.status === 501) {
                errorMsg = 'Server Error (501): The proxy is not responding. Please ensure the proxy server is running.';
            }
            throw new Error(errorMsg);
        }

        return {
            html: data.html,
            finalUrl: data.url
        };
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        throw error;
    }
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse movie card HTML to extract basic info
 */
export function parseMovieCard(cardHtml, pageNumber, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cardHtml, 'text/html');

    // Check for adult badge
    const hasAdultBadge = doc.querySelector('.badge.adult18plus-badge') !== null ||
        cardHtml.toLowerCase().includes('adult18plus-badge');
    const enablePosterBlur = hasAdultBadge ? 'true' : 'false';

    const imageContainer = doc.querySelector('.image-container');
    const rawHref = imageContainer?.querySelector('a')?.getAttribute('href') || '';
    const href = resolveUrl(baseUrl, rawHref);

    // Fallback for Title/Image
    const imgEl = doc.querySelector('img');
    const listTitle = cleanMovieTitle(imgEl?.getAttribute('alt') || imgEl?.getAttribute('title') ||
        doc.querySelector('.mb-2.font-bold, .card-title, h3, h2')?.textContent || '');
    const rawListImageUrl = imgEl?.src || imgEl?.getAttribute('src') || '';
    const listImageUrl = resolveUrl(baseUrl, rawListImageUrl).trim();

    if (href || listTitle) {
        return {
            href: href,
            title: listTitle,
            imageUrl: listImageUrl,
            enablePosterBlur
        };
    }

    return {
        href: '',
        title: listTitle,
        imageUrl: listImageUrl,
        enablePosterBlur
    };
}

/**
 * Scrape detailed movie information from movie page
 */
export async function scrapeMovieDetails(href, enablePosterBlur, pageNumber, serial, currentBaseUrl, proxyUrl) {
    try {
        const { html, finalUrl } = await fetchPageContent(href, proxyUrl);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const baseUrl = finalUrl || href;

        // Extract image
        const imgEl = doc.querySelector('.image-container-view img');
        const rawImageUrl = imgEl?.src || imgEl?.getAttribute('src') || '';
        const imageUrl = resolveUrl(baseUrl, rawImageUrl).trim();

        // Extract title
        const title = cleanMovieTitle(doc.querySelector('.mb-2.font-bold.text-center.text-xl, h1, .post-title, .md\\:text-3xl, .lg\\:text-4xl, .entry-title')?.textContent || '');

        // Screenshot links
        const screenshotElements = doc.querySelectorAll('.screenshot-wrapper [data-src]');
        const screenshotLinks = Array.from(screenshotElements).map(el => {
            const raw = el.getAttribute('data-src');
            return resolveUrl(baseUrl, raw).trim();
        }).filter(Boolean);

        // Storyline
        const storyline = (doc.querySelector('.storyline-box.mt-2 .story-text')?.textContent || '').trim().replace(/\s+/g, ' ');

        // Extract type
        const typeMatch = html.match(/<b[^>]*class="text-orange"[^>]*>([^<]+)<\/b>/i) ||
            html.match(/<b>Type\s*:?<\/b>\s*([^<]+)/i);
        const info4_type = typeMatch ? typeMatch[1].trim().replace(/\s+/g, ' ') : 'Movie';

        // Generate ID
        const id = generateId(info4_type || 'movie', serial);

        // Extract info-line data
        const imdb = extractInfoValue(html, 'IMDb');
        const genre = extractInfoValue(html, 'Genre');
        const languageRaw = extractInfoValue(html, 'Language');
        const language = normalizeLanguage(languageRaw);
        const quality = extractInfoValue(html, 'Quality');
        const resolution = extractInfoValue(html, 'Resolution');
        const released = extractInfoValue(html, 'Released');
        const cast = extractInfoValue(html, 'Cast');

        // Extract status
        const statusElement = doc.querySelector('.badge.ep-badge.added');
        const info6_status = statusElement?.textContent.trim() || 'Online';

        // Extract upload time
        const uploadTimeElement = doc.querySelector('.upload-time');
        const uploadTimeText = uploadTimeElement?.textContent?.trim() || '';
        const createdAt = parseUploadTime(uploadTimeText);
        const lastUpdated = createdAt;

        // Extract Download Links
        const downloadLinks = [];
        const linkSelectors = [
            '.d-flex.justify-content-center.align-items-center.my-2 .d-flex.flex-wrap.justify-content-center.align-items-center.gap-2.gap-md-3.my-2 a[href*="/getLink/"]',
            '.card.h-100.border-left-success.shadow-sm.position-relative .mb-2.d-flex.justify-content-center a[href*="/getLink/"]'
        ];

        linkSelectors.forEach(selector => {
            doc.querySelectorAll(selector).forEach(a => {
                const rawText = a.textContent.trim();
                const match = rawText.match(/Download\s*\[(.*)\s*•\s*(.*)\]/i);
                if (match) {
                    downloadLinks.push({
                        url: resolveUrl(baseUrl, a.getAttribute('href')),
                        quality: match[1].trim(),
                        size: match[2].trim()
                    });
                }
            });
        });

        const movieData = {
            id: id,
            post_url: href,
            title: title,
            imageUrl: imageUrl,
            info1_custom: '',
            info2_quality: quality,
            info3_language: language,
            info4_type: info4_type,
            language_info: languageRaw,
            info_subtitle: '',
            info6_status: info6_status,
            enablePosterBlur: enablePosterBlur === 'true',
            blurPercentage: 10,
            imdb: imdb,
            genre: genre,
            resolution: resolution,
            released: released,
            cast: cast,
            storyline: storyline,
            visibility: 'published',
            total_views: 0,
            createdAt: createdAt,
            lastUpdated: lastUpdated,
            server: true,
            server_info: '',
            runtime: '',
            director: '',
            writer: '',
            rated: '',
            trailer: '',
            info5_views: 0,
            screenshotLinks: screenshotLinks,
            downloadOptions: [
                {
                    server: 'G-Drive',
                    server_info: '',
                    qualities: downloadLinks.map(link => ({
                        quality_text: link.quality,
                        path: link.url,
                        file_size: link.size
                    })),
                    labels: []
                }
            ]
        };

        return movieData;
    } catch (error) {
        console.error(`Error scraping ${href}:`, error.message);
        throw error;
    }
}

/**
 * Scrape a single page for movie cards
 */
export async function scrapePage(pageUrl, pageNumber, options = {}) {
    const {
        proxyUrl = '/api/proxy',
        onProgress = () => { },
        onMovieScraped = () => { },
        shouldStop = () => false,
        existingData = [],
        scrapedData = [],
        newScrapedData = []
    } = options;

    try {
        onProgress({ type: 'info', message: `Scraping page ${pageNumber}...` });

        const { html, finalUrl } = await fetchPageContent(pageUrl, proxyUrl);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const baseUrl = finalUrl || pageUrl;

        // Find all movie cards
        let movieCards = doc.querySelectorAll('.movie-card, .post, article, .item-list');

        if (movieCards.length === 0) {
            onProgress({
                type: 'warning',
                message: `No movie cards found on page ${pageNumber}. Site structure may have changed.`
            });
        }

        onProgress({ type: 'info', message: `Found ${movieCards.length} cards on page ${pageNumber}` });

        // Start serial from highest existing ID + 1
        let serial = getHighestIdNumber(existingData, scrapedData) + newScrapedData.length + 1;

        for (let i = 0; i < movieCards.length; i++) {
            if (shouldStop()) {
                onProgress({ type: 'warning', message: 'Stop requested, finishing current page...' });
                break;
            }

            const cardHtml = movieCards[i].outerHTML;
            const { href, title, imageUrl, enablePosterBlur } = parseMovieCard(cardHtml, pageNumber, baseUrl);

            if (href) {
                try {
                    const movieData = await scrapeMovieDetails(href, enablePosterBlur, pageNumber, serial, baseUrl, proxyUrl);

                    if (movieData) {
                        // Check for duplicates
                        const existingMovie = findExistingMovie(movieData, existingData, scrapedData);

                        if (existingMovie) {
                            // Duplicate found
                            let isUpdated = false;
                            if (existingMovie.info6_status !== movieData.info6_status) {
                                existingMovie.info6_status = movieData.info6_status;
                                isUpdated = true;
                                onProgress({
                                    type: 'info',
                                    message: `Updated status: ${title} (${movieData.info6_status})`
                                });
                            } else {
                                onProgress({ type: 'warning', message: `Skipped duplicate: ${title}` });
                            }

                            onMovieScraped({
                                movie: null,
                                isDuplicate: true,
                                isUpdated: isUpdated,
                                existingMovie: existingMovie
                            });
                        } else {
                            // New movie
                            onMovieScraped({
                                movie: movieData,
                                isDuplicate: false,
                                isUpdated: false
                            });

                            onProgress({ type: 'success', message: `Scraped: ${movieData.title}` });
                            serial++;
                        }
                    }
                } catch (error) {
                    onProgress({ type: 'error', message: `Failed to scrape ${href}: ${error.message}` });
                }
            }

            // Small delay to avoid overwhelming server
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return movieCards.length;
    } catch (error) {
        onProgress({ type: 'error', message: `Error on page ${pageNumber}: ${error.message}` });
        return 0;
    }
}

export default {
    parseUploadTime,
    normalizeLanguage,
    cleanMovieTitle,
    extractInfoValue,
    resolveUrl,
    generateId,
    getHighestIdNumber,
    findExistingMovie,
    fetchPageContent,
    parseMovieCard,
    scrapeMovieDetails,
    scrapePage
};

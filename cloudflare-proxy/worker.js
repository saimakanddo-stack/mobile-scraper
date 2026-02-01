/**
 * Cloudflare Worker: CORS Proxy for Mobile Scraper
 * Handles fetching website content to bypass CORS restrictions
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. Get the target URL from query parameter or POST body
        let targetUrl = url.searchParams.get('url');

        if (!targetUrl && request.method === 'POST') {
            try {
                const body = await request.json();
                targetUrl = body.url;
            } catch (e) { }
        }

        // 2. Handle cases where URL is missing
        if (!targetUrl) {
            return new Response(JSON.stringify({
                success: false,
                error: 'URL is required. Use GET ?url=... or POST {"url": "..."}'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 3. Handle CORS Preflight (OPTIONS request)
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        try {
            // 4. Fetch the target website
            const response = await fetch(targetUrl, {
                method: request.method,
                headers: {
                    // Send a realistic mobile User-Agent
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                },
                redirect: 'follow'
            });

            // 5. Get the response body (as text/HTML)
            const html = await response.text();

            // 6. Return the response with CORS headers
            return new Response(JSON.stringify({
                success: true,
                html: html,
                finalUrl: response.url,
                status: response.status
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                }
            });

        } catch (error) {
            // 7. Handle network or fetch errors
            return new Response(JSON.stringify({
                success: false,
                error: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};

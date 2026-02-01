const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the parent directory (Mobile Tools root)
app.use(express.static(path.join(__dirname, '../')));

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// CORS Proxy endpoint
app.post('/api/proxy', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`📡 [Proxy] Requesting: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
            },
            timeout: 30000, // 30 seconds
            follow: 20
        });

        const html = await response.text();

        res.json({
            success: true,
            html: html,
            finalUrl: response.url,
            status: response.status
        });

    } catch (error) {
        console.error('❌ [Proxy] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('🚀 MOBILE SCRAPER PROXY IS RUNNING');
    console.log(`🌐 Local:   http://localhost:${PORT}`);
    console.log(`🔌 API:     http://localhost:${PORT}/api/proxy`);
    console.log('========================================\n');
    console.log('💡 TIP: To access from mobile, use your PC IP address');
    console.log('💡 RUN: `ipconfig` to find your IPv4 Address\n');
});

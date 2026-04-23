// api/proxy.js
export default async function handler(req, res) {
    // Allow CORS for local testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Get target URL from query parameter or from path
    let targetUrl = req.query.url;
    if (!targetUrl) {
        // Fallback: extract from path like /api/proxy/https://example.com
        const path = req.url.split('?')[0];
        const match = path.match(/\/api\/proxy\/(.+)/);
        if (match) targetUrl = decodeURIComponent(match[1]);
    }
    if (!targetUrl) {
        return res.status(400).send('Missing ?url= parameter or /api/proxy/<url> path');
    }

    // Ensure protocol
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        // Use a timeout to avoid hanging
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 seconds
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Accept': req.headers['accept'] || '*/*',
                'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
                // Forward the original Host header? For proxy, we set it to the target's host
                'Host': new URL(targetUrl).host,
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        // Read response body as text (supports HTML, JSON, etc.)
        const body = await response.text();
        res.status(response.status).send(body);
    } catch (error) {
        console.error('Proxy error:', error);
        // More detailed error
        let errorMsg = error.message;
        if (error.name === 'AbortError') errorMsg = 'Request timeout (15s)';
        res.status(500).send(`Proxy error: ${errorMsg}`);
    }
}

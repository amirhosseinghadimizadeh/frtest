// api/proxy.js
export default async function handler(req, res) {
    // Enable CORS for local testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // 1. Get target URL from query parameter ?url=...
    let targetUrl = req.query.url;
    
    // 2. Fallback: extract from path like /api/proxy/https://example.com
    if (!targetUrl) {
        const path = req.url.split('?')[0];
        const match = path.match(/\/api\/proxy\/(.+)/);
        if (match) targetUrl = decodeURIComponent(match[1]);
    }
    
    if (!targetUrl) {
        return res.status(400).send('Missing ?url= parameter or /api/proxy/<url> path');
    }

    // 3. Ensure protocol (default to https)
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        // 4. Fetch the target with a timeout (15 seconds)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Accept': req.headers['accept'] || '*/*',
                'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
                'Host': new URL(targetUrl).host,
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        // 5. Read response body as text and send back
        const body = await response.text();
        res.status(response.status).send(body);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send(`Proxy error: ${error.message}`);
    }
}

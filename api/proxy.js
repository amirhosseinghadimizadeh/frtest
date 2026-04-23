// A modern serverless reverse proxy for Vercel
export default async function handler(req, res) {
    // Extract path and query from the request
    const urlPath = req.url.slice(1); // Remove the leading '/'
    if (!urlPath) {
        return res.status(400).send('Usage: GET /<target-url>');
    }

    // Prepend https:// unless the request starts with http:// or https://
    let targetUrl = urlPath;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        // Forward the request, cloning headers that might be necessary
        const response = await fetch(targetUrl, {
            headers: {
                // Pass the original User-Agent, or set a default one
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                // Forward a few other key headers if present
                'Accept': req.headers['accept'] || '*/*',
                'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
                // This Host header is what the target server sees
                'Host': new URL(targetUrl).host,
            }
        });

        // Relay the status code and the response body back to the client
        res.status(response.status);
        const data = await response.text();
        res.send(data);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send(`Proxy error: ${error.message}`);
    }
}

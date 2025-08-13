// Cloudflare Worker to serve R2 bucket with aggressive caching.
// Bind your R2 bucket as `BUCKET` in wrangler.toml.
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Expected path: /i/<key>
    const key = url.pathname.replace(/^\/i\//, '');
    if (!key) return new Response('Missing key', { status: 400 });

    // Try cache first
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    let res = await cache.match(cacheKey);
    if (res) return res;

    // Fetch from R2
    const obj = await env.BUCKET.get(key);
    if (!obj) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    res = new Response(obj.body, { headers });
    // Put in cache
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  }
}

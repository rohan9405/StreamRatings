// StreamRatings shared cache (Cloudflare Worker + D1)
//
// GET /v1/rating?title=Inception&year=2010   (header X-OMDb-Key: <caller's own key>)
//   - Fresh row in D1 (per the release-date tiers) -> served without touching OMDb.
//   - Missing/stale -> fetched from OMDb with the caller's key, stored, returned.
//     Keys are used for that one request only and never stored or logged.
//   - OMDb fails (bad key, daily limit) but a stale row exists -> stale row served.
// Only this Worker writes to the cache, so clients can't poison it.

import '../../extension/shared/omdb.js';
import '../../extension/shared/cache_policy.js';

const { cacheKey, lookup } = globalThis.StreamRatingsOmdb;
const CachePolicy = globalThis.StreamRatingsCachePolicy;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-OMDb-Key',
  'Access-Control-Max-Age': '86400'
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/health') return json({ ok: true });
    if (url.pathname !== '/v1/rating' || request.method !== 'GET') return json({ error: 'Not found' }, 404);

    const title = (url.searchParams.get('title') || '').trim();
    const year = url.searchParams.get('year') || '';
    if (!title || title.length > 120) return json({ error: 'title is required (max 120 chars)' }, 400);
    if (year && !/^\d{4}$/.test(year)) return json({ error: 'year must be 4 digits' }, 400);

    const key = cacheKey(title, year || null);
    const row = await env.DB.prepare('SELECT data, ts FROM ratings WHERE key = ?').bind(key).first();
    const cached = row ? { data: JSON.parse(row.data), ts: row.ts } : null;

    if (cached && CachePolicy.isFresh(cached)) {
      return json({ ...cached, cache: 'hit' });
    }

    const apiKey = request.headers.get('X-OMDb-Key');
    if (!apiKey) {
      return cached ? json({ ...cached, cache: 'stale' }) : json({ error: 'X-OMDb-Key header required on a cache miss' }, 401);
    }

    let data;
    try {
      data = await lookup(title, year || null, apiKey);
    } catch (err) {
      if (cached) return json({ ...cached, cache: 'stale' });
      const status = /limit reached/i.test(err.message) ? 429 : /api key|invalid/i.test(err.message) ? 401 : 502;
      return json({ error: err.message }, status);
    }

    const ts = Date.now();
    await env.DB.prepare(
      'INSERT INTO ratings (key, data, ts) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, ts = excluded.ts'
    ).bind(key, JSON.stringify(data), ts).run();

    return json({ data, ts, cache: 'miss' });
  }
};

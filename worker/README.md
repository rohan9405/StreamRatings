# StreamRatings shared cache

Cloudflare Worker + D1 that caches ratings for all StreamRatings users.
Live at https://streamratings-cache.rohan-trades-trump.workers.dev

- `GET /v1/rating?title=&year=` with header `X-OMDb-Key` (the caller's own key).
  Fresh entries (3/5/15/30-day tiers from `extension/shared/cache_policy.js`) are
  served from D1; misses are fetched from OMDb with the caller's key and stored.
  Keys are never stored. Only the Worker writes to the cache.
- `GET /health`

Lookup and refresh logic are imported from `extension/shared/`, so the extension
and the Worker always agree.

## Deploy
```sh
npm install
npx wrangler login
npx wrangler d1 create streamratings-cache   # put the id in wrangler.toml
npm run db:init
npm run deploy
```
If the URL changes, update `SHARED_CACHE_URL` in `extension/background/service_worker.js`
and `host_permissions` in `extension/manifest.json`.

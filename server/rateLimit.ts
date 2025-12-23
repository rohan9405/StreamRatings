interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = store[ip];

  if (!record) {
    store[ip] = { count: 1, resetTime: now + WINDOW_MS };
    return true;
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const ip in store) {
    if (now > store[ip].resetTime) {
      delete store[ip];
    }
  }
}, WINDOW_MS * 5);

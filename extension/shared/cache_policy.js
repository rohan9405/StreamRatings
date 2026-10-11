// Cache refresh policy (shared by the extension and the shared-cache server): how long a cached rating stays fresh depends on how
// recently the title was released (newer titles' ratings move faster).
//
//   released in the last 3 months (incl. current month) ->  3 days
//   released 3-12 months ago                            ->  5 days
//   released 1-5 years ago                              -> 15 days
//   released more than 5 years ago                      -> 30 days
//
// Series still airing (Year like "2016–") are treated as 3-12 months old,
// since new seasons keep moving their rating. Titles OMDb couldn't find are
// retried after 5 days.

const CachePolicy = {
  DAY: 24 * 60 * 60 * 1000,
  NOT_FOUND_TTL_DAYS: 5,

  // Best-known release date for a cached result, or null
  releaseDate(data, now = new Date()) {
    // Series: "2019–2023" (ended) or "2016–" (still airing)
    const range = /^(\d{4})\s*[–-]\s*(\d{4})?$/.exec((data.year || '').trim());
    if (range) {
      if (!range[2]) return now; // still airing -> treated as recent
      return this.yearEnd(Number(range[2]), now);
    }

    if (data.released && data.released !== 'N/A') {
      const d = new Date(data.released);
      if (!isNaN(d)) return d;
    }

    const year = /\b(\d{4})\b/.exec(data.year || '');
    return year ? this.yearEnd(Number(year[1]), now) : null;
  },

  // Only a year is known: assume the latest plausible date (so we never refresh too rarely)
  yearEnd(year, now) {
    const end = new Date(year, 11, 31);
    return end > now ? now : end;
  },

  ttlDays(data, now = new Date()) {
    if (!data || !data.found) return this.NOT_FOUND_TTL_DAYS;

    const released = this.releaseDate(data, now);
    if (!released) return 5;

    const yearRange = /^\d{4}\s*[–-]\s*$/.test((data.year || '').trim());
    if (yearRange) return 5; // still airing

    // Whole calendar months between release and now (current month = 0)
    const monthsAgo = (now.getFullYear() * 12 + now.getMonth()) -
                      (released.getFullYear() * 12 + released.getMonth());

    if (monthsAgo < 3) return 3;    // last 3 months incl. current (and upcoming)
    if (monthsAgo < 12) return 5;   // 3-12 months
    if (monthsAgo < 60) return 15;  // 1-5 years
    return 30;                      // older than 5 years
  },

  isFresh(entry, now = new Date()) {
    if (!entry || !entry.data || !entry.ts) return false;
    return now.getTime() - entry.ts < this.ttlDays(entry.data, now) * this.DAY;
  }
};

globalThis.StreamRatingsCachePolicy = CachePolicy;

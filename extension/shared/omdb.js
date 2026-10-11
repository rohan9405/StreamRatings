// OMDb lookup shared by the extension (service worker) and the shared-cache
// server (Cloudflare Worker), so both resolve titles identically.
// Exposes globalThis.StreamRatingsOmdb.

(function () {
  const OMDB_API_URL = "https://www.omdbapi.com/";

  // Cache key shared by the local and the shared cache: "inception:2010"
  function cacheKey(title, year) {
    return `${String(title).toLowerCase().trim()}:${year || ''}`;
  }

  async function omdbGet(apiKey, params) {
    const url = new URL(OMDB_API_URL);
    url.searchParams.append("apikey", apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.append(k, v);
    const res = await fetch(url.toString());
    // OMDb answers 401 for both a bad key and "Request limit reached!" - read the body to tell them apart
    const data = await res.json().catch(() => null);
    if (data && data.Response === "False" && /api key|limit reached/i.test(data.Error || "")) {
      throw new Error(`OMDb: ${data.Error}`);
    }
    if (res.status === 401) throw new Error("Invalid OMDb API key");
    if (!res.ok || !data) throw new Error(`OMDb HTTP ${res.status}`);
    return data;
  }

  // Exact title match first, then fuzzy match over OMDb search results
  async function lookup(title, year, apiKey) {
    let matchedData = await omdbGet(apiKey, year ? { t: title, y: year } : { t: title });
    let found = matchedData.Response === "True";

    if (!found) {
      // OMDb search needs words it indexes: "Lokah Chapter 1: Chandra" finds nothing, but
      // "Lokah" finds "Lokah Chapter One: Chandra". Matches are always scored against the
      // full title, so a broader query can't produce a looser match.
      for (const query of searchQueries(title)) {
        const searchData = await omdbGet(apiKey, { s: query });
        if (searchData.Response !== "True" || !searchData.Search || searchData.Search.length === 0) continue;
        const bestMatch = findBestMatch(title, searchData.Search);
        if (bestMatch) {
          matchedData = await omdbGet(apiKey, { i: bestMatch.imdbID });
          found = matchedData.Response === "True";
        }
        break;
      }
    }

    return {
      query: { title, year },
      found,
      title: found ? matchedData.Title : null,
      year: found ? matchedData.Year : null,
      genre: found ? matchedData.Genre : null,
      released: found ? matchedData.Released : null,
      type: found ? matchedData.Type : null,
      imdbRating: found ? matchedData.imdbRating : null,
      imdbVotes: found ? matchedData.imdbVotes : null,
      imdbID: found ? matchedData.imdbID : null,
      source: "omdb"
    };
  }

  // Full title, then (at most one) broader query: the first word if distinctive, else the
  // part before a subtitle separator. Keeps a miss to 2 searches.
  function searchQueries(title) {
    const queries = [title];
    const firstWord = title.split(/\s+/)[0];
    const mainPart = title.split(/\s*(?::|\s[-–]\s)\s*/)[0];
    const broader = firstWord.length >= 4 ? firstWord : mainPart;
    if (broader && broader.length >= 3 && broader.toLowerCase() !== title.toLowerCase()) {
      queries.push(broader);
    }
    return queries;
  }

  // Simple fuzzy matching: Levenshtein distance
  function levenshteinDistance(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    );
    for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }
    return track[str2.length][str1.length];
  }

  // Find best match from search results (same thresholds as the original backend)
  function findBestMatch(query, results) {
    if (!results || results.length === 0) return null;
    const q = query.toLowerCase();

    let bestMatch = results[0];
    let bestScore = levenshteinDistance(q, results[0].Title.toLowerCase());
    for (let i = 1; i < results.length && i < 5; i++) {
      const distance = levenshteinDistance(q, results[i].Title.toLowerCase());
      if (distance < bestScore) {
        bestScore = distance;
        bestMatch = results[i];
      }
    }

    const actualSimilarity = (query.length - bestScore) / query.length;
    const maxAllowedDistance = query.length < 5 ? 1 : Math.floor(query.length * 0.4);
    return actualSimilarity >= 0.5 && bestScore <= maxAllowedDistance ? bestMatch : null;
  }

  globalThis.StreamRatingsOmdb = { cacheKey, lookup };
})();

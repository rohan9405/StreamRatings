import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { checkRateLimit } from "./rateLimit";
import { z } from "zod";

const OMDB_API_URL = "https://www.omdbapi.com/";

// Simple fuzzy matching: Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

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

// Find best match from search results
function findBestMatch(query: string, results: any[]): any | null {
  if (!results || results.length === 0) return null;

  let bestMatch = results[0];
  let bestScore = levenshteinDistance(query.toLowerCase(), results[0].Title.toLowerCase());

  for (let i = 1; i < results.length; i++) {
    const distance = levenshteinDistance(query.toLowerCase(), results[i].Title.toLowerCase());
    if (distance < bestScore) {
      bestScore = distance;
      bestMatch = results[i];
    }
  }

  // Only accept if reasonably close (arbitrary threshold)
  return bestScore < Math.max(query.length / 2, 3) ? bestMatch : null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.get(api.omdb.get.path, async (req, res) => {
    // 1. Validate Secret
    const clientSecret = req.headers["x-streamratings-secret"];
    const serverSecret = process.env.STREAMRATINGS_SECRET;

    if (!serverSecret || clientSecret !== serverSecret) {
      return res.status(401).json({ message: "Invalid or missing secret" });
    }

    // 2. Rate Limit
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(String(ip))) {
      return res.status(429).json({ message: "Too many requests" });
    }

    // 3. Validate Input
    let input;
    try {
      input = api.omdb.get.input.parse(req.query);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      return res.status(400).json({ message: "Invalid input" });
    }

    const { title, year } = input;
    
    // Normalize key for caching: lowercase title + year
    const cacheKey = `${title.toLowerCase().trim()}:${year || ''}`;

    // 4. Check Cache
    const cached = await storage.getCachedRating(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // 5. Fetch from OMDb
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Server configuration error: OMDB_API_KEY missing" });
    }

    try {
      const url = new URL(OMDB_API_URL);
      url.searchParams.append("apikey", apiKey);
      url.searchParams.append("t", title);
      if (year) {
        url.searchParams.append("y", year);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      console.log(`[OMDb] Response for "${title}":`, {
        Response: data.Response,
        Title: data.Title,
        imdbRating: data.imdbRating,
        Error: data.Error
      });

      let found = data.Response === "True";
      let matchedData = data;

      // If exact match failed, try search API for fuzzy matching
      if (!found) {
        console.log(`[OMDb] Exact match failed for "${title}", trying search API...`);
        const searchUrl = new URL(OMDB_API_URL);
        searchUrl.searchParams.append("apikey", apiKey);
        searchUrl.searchParams.append("s", title);
        searchUrl.searchParams.append("type", "movie");

        const searchResponse = await fetch(searchUrl.toString());
        const searchData = await searchResponse.json();

        if (searchData.Response === "True" && searchData.Search && searchData.Search.length > 0) {
          const bestMatch = findBestMatch(title, searchData.Search);
          if (bestMatch) {
            console.log(`[OMDb] Found fuzzy match: "${bestMatch.Title}"`);
            // Fetch full details for the matched title
            const detailUrl = new URL(OMDB_API_URL);
            detailUrl.searchParams.append("apikey", apiKey);
            detailUrl.searchParams.append("i", bestMatch.imdbID);

            const detailResponse = await fetch(detailUrl.toString());
            matchedData = await detailResponse.json();
            found = matchedData.Response === "True";
          }
        }
      }

      const result = {
        query: { title, year },
        found,
        title: found ? matchedData.Title : null,
        year: found ? matchedData.Year : null,
        genre: found ? matchedData.Genre : null,
        imdbRating: found ? matchedData.imdbRating : null,
        imdbVotes: found ? matchedData.imdbVotes : null,
        imdbID: found ? matchedData.imdbID : null,
        source: "omdb" as const
      };

      // 6. Cache Result
      await storage.setCachedRating(cacheKey, result);

      res.json(result);
    } catch (error) {
      console.error("OMDb fetch error:", error);
      res.status(500).json({ message: "Failed to fetch from OMDb" });
    }
  });

  return httpServer;
}

import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { checkRateLimit } from "./rateLimit";
import { z } from "zod";

const OMDB_API_URL = "https://www.omdbapi.com/";

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

      const found = data.Response === "True";
      
      const result = {
        query: { title, year },
        found,
        title: found ? data.Title : null,
        year: found ? data.Year : null,
        imdbRating: found ? data.imdbRating : null,
        imdbVotes: found ? data.imdbVotes : null,
        imdbID: found ? data.imdbID : null,
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

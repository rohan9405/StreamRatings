import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We primarily use in-memory storage for the cache as requested,
// but we'll define a schema for potential future persistence and to satisfy the template.
export const queryCache = pgTable("query_cache", {
  id: serial("id").primaryKey(),
  queryKey: text("query_key").notNull().unique(), // normalizedTitle:year
  data: text("data").notNull(), // JSON stringified response
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQueryCacheSchema = createInsertSchema(queryCache);
export type QueryCacheItem = typeof queryCache.$inferSelect;
export type InsertQueryCacheItem = z.infer<typeof insertQueryCacheSchema>;

// === API CONTRACT TYPES ===

// Response from OMDb (and our API)
export const omdbResponseSchema = z.object({
  query: z.object({
    title: z.string(),
    year: z.string().optional(),
  }),
  found: z.boolean(),
  title: z.string().nullable(),
  year: z.string().nullable(),
  genre: z.string().nullable().optional(),
  released: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  imdbRating: z.string().nullable(),
  imdbVotes: z.string().nullable(),
  imdbID: z.string().nullable(),
  source: z.literal("omdb"),
});

export type OmdbResponse = z.infer<typeof omdbResponseSchema>;

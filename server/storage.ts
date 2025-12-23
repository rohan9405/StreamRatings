import { type OmdbResponse } from "@shared/schema";

export interface IStorage {
  getCachedRating(key: string): Promise<OmdbResponse | undefined>;
  setCachedRating(key: string, data: OmdbResponse): Promise<void>;
}

export class MemStorage implements IStorage {
  private cache: Map<string, { data: OmdbResponse; expires: number }>;
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.cache = new Map();
  }

  async getCachedRating(key: string): Promise<OmdbResponse | undefined> {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.data;
  }

  async setCachedRating(key: string, data: OmdbResponse): Promise<void> {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.TTL,
    });
  }
}

export const storage = new MemStorage();

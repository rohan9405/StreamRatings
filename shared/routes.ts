import { z } from 'zod';
import { omdbResponseSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  rateLimit: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  omdb: {
    get: {
      method: 'GET' as const,
      path: '/api/omdb',
      input: z.object({
        title: z.string().min(1).max(120),
        year: z.string().regex(/^\d{4}$/).optional(),
      }),
      responses: {
        200: omdbResponseSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        429: errorSchemas.rateLimit,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

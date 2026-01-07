import { z } from 'zod';
import { insertFeedSchema, feeds, articles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  feeds: {
    list: {
      method: 'GET' as const,
      path: '/api/feeds',
      responses: {
        200: z.array(z.custom<typeof feeds.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/feeds',
      input: z.object({ url: z.string().url() }),
      responses: {
        201: z.custom<typeof feeds.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/feeds/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    refresh: {
      method: 'POST' as const,
      path: '/api/feeds/refresh',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    importOpml: {
      method: 'POST' as const,
      path: '/api/feeds/import',
      input: z.object({ opml: z.string() }),
      responses: {
        200: z.object({ count: z.number() }),
        400: errorSchemas.validation,
      },
    }
  },
  articles: {
    list: {
      method: 'GET' as const,
      path: '/api/articles',
      input: z.object({
        feedId: z.string().optional(),
        isSaved: z.string().optional(),
        isRead: z.string().optional(),
        sort: z.enum(['date', 'feed']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof articles.$inferSelect & { feed: typeof feeds.$inferSelect }>()),
      },
    },
    markRead: {
      method: 'PATCH' as const,
      path: '/api/articles/:id/read',
      input: z.object({ isRead: z.boolean() }),
      responses: {
        200: z.custom<typeof articles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    toggleSaved: {
      method: 'PATCH' as const,
      path: '/api/articles/:id/save',
      input: z.object({ isSaved: z.boolean() }),
      responses: {
        200: z.custom<typeof articles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/articles/:id',
      responses: {
        200: z.custom<typeof articles.$inferSelect & { feed: typeof feeds.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    translate: {
      method: 'POST' as const,
      path: '/api/articles/:id/translate',
      responses: {
        200: z.object({ translation: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    summarize: {
      method: 'POST' as const,
      path: '/api/articles/:id/summarize',
      responses: {
        200: z.object({ script: z.string() }),
        404: errorSchemas.notFound,
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

import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

/**
 * Enables CORS for the HerNext frontend. Requests without an Origin header
 * (server-to-server, curl) are allowed; browser origins are limited to the
 * configured FRONTEND_URL origins (comma-separated, e.g. both the 5173 and
 * 5174 local dev servers).
 */
export function registerCors(app: FastifyInstance, frontendUrls: string[]): void {
  const allowedOrigins = new Set(frontendUrls.map((origin) => origin.replace(/\/+$/, '')));
  void app.register(cors, {
    credentials: true,
    // @fastify/cors defaults to 'GET,HEAD,POST'. Any other verb triggers a
    // browser preflight, and the preflight response is what the browser
    // checks: if the requested method is absent from Access-Control-Allow-
    // Methods the browser blocks the request outright and `fetch` rejects.
    // That silently broke PUT /profile and PATCH /roadmaps/tasks/:taskId
    // (the "Mark Complete" button), which surfaced only as a generic
    // "Something went wrong" because a blocked request never reaches a route
    // handler and so can produce no server-side error message.
    // These are the verbs the documented API actually uses. This advertises
    // which methods are allowed; it does not weaken authentication, which is
    // still enforced per route by the auth plugin.
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: (origin, callback) => {
      if (origin === undefined) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.has(origin.replace(/\/+$/, '')));
    },
  });
}
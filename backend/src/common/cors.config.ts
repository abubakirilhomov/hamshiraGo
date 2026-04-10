/**
 * Shared list of allowed CORS origins.
 * Used by both REST (main.ts) and WebSocket (order-events.gateway.ts).
 *
 * Extra origins can be added via CORS_ORIGINS env variable (comma-separated).
 */

const STATIC_ORIGINS: string[] = [
  // Production domains
  'https://hamshirago.uz',
  'https://www.hamshirago.uz',
  'https://app.hamshirago.uz',
  'https://medic.hamshirago.uz',
  'https://admin.hamshirago.uz',
  // Vercel deployments (legacy)
  'https://hamshirago-web.vercel.app',
  'https://hamshirago-web-medic.vercel.app',
  'https://hamshirago-admin.vercel.app',
  // Railway deployments (any subdomain)
  'https://web-production-d365f.up.railway.app',
  'https://admin-production-9727.up.railway.app',
  'https://web-medic-production.up.railway.app',
  // Local dev
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
];

// Dynamic origins from env (CORS_ORIGINS=https://foo.com,https://bar.com)
const envOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const ALLOWED_ORIGINS: string[] = [...STATIC_ORIGINS, ...envOrigins].filter(
  (v, i, a) => a.indexOf(v) === i, // dedupe
);

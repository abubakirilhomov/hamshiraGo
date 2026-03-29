/**
 * Shared list of allowed CORS origins.
 * Used by both REST (main.ts) and WebSocket (order-events.gateway.ts).
 */
export const ALLOWED_ORIGINS: string[] = [
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
  // Railway deployments
  'https://web-production-d365f.up.railway.app',
  'https://admin-production-9727.up.railway.app',
  'https://web-medic-production.up.railway.app',
  // Local dev
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:8081',
  'http://localhost:8082',
];

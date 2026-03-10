/** Centralized config — all magic numbers in one place */

// Location tracking
export const LOCATION_EMIT_INTERVAL_MS = 5_000;       // emit medic location every 5s
export const ROUTE_FETCH_THROTTLE_MS = 12_000;         // min gap between OSRM calls
export const FETCH_TIMEOUT_MS = 8_000;                 // abort fetch after 8s
export const BACKGROUND_LOCATION_INTERVAL_MS = 60_000; // background location every 60s
export const BACKGROUND_LOCATION_DISTANCE_M = 100;     // or every 100m

// Timers
export const PERMISSION_REMINDER_INTERVAL_MS = 5 * 60_000; // 5 min
export const ONLINE_IDLE_LIMIT_H = 5;                  // auto-offline after 5h idle

// OSRM
export const OSRM_URL =
  process.env.EXPO_PUBLIC_OSRM_URL?.replace(/\/$/, '') ||
  'https://router.project-osrm.org/route/v1/driving';

/**
 * Shared order types — used across medic app screens and components
 */

// ── Status ─────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'SERVICE_STARTED'
  | 'DONE'
  | 'CANCELED';

export const ACTIVE_STATUSES: OrderStatus[] = [
  'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED',
];

export const MAP_ACTIVE_STATUSES: OrderStatus[] = [
  'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED',
];

// ── Location ────────────────────────────────────────────────────────────────

export interface OrderLocation {
  house: string;
  floor: string | null;
  apartment: string | null;
  phone: string;
  latitude: number;
  longitude: number;
}

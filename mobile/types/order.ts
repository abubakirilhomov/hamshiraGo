/**
 * Shared order types — used across screens and components
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

export const STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: 'Создан',
  ASSIGNED: 'Назначен',
  ACCEPTED: 'Принят',
  ON_THE_WAY: 'В пути',
  ARRIVED: 'Прибыл',
  SERVICE_STARTED: 'Оказывается услуга',
  DONE: 'Выполнен',
  CANCELED: 'Отменён',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  CREATED: '#009B8D',   // Theme.primary
  ASSIGNED: '#F59E0B',  // Theme.warning
  ACCEPTED: '#F59E0B',
  ON_THE_WAY: '#F59E0B',
  ARRIVED: '#F59E0B',
  SERVICE_STARTED: '#7C3AED', // Theme.accent
  DONE: '#22C55E',       // Theme.success
  CANCELED: '#EF4444',   // Theme.error
};

export const ACTIVE_STATUSES: OrderStatus[] = [
  'CREATED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED',
];

// ── Order address — client location step ───────────────────────────────────
/**
 * Order address — client location step
 */
export interface OrderAddress {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  house: string;
  floor: string;
  apartment: string;
  phone: string;
}

export const DEFAULT_ORDER_ADDRESS: Partial<OrderAddress> = {
  house: '',
  floor: '',
  apartment: '',
  phone: '',
};

export function isAddressComplete(a: Partial<OrderAddress>): boolean {
  return (
    typeof a.latitude === 'number' &&
    typeof a.longitude === 'number' &&
    (a.house?.trim().length ?? 0) > 0 &&
    (a.phone?.trim().length ?? 0) >= 9
  );
}

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

/** Returns localized status labels using i18n `t` function */
export function getStatusLabel(t: (key: string) => string): Record<OrderStatus, string> {
  return {
    CREATED: t('order.status.CREATED'),
    ASSIGNED: t('order.status.ASSIGNED'),
    ACCEPTED: t('order.status.ACCEPTED'),
    ON_THE_WAY: t('order.status.ON_THE_WAY'),
    ARRIVED: t('order.status.ARRIVED'),
    SERVICE_STARTED: t('order.status.SERVICE_STARTED'),
    DONE: t('order.status.DONE'),
    CANCELED: t('order.status.CANCELED'),
  };
}

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

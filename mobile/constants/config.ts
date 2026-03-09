/** Centralized config — all magic numbers in one place */

/** GPS accuracy threshold in metres; above this value the signal is considered weak */
export const GPS_ACCURACY_THRESHOLD_METERS = 25;

/** Discount rate applied to the first order (10 %) */
export const FIRST_ORDER_DISCOUNT_RATE = 0.10;

/** Maximum number of orders fetched per page in the orders list */
export const ORDERS_PAGE_LIMIT = 50;

/** Maximum number of nearby medics returned by the discovery endpoint */
export const NEARBY_MEDICS_LIMIT = 10;

/** Milliseconds before a dispatch attempt is considered timed-out */
export const DISPATCH_TIMEOUT_MS = 60_000;

/**
 * HamshiraGo Design System — Client App
 *
 * Healthcare / medical nursing service in Uzbekistan.
 * Palette: professional teal-blue primary, warm accents, clean surfaces.
 * All existing keys are preserved for backward compatibility.
 */

/* ------------------------------------------------------------------ */
/*  Color palette                                                      */
/* ------------------------------------------------------------------ */

export const Theme = {
  /* --- brand --- */
  primary:      '#0C8C82',   // teal-600: trust, healthcare
  primaryDark:  '#0A706A',   // teal-700: pressed / header
  primaryLight: '#E6F5F3',   // teal-50:  tinted backgrounds
  accent:       '#14B8A6',   // teal-500: highlights, links

  /* --- semantic --- */
  success:  '#16A34A',   // green-600
  warning:  '#F59E0B',   // amber-500
  error:    '#DC2626',   // red-600
  info:     '#0284C7',   // sky-600

  /* --- surfaces --- */
  background:      '#F6F8FA',  // cool grey canvas
  surface:         '#FFFFFF',
  surfaceSecondary:'#F1F5F9',  // slate-100: cards, inputs
  overlay:         'rgba(15, 23, 42, 0.45)',

  /* --- text --- */
  text:          '#0F172A',   // slate-900
  textSecondary: '#64748B',   // slate-500
  textTertiary:  '#94A3B8',   // slate-400
  textInverse:   '#FFFFFF',

  /* --- borders / dividers --- */
  border:      '#E2E8F0',   // slate-200
  borderLight: '#F1F5F9',   // slate-100
  borderFocus: '#0C8C82',   // matches primary for focus rings

  /* --- gradient (LinearGradient `colors` prop) --- */
  bannerGradient: ['#0C8C82', '#0A706A'] as const,
  gradientWarm:   ['#0C8C82', '#14B8A6'] as const,

  /* --- status-specific (order flow) --- */
  statusCreated:  '#64748B',
  statusAssigned: '#F59E0B',
  statusAccepted: '#0284C7',
  statusOnTheWay: '#8B5CF6',
  statusArrived:  '#14B8A6',
  statusStarted:  '#0C8C82',
  statusDone:     '#16A34A',
  statusCanceled: '#DC2626',
} as const;

/* ------------------------------------------------------------------ */
/*  Border radius tokens                                               */
/* ------------------------------------------------------------------ */

export const Radius = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 9999,
} as const;

/* ------------------------------------------------------------------ */
/*  Spacing tokens (4-point grid)                                      */
/* ------------------------------------------------------------------ */

export const Spacing = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  xxxl:48,
} as const;

/* ------------------------------------------------------------------ */
/*  Typography scale                                                   */
/* ------------------------------------------------------------------ */

export const Typography = {
  /** Large screen title */
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  /** Section title */
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  /** Card title */
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  /** Sub-heading */
  h4: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  /** Default body */
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  /** Secondary body */
  bodySmall: { fontSize: 13, lineHeight: 20, fontWeight: '400' as const },
  /** Labels, badges */
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  /** Buttons */
  button: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
} as const;

/* ------------------------------------------------------------------ */
/*  Shadow presets (iOS + Android elevation)                           */
/* ------------------------------------------------------------------ */

export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

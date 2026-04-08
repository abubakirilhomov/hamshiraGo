/**
 * HamshiraGo Design System — "Clinical Sanctuary"
 *
 * Based on Google Stitch DESIGN.md specification.
 * Fonts: Manrope (headlines) + Inter (body/labels)
 * Colors: Medical trust teal with tonal surface layering.
 */

/* ------------------------------------------------------------------ */
/*  Fonts                                                              */
/* ------------------------------------------------------------------ */

export const Fonts = {
  manrope:    'Manrope_400Regular',
  manropeMd:  'Manrope_500Medium',
  manropeSb:  'Manrope_600SemiBold',
  manropeBd:  'Manrope_700Bold',
  manropeXb:  'Manrope_800ExtraBold',
  inter:      'Inter_400Regular',
  interMd:    'Inter_500Medium',
  interSb:    'Inter_600SemiBold',
} as const;

/* ------------------------------------------------------------------ */
/*  Color palette                                                      */
/* ------------------------------------------------------------------ */

export const Theme = {
  /* --- brand (Stitch: primary gradient #006860 → #008379) --- */
  primary:          '#006860',
  primaryContainer: '#008379',
  primaryDark:      '#004D47',
  primaryLight:     '#E0F5F2',
  accent:           '#008379',

  /* --- semantic --- */
  success:  '#16A34A',
  warning:  '#F59E0B',
  error:    '#DC2626',
  info:     '#0284C7',

  /* --- surfaces (tonal layering, "No-Line" rule) --- */
  background:            '#f8f9fb',
  surface:               '#ffffff',
  surfaceContainerLow:   '#f2f4f6',
  surfaceContainerHigh:  '#e8eaed',
  surfaceSecondary:      '#f2f4f6',
  surfaceBright:         'rgba(248,249,251,0.85)',
  overlay:               'rgba(25, 28, 30, 0.45)',

  /* --- text (on-surface: #191c1e, never pure black) --- */
  text:          '#191c1e',
  textSecondary: '#5f6368',
  textTertiary:  '#9aa0a6',
  textInverse:   '#ffffff',

  /* --- borders (ghost borders only, 20% opacity max) --- */
  border:      'rgba(188, 201, 198, 0.20)',
  borderLight: 'rgba(188, 201, 198, 0.12)',
  borderFocus: '#006860',

  /* --- gradients --- */
  primaryGradient: ['#006860', '#008379'] as const,
  bannerGradient:  ['#006860', '#004D47'] as const,
  gradientWarm:    ['#006860', '#008379'] as const,

  /* --- status (order flow) --- */
  statusCreated:  '#64748B',
  statusAssigned: '#F59E0B',
  statusAccepted: '#0284C7',
  statusOnTheWay: '#8B5CF6',
  statusArrived:  '#008379',
  statusStarted:  '#006860',
  statusDone:     '#16A34A',
  statusCanceled: '#DC2626',

  /* --- status container backgrounds (AAA contrast) --- */
  successContainer:   '#d4edda',
  warningContainer:   '#fff3cd',
  errorContainer:     '#f8d7da',
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
  xxxl: 48,
} as const;

/* ------------------------------------------------------------------ */
/*  Typography scale (Manrope headings, Inter body)                    */
/* ------------------------------------------------------------------ */

export const Typography = {
  /** Display — large welcome text */
  display: { fontSize: 32, lineHeight: 40, fontWeight: '800' as const, fontFamily: Fonts.manropeXb },
  /** Large screen title */
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const, fontFamily: Fonts.manropeBd },
  /** Section title */
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const, fontFamily: Fonts.manropeBd },
  /** Card title */
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const, fontFamily: Fonts.manropeSb },
  /** Sub-heading */
  h4: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, fontFamily: Fonts.manropeSb },
  /** Default body */
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const, fontFamily: Fonts.inter },
  /** Secondary body */
  bodySmall: { fontSize: 13, lineHeight: 20, fontWeight: '400' as const, fontFamily: Fonts.inter },
  /** Labels, badges */
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, fontFamily: Fonts.interMd },
  /** Buttons */
  button: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const, fontFamily: Fonts.manropeSb },
  /** Numeric values — dashboard/price feel */
  numeric: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const, fontFamily: Fonts.manropeBd },
  /** Input labels */
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, fontFamily: Fonts.interMd },
} as const;

/* ------------------------------------------------------------------ */
/*  Shadow presets — "Whisper" shadows (DESIGN.md)                     */
/* ------------------------------------------------------------------ */

export const Shadow = {
  /** Subtle — card on surface */
  sm: {
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  /** Medium — floating elements */
  md: {
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  /** Large — bottom nav, FABs */
  lg: {
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

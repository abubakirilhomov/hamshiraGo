import { StyleSheet } from 'react-native';
import { Theme, Radius, Spacing, Shadow } from '@/constants/Theme';

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
    gap: Spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: Theme.textSecondary,
  },
  backBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Theme.primary,
    borderRadius: Radius.md,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Header
  headerCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Theme.success}18`,
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xl,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.xs,
    backgroundColor: Theme.success,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.success,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.primary,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  urgentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.error,
  },
  urgentFeeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.error,
    marginTop: Spacing.xs,
  },

  // Section card
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Stepper
  step: {
    flexDirection: 'row',
    gap: 14,
  },
  stepLeft: {
    alignItems: 'center',
    width: 26,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 3,
  },
  stepRight: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 12,
    gap: 3,
  },
  stepLabel: {
    fontSize: 15,
  },
  stepActiveHint: {
    fontSize: 13,
    color: Theme.textSecondary,
  },

  // Medic
  medicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  medicAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor: `${Theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medicAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
  },
  medicInfo: {
    flex: 1,
    gap: 3,
  },
  medicName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.text,
  },

  // Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  mapWrap: {
    height: 220,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Theme.textSecondary,
    fontWeight: '600',
  },
  mapMeta: {
    fontSize: 12,
    color: Theme.textSecondary,
    marginLeft: 'auto',
  },

  // Marker styles
  clientMarkerWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.info,
  },
  clientMarkerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.info,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Shadow.md,
    shadowOpacity: 0.25,
  },
  medicMarkerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Shadow.md,
    shadowOpacity: 0.25,
  },
  markerEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  medicMarkerImg: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
  },

  // Dispatch status banner
  dispatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${Theme.primary}10`,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Theme.primary}25`,
  },
  dispatchBannerWaiting: {
    backgroundColor: `${Theme.warning}10`,
    borderColor: `${Theme.warning}25`,
  },
  dispatchBannerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dispatchBannerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.primary,
    flex: 1,
  },
  dispatchTimer: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.textSecondary,
    minWidth: 48,
    textAlign: 'right',
  },

  // Canceled banner
  canceledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${Theme.error}12`,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Theme.error}30`,
  },
  canceledText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.error,
  },
  canceledReason: {
    fontSize: 13,
    color: Theme.textSecondary,
    marginTop: 3,
  },

  // Buttons
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Theme.error,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.error,
  },
  doneBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  payBtn: {
    backgroundColor: Theme.success,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  payPaid: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.success,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xs,
  },
  favoriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Theme.primary,
    borderRadius: 14,
    padding: 14,
    marginTop: Spacing.xs,
    backgroundColor: `${Theme.primary}08`,
  },
  favoriteBtnActive: {
    borderColor: Theme.error,
    backgroundColor: `${Theme.error}08`,
  },
  favoriteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.primary,
  },

  // Candidate medic banner (dispatch contacting)
  candidateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 14,
    marginBottom: 10,
  },
  candidateAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  candidateAvatarImg: { width: 48, height: 48, borderRadius: Radius.xl },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 15, fontWeight: '700', color: Theme.text },
  candidateSubtitle: { fontSize: 12, color: Theme.textSecondary, marginTop: 2 },

  // Rating (submitted display)
  ratingDoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  clientReviewText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Theme.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },

  // Medic rating row
  medicRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  medicRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.primary,
  },
  medicReviewCount: {
    fontSize: 12,
    color: Theme.textSecondary,
  },
});

import { StyleSheet } from 'react-native';
import { Theme, Fonts, Radius, Shadow, Spacing } from '@/constants/Theme';

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
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },
  backBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Theme.primary,
    borderRadius: Radius.full,
  },
  backBtnText: {
    color: '#fff',
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    fontSize: 15,
  },

  /* Header card */
  headerCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  serviceTitle: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Theme.success}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.success,
  },
  liveText: {
    fontSize: 12,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.success,
  },
  priceText: {
    fontSize: 22,
    fontFamily: Fonts.manropeXb,
    fontWeight: '800',
    color: Theme.primary,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    marginBottom: 6,
  },
  urgentBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.error,
  },
  urgentFeeText: {
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.error,
    marginTop: Spacing.xs,
  },

  /* Section card */
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.interMd,
    fontWeight: '500',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Stepper */
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
    fontFamily: Fonts.inter,
  },
  stepActiveHint: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },

  /* Medic */
  medicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  medicAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medicAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
  },
  medicInfo: {
    flex: 1,
    gap: 3,
  },
  medicName: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.text,
  },

  /* Address */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  addressText: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    flex: 1,
    lineHeight: 20,
    color: Theme.textSecondary,
  },
  mapWrap: {
    height: 220,
    borderRadius: Radius.lg,
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
    fontFamily: Fonts.interMd,
    color: Theme.textSecondary,
  },
  mapMeta: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginLeft: 'auto',
  },

  /* Marker styles */
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

  /* Dispatch status banner */
  dispatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  dispatchBannerWaiting: {
    backgroundColor: Theme.warningContainer,
  },
  dispatchBannerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dispatchBannerLabel: {
    fontSize: 14,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.primary,
    flex: 1,
  },
  dispatchTimer: {
    fontSize: 13,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.textSecondary,
    minWidth: 48,
    textAlign: 'right',
  },

  /* Canceled banner */
  canceledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  canceledText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.error,
  },
  canceledReason: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: 3,
  },

  /* Buttons */
  cancelBtn: {
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.error,
  },
  doneBtn: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.full,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  doneBtnText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: '#fff',
  },
  payBtn: {
    backgroundColor: Theme.success,
    borderRadius: Radius.full,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  payBtnText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: '#fff',
  },
  payPaid: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
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
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xs,
  },
  favoriteBtnActive: {
    backgroundColor: Theme.errorContainer,
  },
  favoriteBtnText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.primary,
  },

  /* Candidate medic banner (dispatch contacting) */
  candidateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  candidateAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  candidateAvatarImg: { width: 48, height: 48, borderRadius: Radius.full },
  candidateInfo: { flex: 1 },
  candidateName: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.text,
  },
  candidateSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  /* Rating (submitted display) */
  ratingDoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  clientReviewText: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    fontStyle: 'italic',
    color: Theme.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },

  /* Medic rating row */
  medicRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  medicRatingText: {
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.primary,
  },
  medicReviewCount: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },
});

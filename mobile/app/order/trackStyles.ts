import { StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: Theme.textSecondary,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Theme.primary,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Header
  headerCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  urgentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  urgentFeeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 4,
  },

  // Section card
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
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
    borderRadius: 24,
    backgroundColor: `${Theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medicAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  mapWrap: {
    height: 220,
    borderRadius: 12,
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
    backgroundColor: '#2563eb',
  },
  clientMarkerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  medicMarkerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  medicMarkerImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // Dispatch status banner
  dispatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${Theme.primary}10`,
    borderRadius: 12,
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
    borderRadius: 12,
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
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.error,
  },
  doneBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  payBtn: {
    backgroundColor: Theme.success,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
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
    paddingVertical: 16,
    marginTop: 4,
  },

  // Candidate medic banner (dispatch contacting)
  candidateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    borderRadius: 24,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  candidateAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 15, fontWeight: '700', color: Theme.text },
  candidateSubtitle: { fontSize: 12, color: Theme.textSecondary, marginTop: 2 },

  // Rating (submitted display)
  ratingDoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
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
    gap: 4,
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

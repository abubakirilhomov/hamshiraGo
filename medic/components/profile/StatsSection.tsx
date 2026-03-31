import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';

interface StatsSectionProps {
  experienceYears: number;
  completedCount: number | null;
  ratingDisplay: string | null;
  reviewCount: number;
  balance: number;
  earnings: number;
  onRatingPress: () => void;
  t: (key: string) => string;
}

function StatsSectionInner({
  experienceYears,
  completedCount,
  ratingDisplay,
  reviewCount,
  balance,
  earnings,
  onRatingPress,
  t,
}: StatsSectionProps) {
  return (
    <>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{experienceYears}</Text>
          <Text style={styles.statLabel}>{t('profile.statExperience')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedCount ?? '\u2014'}</Text>
          <Text style={styles.statLabel}>{t('profile.statCompleted')}</Text>
        </View>
        {ratingDisplay != null && (
          <Pressable style={styles.statCard} onPress={onRatingPress}>
            <Text style={styles.statValue}>{ratingDisplay}</Text>
            <Text style={styles.statLabel}>{t('profile.statRating')}</Text>
            <Text style={styles.statReviewCount}>{reviewCount} {t('review.reviews')}</Text>
          </Pressable>
        )}
      </View>

      {/* Balance cards */}
      <View style={styles.balancesRow}>
        <View style={[styles.walletCard, styles.balanceHalf]}>
          <Text style={styles.walletLabel}>{t('profile.balance')}</Text>
          <Text style={styles.walletValue}>
            {Number(balance).toLocaleString('ru-RU')} UZS
          </Text>
          <Text style={styles.walletHint}>{t('profile.workDeposit')}</Text>
        </View>
        <View style={[styles.walletCard, styles.balanceHalf, styles.earningsCard]}>
          <Text style={styles.walletLabel}>{t('profile.earnings')}</Text>
          <Text style={[styles.walletValue, styles.earningsValue]}>
            {Number(earnings).toLocaleString('ru-RU')} UZS
          </Text>
          <Text style={styles.walletHint}>{t('profile.totalEarned')}</Text>
        </View>
      </View>
    </>
  );
}

export const StatsSection = React.memo(StatsSectionInner);

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  statValue: { fontSize: Typography.h2.fontSize, fontWeight: '700', color: Theme.primary },
  statLabel: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, marginTop: 2, textAlign: 'center' },
  statReviewCount: { fontSize: 10, color: Theme.textSecondary, textAlign: 'center', marginTop: 1 },
  balancesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  balanceHalf: { flex: 1, marginBottom: 0, marginHorizontal: 0, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  earningsCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac40',
  },
  walletCard: {
    backgroundColor: `${Theme.primary}10`,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Theme.primary}25`,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  walletLabel: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.textSecondary, marginBottom: Spacing.xs },
  walletValue: { fontSize: 17, fontWeight: '700', color: Theme.primary },
  walletHint: { fontSize: 11, color: Theme.textSecondary, marginTop: 2 },
  earningsValue: { color: '#16a34a' },
});

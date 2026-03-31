import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import type { VerificationStatus } from '@/context/AuthContext';

const VERIFICATION_CONFIG = {
  PENDING:  { labelKey: 'verification.statusPending',  color: '#f59e0b', icon: 'clock-o' as const,     bg: '#fef3c720', border: '#f59e0b40' },
  APPROVED: { labelKey: 'verification.statusApproved',  color: '#10b981', icon: 'check-circle' as const, bg: '#d1fae520', border: '#10b98140' },
  REJECTED: { labelKey: 'verification.statusRejected',  color: '#ef4444', icon: 'times-circle' as const, bg: '#fee2e220', border: '#ef444440' },
} as const;

interface VerificationCardProps {
  verificationStatus: VerificationStatus;
  onPress: () => void;
  t: (key: string) => string;
}

function VerificationCardInner({ verificationStatus, onPress, t }: VerificationCardProps) {
  const vStatus = (verificationStatus ?? 'PENDING') as keyof typeof VERIFICATION_CONFIG;
  const vConfig = VERIFICATION_CONFIG[vStatus];

  return (
    <Pressable
      style={[styles.verifyCard, { backgroundColor: vConfig.bg, borderColor: vConfig.border }]}
      onPress={onPress}
    >
      <FontAwesome name={vConfig.icon} size={20} color={vConfig.color} />
      <View style={styles.verifyTexts}>
        <Text style={[styles.verifyTitle, { color: vConfig.color }]}>{t(vConfig.labelKey)}</Text>
        <Text style={styles.verifyHint}>
          {vStatus === 'APPROVED'
            ? t('profile.verifiedHint')
            : t('profile.verifyHint')}
        </Text>
      </View>
      <FontAwesome name="chevron-right" size={13} color={vConfig.color} />
    </Pressable>
  );
}

export const VerificationCard = React.memo(VerificationCardInner);

const styles = StyleSheet.create({
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  verifyTexts: { flex: 1 },
  verifyTitle: { fontSize: Typography.body.fontSize, fontWeight: '700' },
  verifyHint: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, marginTop: 2 },
});

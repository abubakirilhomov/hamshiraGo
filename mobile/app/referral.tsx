import {
  ActivityIndicator,
  Clipboard,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface ReferralData {
  referralCode: string;
  referredCount: number;
  bonusPaidCount: number;
}

export default function ReferralScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<ReferralData>('/referrals/my', { token })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleCopy = () => {
    if (!data?.referralCode) return;
    Clipboard.setString(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!data?.referralCode) return;
    await Share.share({
      message: `${t('referral.bonus')}. ${t('referral.yourCode')}: ${data.referralCode}`,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>{t('referral.yourCode')}</Text>
        <Text style={styles.codeText}>{data?.referralCode ?? '—'}</Text>

        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.75 }]}
            onPress={handleCopy}
          >
            <FontAwesome name="copy" size={16} color={Theme.primary} />
            <Text style={styles.actionBtnText}>
              {copied ? t('referral.copied') : t('referral.copy')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnShare, pressed && { opacity: 0.75 }]}
            onPress={handleShare}
          >
            <FontAwesome name="share-alt" size={16} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>{t('referral.share')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bonusCard}>
        <FontAwesome name="gift" size={22} color={Theme.primary} style={{ marginBottom: 8 }} />
        <Text style={styles.bonusText}>{t('referral.bonus')}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>{t('referral.stats')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data?.referredCount ?? 0}</Text>
            <Text style={styles.statLabel}>{t('referral.stats')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data?.bonusPaidCount ?? 0}</Text>
            <Text style={styles.statLabel}>{t('referral.bonusPaid')}</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { padding: Spacing.lg, gap: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  codeCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.sm,
  },
  codeLabel: {
    fontSize: 13,
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 34,
    fontWeight: '800',
    color: Theme.primary,
    letterSpacing: 4,
    marginVertical: Spacing.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Theme.primary,
    backgroundColor: `${Theme.primary}10`,
  },
  actionBtnShare: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.primary,
  },

  bonusCard: {
    backgroundColor: `${Theme.primary}10`,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Theme.primary}30`,
  },
  bonusText: {
    fontSize: 14,
    color: Theme.text,
    textAlign: 'center',
    lineHeight: 20,
  },

  statsCard: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.md,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Theme.border,
  },
});

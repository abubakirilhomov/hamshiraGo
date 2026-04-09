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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow, Typography } from '@/constants/Theme';
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
  const insets = useSafeAreaInsets();
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
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>HamshiraGo</Text>
        <Pressable hitSlop={12}>
          <FontAwesome name="bell-o" size={22} color={Theme.text} />
        </Pressable>
      </View>

      {/* Gift icon */}
      <View style={styles.giftCircle}>
        <FontAwesome name="gift" size={30} color={Theme.textInverse} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Taklif dasturi</Text>
      <Text style={styles.subtitle}>
        {t('referral.bonus', "Do'stlaringizni taklif qiling va bonus oling")}
      </Text>

      {/* Referral code card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeText}>{data?.referralCode ?? 'HAMSHIRA-0000'}</Text>
        <Pressable
          style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
          onPress={handleCopy}
          hitSlop={8}
        >
          <FontAwesome
            name={copied ? 'check' : 'copy'}
            size={18}
            color={copied ? Theme.success : Theme.primary}
          />
        </Pressable>
      </View>

      {/* Share button */}
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
        onPress={handleShare}
      >
        <LinearGradient
          colors={Theme.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shareBtn}
        >
          <FontAwesome name="share-alt" size={16} color={Theme.textInverse} />
          <Text style={styles.shareBtnText}>Ulashing</Text>
        </LinearGradient>
      </Pressable>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, Shadow.sm]}>
          <Text style={styles.statValue}>{data?.referredCount ?? 0}</Text>
          <Text style={styles.statLabel}>{t('referral.stats', 'Taklif qilingan')}</Text>
        </View>
        <View style={[styles.statCard, Shadow.sm]}>
          <Text style={styles.statValue}>{data?.bonusPaidCount ?? 0}</Text>
          <Text style={styles.statLabel}>{t('referral.bonusPaid', 'Bonus berilgan')}</Text>
        </View>
      </View>

      {/* Campaign banner */}
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
        <LinearGradient
          colors={Theme.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.campaignBanner}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.campaignLabel}>CAMPAIGN</Text>
            <Text style={styles.campaignTitle}>
              {t('referral.bonus', "Do'stlaringizni taklif qiling va bonus oling")}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={Theme.textInverse} />
        </LinearGradient>
      </Pressable>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { paddingHorizontal: Spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  brand: {
    fontFamily: Fonts.manropeBd,
    fontSize: 20,
    color: Theme.primary,
  },

  giftCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },

  title: {
    fontFamily: Fonts.manropeBd,
    fontSize: 24,
    color: Theme.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },

  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Theme.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  codeText: {
    fontFamily: Fonts.manropeBd,
    fontSize: 22,
    color: Theme.text,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.full,
    marginBottom: Spacing.xl,
  },
  shareBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.textInverse,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontFamily: Fonts.manropeBd,
    fontSize: 28,
    color: Theme.primary,
  },
  statLabel: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textSecondary,
    textAlign: 'center',
  },

  campaignBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  campaignLabel: {
    fontFamily: Fonts.interMd,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  campaignTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 14,
    color: Theme.textInverse,
    lineHeight: 20,
  },
});

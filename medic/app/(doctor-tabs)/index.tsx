import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface Consultation {
  id: string;
  symptoms: string;
  priceAmount: number;
  status: string;
  created_at: string;
  client?: {
    id: string;
    name: string;
    phone: string;
  };
  slotStartsAt?: string;
}

export default function DoctorPendingScreen() {
  const { token, medic } = useAuth();
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setError(null);
      const res = await apiFetch<Consultation[]>('/consultations/doctor/pending', {
        token: token ?? undefined,
      });
      setConsultations(Array.isArray(res) ? res : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPending().finally(() => setLoading(false));
    }, [fetchPending]),
  );

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  }, [fetchPending]);

  const handleAccept = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/consultations/${id}/doctor-accept`, {
        method: 'POST',
        token: token ?? undefined,
      });
      router.push(`/doctor-consultation/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Qabul qilib bo\'lmadi');
    } finally {
      setActionLoading(null);
    }
  }, [token, router]);

  const handleDecline = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/consultations/${id}/doctor-decline`, {
        method: 'POST',
        token: token ?? undefined,
      });
      setConsultations((prev) => prev.filter((c) => c.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Rad qilib bo\'lmadi');
    } finally {
      setActionLoading(null);
    }
  }, [token]);

  const renderItem = useCallback(
    ({ item }: { item: Consultation }) => (
      <ConsultationCard
        consultation={item}
        onAccept={() => handleAccept(item.id)}
        onDecline={() => handleDecline(item.id)}
        loading={actionLoading === item.id}
      />
    ),
    [actionLoading, handleAccept, handleDecline],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const vStatus = medic?.verificationStatus ?? 'PENDING';
  const isNotApproved = vStatus !== 'APPROVED';

  return (
    <View style={styles.container}>
      {isNotApproved && (
        <View style={[styles.verifyBanner, vStatus === 'REJECTED' ? styles.verifyBannerRejected : styles.verifyBannerPending]}>
          <FontAwesome
            name={vStatus === 'REJECTED' ? 'times-circle' : 'clock-o'}
            size={15}
            color={vStatus === 'REJECTED' ? '#ef4444' : '#92400e'}
          />
          <Text style={[styles.verifyBannerText, vStatus === 'REJECTED' && { color: '#ef4444' }]}>
            {vStatus === 'REJECTED'
              ? 'Akkaunt rad etildi'
              : 'Akkaunt tekshirilmoqda'}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => { setError(null); fetchPending(); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Qayta urinish</Text>
          </Pressable>
        </View>
      )}

      <FlashList
        data={consultations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={consultations.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="stethoscope" size={48} color={Theme.border} />
            <Text style={styles.emptyTitle}>Hozircha konsultatsiya yo'q</Text>
            <Text style={styles.emptyHint}>Yangi so'rovlar bu yerda ko'rinadi</Text>
          </View>
        }
        renderItem={renderItem}
        estimatedItemSize={180}
      />
    </View>
  );
}

const ConsultationCard = React.memo(function ConsultationCard({
  consultation,
  onAccept,
  onDecline,
  loading,
}: {
  consultation: Consultation;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}) {
  const date = new Date(consultation.created_at);
  const timeStr = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.symptomsIconWrap}>
          <FontAwesome name="heartbeat" size={18} color={Theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.symptomsLabel}>Simptomlar</Text>
          <Text style={styles.symptomsText} numberOfLines={3}>
            {consultation.symptoms || 'Ko\'rsatilmagan'}
          </Text>
        </View>
      </View>

      {consultation.client && (
        <View style={styles.infoRow}>
          <FontAwesome name="user-o" size={13} color={Theme.textSecondary} />
          <Text style={styles.infoText}>{consultation.client.name}</Text>
        </View>
      )}

      {consultation.slotStartsAt && (
        <View style={styles.infoRow}>
          <FontAwesome name="calendar" size={13} color={Theme.textSecondary} />
          <Text style={styles.infoText}>
            {new Date(consultation.slotStartsAt).toLocaleString('uz-UZ', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.price}>
            {(consultation.priceAmount ?? 0).toLocaleString('uz-UZ')} UZS
          </Text>
          <Text style={styles.time}>{dateStr}, {timeStr}</Text>
        </View>
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.8 }]}
            onPress={onDecline}
            disabled={loading}
          >
            <Text style={styles.declineBtnText}>Rad etish</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptBtnWrap, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}
            onPress={onAccept}
            disabled={loading}
          >
            <LinearGradient
              colors={Theme.gradientWarm}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.acceptBtn}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.acceptBtnText}>Qabul qilish</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },
  listContent: { padding: Spacing.lg, gap: Spacing.md },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 80,
  },
  emptyTitle: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: Theme.text },
  emptyHint: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },

  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  verifyBannerPending: {
    backgroundColor: '#fef3c720',
    borderBottomColor: '#f59e0b40',
  },
  verifyBannerRejected: {
    backgroundColor: '#fee2e220',
    borderBottomColor: '#ef444440',
  },
  verifyBannerText: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: '#92400e',
  },

  errorBox: {
    margin: Spacing.md,
    padding: 14,
    backgroundColor: '#fee2e220',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#ef444440',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: { flex: 1, fontSize: Typography.bodySmall.fontSize, color: Theme.error },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.error,
    borderRadius: Radius.sm,
  },
  retryText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: '#fff' },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  symptomsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomsLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    color: Theme.text,
    lineHeight: 22,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: { flex: 1, fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.borderLight,
  },
  price: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.primary },
  time: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, marginTop: 2 },

  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  declineBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  declineBtnText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Theme.textSecondary,
  },
  acceptBtnWrap: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  acceptBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: '#fff',
  },
});

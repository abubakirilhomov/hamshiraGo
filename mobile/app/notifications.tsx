import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Text } from '@/components/Themed';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: 'message' | 'consultation' | 'order' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, string>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hamshirago_notifications';

const ICON_CONFIG: Record<
  Notification['type'],
  { name: React.ComponentProps<typeof FontAwesome>['name']; color: string; bg: string }
> = {
  message: { name: 'stethoscope', color: Theme.primary, bg: '#E0F5F2' },
  consultation: { name: 'calendar', color: '#D97706', bg: '#FEF3C7' },
  order: { name: 'medkit', color: Theme.primary, bg: '#E0F5F2' },
  system: { name: 'bell', color: Theme.textSecondary, bg: Theme.surfaceContainerLow },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Hozir';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} soat oldin`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Kecha';
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return date.toLocaleDateString('uz-UZ');
}

function getDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Bugun';
  if (diffDays === 1) return 'Kecha';
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notifications from AsyncStorage
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Notification[] = JSON.parse(raw).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
        // Sort newest first
        parsed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setNotifications(parsed);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Group by date
  const grouped = notifications.reduce<{ title: string; data: Notification[] }[]>(
    (acc, n) => {
      const group = getDateGroup(n.createdAt);
      const existing = acc.find((g) => g.title === group);
      if (existing) {
        existing.data.push(n);
      } else {
        acc.push({ title: group, data: [n] });
      }
      return acc;
    },
    [],
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  const renderNotificationCard = (item: Notification) => {
    const icon = ICON_CONFIG[item.type];
    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        onPress={() => {
          if (!item.isRead) markAsRead(item.id);
          // Navigate based on type
          if (item.data?.orderId) {
            router.push(`/order/track?orderId=${item.data.orderId}`);
          }
        }}
        onLongPress={() => deleteNotification(item.id)}
      >
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
          <FontAwesome name={icon.name} size={18} color={icon.color} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>

        {/* Unread dot */}
        {!item.isRead && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <FontAwesome name="bell-o" size={40} color={Theme.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>Bildirishnomalar yo'q</Text>
      <Text style={styles.emptySubtitle}>
        Yangi bildirishnomalar bu yerda ko'rinadi
      </Text>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={styles.skeletonContent}>
            <SkeletonLoader width="60%" height={14} borderRadius={6} />
            <SkeletonLoader
              width="90%"
              height={12}
              borderRadius={6}
              style={{ marginTop: 6 }}
            />
            <SkeletonLoader
              width="30%"
              height={10}
              borderRadius={6}
              style={{ marginTop: 6 }}
            />
          </View>
        </View>
      ))}
    </View>
  );

  // Build flat data with section headers
  const flatData: ({ _type: 'header'; title: string } | { _type: 'item'; notification: Notification })[] = [];
  for (const group of grouped) {
    flatData.push({ _type: 'header', title: group.title });
    for (const n of group.data) {
      flatData.push({ _type: 'item', notification: n });
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={16}>
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Bildirishnomalar</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={12}>
            <Text style={styles.markAllText}>Barchasini o'qish</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : notifications.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, index) =>
            item._type === 'header' ? `header-${item.title}` : item.notification.id
          }
          renderItem={({ item }) => {
            if (item._type === 'header') {
              return (
                <Text style={styles.sectionHeader}>{item.title}</Text>
              );
            }
            return renderNotificationCard(item.notification);
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: Fonts.manropeSb,
    color: Theme.primary,
  },

  /* List */
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.text,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  cardTime: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.info,
    marginTop: 6,
  },

  /* Empty */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
  },

  /* Skeleton */
  skeletonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  skeletonContent: {
    flex: 1,
    paddingTop: 2,
  },
});

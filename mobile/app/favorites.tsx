import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface FavoriteMedic {
  medicId: string;
  name: string;
  phone: string;
  rating: number | null;
  reviewCount?: number;
  profilePhotoUrl: string | null;
  experience?: string | null;
  skills?: string[];
  pricePerHour?: number | null;
}

export default function FavoritesScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [medics, setMedics] = useState<FavoriteMedic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch<FavoriteMedic[]>('/favorites', { token })
      .then(setMedics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconCircle}>
          <FontAwesome name="stethoscope" size={18} color={Theme.primary} />
        </View>
        <Text style={styles.headerTitle}>Sevimlilar</Text>
      </View>

      {/* ── Subtitle ── */}
      <View style={styles.subtitleBlock}>
        <Text style={styles.subtitleMain}>Sizning mutaxassislaringiz</Text>
        <Text style={styles.subtitleDesc}>
          Saqlangan hamshira va shifokorlar ro'yxati
        </Text>
      </View>

      {medics.length === 0 ? (
        /* ── Empty state ── */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <FontAwesome name="heart-o" size={40} color={Theme.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Sevimli hamshiralar yo'q</Text>
          <Text style={styles.emptyDesc}>
            Yurakcha belgisini bosib mutaxassislarni qo'shing
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={medics}
            keyExtractor={(item) => item.medicId}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => <MedicCard medic={item} />}
            ListFooterComponent={
              <View style={styles.bottomBanner}>
                <Text style={styles.bannerText}>Yangi mutaxassis qidirapsizmi?</Text>
                <Pressable onPress={() => router.push('/(tabs)')}>
                  <Text style={styles.bannerLink}>HAMMASINI KO'RISH</Text>
                </Pressable>
              </View>
            }
          />
        </>
      )}

      <View style={{ height: 100 }} />
    </View>
  );
}

// ─── Medic Card ──────────────────────────────────────────────────────────────

function MedicCard({ medic }: { medic: FavoriteMedic }) {
  const DEFAULT_SKILLS = ['Muolaja', 'Ukolar', 'Kardio', 'Massaj'];
  const skills = medic.skills && medic.skills.length > 0 ? medic.skills : DEFAULT_SKILLS;

  return (
    <View style={styles.card}>
      {/* Heart icon top-right */}
      <View style={styles.heartContainer}>
        <FontAwesome name="heart" size={16} color={Theme.primary} />
      </View>

      {/* Avatar + info row */}
      <View style={styles.cardTopRow}>
        <View style={styles.avatar}>
          {medic.profilePhotoUrl ? (
            <Image
              source={{ uri: medic.profilePhotoUrl }}
              style={styles.avatarImg}
              placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <FontAwesome name="user-md" size={24} color={Theme.primary} />
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{medic.name}</Text>
          <Text style={styles.cardExperience}>
            {medic.experience ?? '3+ yil tajriba'}
          </Text>
          {medic.rating != null && (
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={13} color={Theme.warning} />
              <Text style={styles.ratingScore}>{Number(medic.rating).toFixed(1)}</Text>
              <Text style={styles.ratingCount}>
                ({medic.reviewCount ?? 0} sharhlar)
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Skill pills */}
      <View style={styles.skillsRow}>
        {skills.slice(0, 4).map((skill, i) => (
          <View key={i} style={styles.skillPill}>
            <Text style={styles.skillPillText}>{skill}</Text>
          </View>
        ))}
      </View>

      {/* Price row */}
      {medic.pricePerHour != null && (
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>
            {medic.pricePerHour.toLocaleString('ru-RU')} so'm
          </Text>
          <Text style={styles.priceUnit}>/soat</Text>
        </View>
      )}

      {/* Book button */}
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        <LinearGradient
          colors={['#006860', '#008379']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bookBtn}
        >
          <Text style={styles.bookBtnText}>Band qilish</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
    paddingHorizontal: Spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.background,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Theme.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },

  // ── Subtitle ──
  subtitleBlock: {
    marginBottom: Spacing.lg,
    gap: 4,
  },
  subtitleMain: {
    fontSize: 22,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  subtitleDesc: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },

  // ── List ──
  listContent: {
    paddingBottom: 20,
  },

  // ── Card ──
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
    position: 'relative',
  },
  heartContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingRight: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Theme.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    color: Theme.text,
  },
  cardExperience: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingScore: {
    fontSize: 13,
    fontFamily: Fonts.manropeSb,
    color: Theme.text,
  },
  ratingCount: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },

  // ── Skills ──
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    backgroundColor: Theme.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  skillPillText: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },

  // ── Price ──
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceValue: {
    fontSize: 15,
    fontFamily: Fonts.interMd,
    color: Theme.text,
  },
  priceUnit: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },

  // ── Book button ──
  bookBtn: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: Radius.full,
  },
  bookBtnText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    color: '#fff',
  },

  // ── Bottom banner ──
  bottomBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  bannerText: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },
  bannerLink: {
    fontSize: 14,
    fontFamily: Fonts.manropeBd,
    color: Theme.primary,
    letterSpacing: 0.5,
  },

  // ── Empty state ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: Spacing.md,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

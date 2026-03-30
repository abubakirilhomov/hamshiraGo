import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface FavoriteMedic {
  medicId: string;
  name: string;
  phone: string;
  rating: number | null;
  profilePhotoUrl: string | null;
}

export default function FavoritesScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
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

  if (medics.length === 0) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="heart-o" size={48} color={Theme.border} />
        <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={medics}
      keyExtractor={(item) => item.medicId}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <MedicCard medic={item} />}
    />
  );
}

function MedicCard({ medic }: { medic: FavoriteMedic }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        {medic.profilePhotoUrl ? (
          <Image source={{ uri: medic.profilePhotoUrl }} style={styles.avatarImg} />
        ) : (
          <FontAwesome name="user-md" size={26} color={Theme.primary} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{medic.name}</Text>
        {medic.rating != null && (
          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={13} color={Theme.warning} />
            <Text style={styles.rating}>{Number(medic.rating).toFixed(1)}</Text>
          </View>
        )}
        <Text style={styles.phone}>{medic.phone}</Text>
      </View>
      <FontAwesome name="heart" size={18} color={Theme.error} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: Theme.textSecondary,
    textAlign: 'center',
  },
  list: {
    padding: 16,
    gap: 10,
    backgroundColor: Theme.background,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textSecondary,
  },
  phone: {
    fontSize: 13,
    color: Theme.textSecondary,
  },
});

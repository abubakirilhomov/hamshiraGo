import { Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { OrderStatus, STATUS_COLOR, STATUS_LABEL } from '@/types/order';

interface OrderLocation {
  house: string;
  floor: string | null;
  apartment: string | null;
  phone: string;
}

export interface OrderCardItem {
  id: string;
  serviceTitle: string;
  priceAmount: number;
  discountAmount: number;
  status: OrderStatus;
  location: OrderLocation | null;
  created_at: string;
}

interface OrderCardProps {
  order: OrderCardItem;
  isActive: boolean;
}

export default function OrderCard({ order, isActive }: OrderCardProps) {
  const router = useRouter();
  const finalPrice = order.priceAmount - (order.discountAmount ?? 0);
  const statusColor = STATUS_COLOR[order.status] ?? Theme.textSecondary;
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => isActive
        ? router.push({ pathname: '/order/track', params: { orderId: order.id } })
        : undefined
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.serviceTitle}>{order.serviceTitle}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABEL[order.status]}
          </Text>
        </View>
      </View>

      {order.location && (
        <View style={styles.cardRow}>
          <FontAwesome name="map-marker" size={13} color={Theme.textSecondary} />
          <Text style={styles.cardRowText} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
            {order.location.house}
            {order.location.floor ? `, эт. ${order.location.floor}` : ''}
            {order.location.apartment ? `, кв. ${order.location.apartment}` : ''}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.price}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
        <View style={styles.cardFooterRight}>
          <Text style={styles.date} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
            {dateStr}
          </Text>
          {isActive && (
            <FontAwesome name="chevron-right" size={12} color={Theme.textSecondary} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardRowText: {
    fontSize: 13,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  cardFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.primary,
  },
  date: {
    fontSize: 12,
  },
});

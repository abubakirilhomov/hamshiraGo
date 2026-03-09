import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import type { AvailableOrder } from '@/hooks/useMedicOrderFeed';

interface Props {
  order: AvailableOrder;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function NewOrderBanner({ order, onAccept, onDismiss }: Props) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    // Slide in
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }).start(onDismiss);
    }, 5000);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finalPrice = order.priceAmount - (order.discountAmount ?? 0);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={styles.bannerLeft}>
        <View style={styles.bannerIconWrap}>
          <FontAwesome name="bell" size={18} color="#fff" />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle} numberOfLines={1}>{order.serviceTitle}</Text>
          <Text style={styles.bannerPrice}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
        </View>
      </View>
      <View style={styles.bannerActions}>
        <Pressable
          style={styles.bannerAcceptBtn}
          onPress={onAccept}
        >
          <Text style={styles.bannerAcceptText}>{t('dispatch.accept')}</Text>
        </Pressable>
        <Pressable style={styles.bannerCloseBtn} onPress={onDismiss}>
          <FontAwesome name="times" size={14} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    gap: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  bannerPrice: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  bannerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerAcceptBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bannerAcceptText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  bannerCloseBtn: {
    padding: 6,
  },
});

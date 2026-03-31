import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Spacing } from '@/constants/Theme';
import type { OrderStatus } from '@/types/order';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackActionsProps {
  orderStatus: OrderStatus;
  mustRate: boolean;
  payStatus: 'idle' | 'paid';
  isFavorite: boolean;
  favoriteLoading: boolean;
  hasMedic: boolean;
  onCancel: () => void;
  onFavoriteToggle: () => void;
  onPay: () => void;
  onGoToOrders: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

function TrackActions({
  orderStatus,
  mustRate,
  payStatus,
  isFavorite,
  favoriteLoading,
  hasMedic,
  onCancel,
  onFavoriteToggle,
  onPay,
  onGoToOrders,
}: TrackActionsProps) {
  const { t } = useTranslation();

  const isDone = orderStatus === 'DONE';
  const isCanceled = orderStatus === 'CANCELED';
  const isActive = !isDone && !isCanceled;

  return (
    <>
      {/* Cancel button */}
      {isActive && (orderStatus === 'CREATED' || orderStatus === 'ASSIGNED') && (
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
          onPress={onCancel}
        >
          <Text style={styles.cancelBtnText}>{t('track.cancelOrder')}</Text>
        </Pressable>
      )}

      {/* Favorite toggle */}
      {isDone && !mustRate && hasMedic && (
        <Pressable
          style={({ pressed }) => [
            styles.favoriteBtn,
            isFavorite && styles.favoriteBtnActive,
            pressed && { opacity: 0.75 },
          ]}
          onPress={onFavoriteToggle}
          disabled={favoriteLoading}
        >
          <FontAwesome
            name={isFavorite ? 'heart' : 'heart-o'}
            size={16}
            color={isFavorite ? Theme.error : Theme.primary}
          />
          <Text style={[styles.favoriteBtnText, isFavorite && { color: Theme.error }]}>
            {isFavorite ? t('favorites.remove') : t('favorites.add')}
          </Text>
        </Pressable>
      )}

      {/* Pay button */}
      {isDone && !mustRate && (
        payStatus === 'paid' ? (
          <Text style={styles.payPaid}>{t('payment.paid')}</Text>
        ) : (
          <Pressable style={styles.payBtn} onPress={onPay}>
            <Text style={styles.payBtnText}>{t('payment.pay')}</Text>
          </Pressable>
        )
      )}

      {/* Back to orders */}
      {(isDone || isCanceled) && !mustRate && (
        <Pressable
          style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
          onPress={onGoToOrders}
        >
          <Text style={styles.doneBtnText}>{t('track.toMyOrders')}</Text>
        </Pressable>
      )}
    </>
  );
}

export default React.memo(TrackActions);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Theme.error,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.error,
  },
  doneBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  payBtn: {
    backgroundColor: Theme.success,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  payPaid: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.success,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xs,
  },
  favoriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Theme.primary,
    borderRadius: 14,
    padding: 14,
    marginTop: Spacing.xs,
    backgroundColor: `${Theme.primary}08`,
  },
  favoriteBtnActive: {
    borderColor: Theme.error,
    backgroundColor: `${Theme.error}08`,
  },
  favoriteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.primary,
  },
});

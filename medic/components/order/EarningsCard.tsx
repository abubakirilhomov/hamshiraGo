import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';

interface EarningsCardProps {
  serviceTitle: string;
  date: string;
  priceAmount: number;
  isUrgent: boolean;
  urgentFee: number;
  discountAmount: number;
  platformFee: number;
  medicEarnings: number;
  t: (key: string) => string;
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

function EarningsCardInner({
  serviceTitle,
  date,
  priceAmount,
  isUrgent,
  urgentFee,
  discountAmount,
  platformFee,
  medicEarnings,
  t,
}: EarningsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('orders.service')}</Text>
      <Text style={styles.serviceTitle}>{serviceTitle}</Text>
      <View style={styles.divider} />
      <Row label={t('orders.createdAt')} value={date} />
      <Row
        label={t('orders.serviceCost')}
        value={`${priceAmount.toLocaleString('ru-RU')} UZS`}
      />
      {isUrgent && urgentFee > 0 && (
        <Row
          label={t('urgent.fee')}
          value={`+${urgentFee.toLocaleString('ru-RU')} UZS`}
          valueColor='#dc2626'
        />
      )}
      {discountAmount > 0 && (
        <Row
          label={t('orders.clientDiscount')}
          value={`\u2212${discountAmount.toLocaleString('ru-RU')} UZS`}
          valueColor={Theme.success}
        />
      )}
      <Row
        label={`${t('orders.commission')} (10%)`}
        value={`\u2212${platformFee.toLocaleString('ru-RU')} UZS`}
        valueColor={Theme.textSecondary}
      />
      <View style={styles.finalRow}>
        <Text style={styles.finalLabel}>{t('orders.netEarnings')}</Text>
        <Text style={styles.finalValue}>
          {medicEarnings.toLocaleString('ru-RU')} UZS
        </Text>
      </View>
    </View>
  );
}

export const EarningsCard = React.memo(EarningsCardInner);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: Spacing.md,
    gap: 0,
  },
  cardTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  serviceTitle: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: Theme.text },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: Spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rowLabel: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },
  rowValue: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.text },
  finalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    marginTop: Spacing.xs,
  },
  finalLabel: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.text },
  finalValue: { fontSize: 17, fontWeight: '700', color: Theme.primary },
});

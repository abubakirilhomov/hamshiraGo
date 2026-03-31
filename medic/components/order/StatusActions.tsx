import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import type { OrderStatus } from '@/types/order';
import { SwipeActionButton } from '@/components/SwipeActionButton';

const STATUS_COLOR: Record<OrderStatus, string> = {
  CREATED:         Theme.primary,
  ASSIGNED:        Theme.warning,
  ACCEPTED:        Theme.warning,
  ON_THE_WAY:      Theme.warning,
  ARRIVED:         Theme.warning,
  SERVICE_STARTED: Theme.accent,
  DONE:            Theme.success,
  CANCELED:        Theme.error,
};

interface StatusActionsProps {
  status: OrderStatus;
  nextStep: { status: OrderStatus; labelKey: string } | undefined;
  updating: boolean;
  wsConnected: boolean;
  lastLocationSentAt: string | null;
  sentLocationCount: number;
  onNextStatus: () => void;
  t: (key: string) => string;
}

function StatusActionsInner({
  status,
  nextStep,
  updating,
  wsConnected,
  lastLocationSentAt,
  sentLocationCount,
  onNextStatus,
  t,
}: StatusActionsProps) {
  const statusColor = STATUS_COLOR[status];

  return (
    <>
      {/* Status badge */}
      <View
        style={[
          styles.statusBlock,
          { backgroundColor: `${statusColor}12`, borderColor: `${statusColor}30` },
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${t(`orders.status.${status}`)}`}
      >
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusLabel, { color: statusColor }]}>
          {t(`orders.status.${status}`)}
        </Text>
      </View>

      {/* Live tracking card (ON_THE_WAY only) */}
      {status === 'ON_THE_WAY' && (
        <View style={styles.liveTrackingCard}>
          <View style={styles.liveTrackingRow}>
            <View
              style={[
                styles.liveTrackingDot,
                { backgroundColor: wsConnected ? Theme.success : Theme.warning },
              ]}
            />
            <Text style={styles.liveTrackingText}>
              {wsConnected
                ? t('orders.liveTracking')
                : t('orders.liveTrackingConnecting')}
            </Text>
          </View>
          {lastLocationSentAt && (
            <Text style={styles.liveTrackingMeta}>
              {t('orders.lastSent')}:{' '}
              {new Date(lastLocationSentAt).toLocaleTimeString('ru-RU')} · {t('orders.points')}:{' '}
              {sentLocationCount}
            </Text>
          )}
        </View>
      )}

      {/* Next action button */}
      {nextStep && !updating && (
        <SwipeActionButton
          label={t(nextStep.labelKey)}
          color={nextStep.status === 'DONE' ? Theme.success : Theme.primary}
          onConfirm={onNextStatus}
          disabled={updating}
        />
      )}
      {nextStep && updating && (
        <View style={[styles.actionBtn, { backgroundColor: nextStep.status === 'DONE' ? Theme.success : Theme.primary }]} accessibilityLabel={t(nextStep.labelKey)}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {/* Completed / canceled note */}
      {(status === 'DONE' || status === 'CANCELED') && (
        <View style={styles.completedNote}>
          <FontAwesome
            name={status === 'DONE' ? 'check-circle' : 'times-circle'}
            size={20}
            color={statusColor}
          />
          <Text style={[styles.completedText, { color: statusColor }]}>
            {t(`orders.status.${status}`)}
          </Text>
        </View>
      )}
    </>
  );
}

export const StatusActions = React.memo(StatusActionsInner);

const styles = StyleSheet.create({
  statusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: Spacing.lg,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: Typography.body.fontSize, fontWeight: '700' },
  liveTrackingCard: {
    marginBottom: 14,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: `${Theme.primary}10`,
    borderWidth: 1,
    borderColor: `${Theme.primary}25`,
  },
  liveTrackingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  liveTrackingDot: { width: 8, height: 8, borderRadius: Radius.xs },
  liveTrackingText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.text },
  liveTrackingMeta: { marginTop: 6, fontSize: Typography.caption.fontSize, color: Theme.textSecondary },
  actionBtn: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  completedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  completedText: { fontSize: Typography.body.fontSize, fontWeight: '600' },
});

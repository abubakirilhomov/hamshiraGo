import React from 'react';
import { StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import type { OrderStatus } from '@/types/order';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProgressStepperProps {
  currentStatus: OrderStatus;
}

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS: { status: OrderStatus; labelKey: string; icon: string }[] = [
  { status: 'CREATED', labelKey: 'track.stepCreated', icon: 'file-text-o' },
  { status: 'ASSIGNED', labelKey: 'track.stepAssigned', icon: 'user' },
  { status: 'ACCEPTED', labelKey: 'track.stepAccepted', icon: 'check-circle-o' },
  { status: 'ON_THE_WAY', labelKey: 'track.stepOnTheWay', icon: 'car' },
  { status: 'ARRIVED', labelKey: 'track.stepArrived', icon: 'map-marker' },
  { status: 'SERVICE_STARTED', labelKey: 'track.stepServiceStarted', icon: 'heartbeat' },
  { status: 'DONE', labelKey: 'track.stepDone', icon: 'check-circle' },
];

const STATUS_INDEX: Partial<Record<OrderStatus, number>> = Object.fromEntries(
  STEPS.map((s, i) => [s.status, i]),
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStepHint(t: (key: string) => string, status: OrderStatus): string {
  switch (status) {
    case 'CREATED': return t('track.hintCreated');
    case 'ASSIGNED': return t('track.hintAssigned');
    case 'ACCEPTED': return t('track.hintAccepted');
    case 'ON_THE_WAY': return t('track.hintOnTheWay');
    case 'ARRIVED': return t('track.hintArrived');
    case 'SERVICE_STARTED': return t('track.hintServiceStarted');
    case 'DONE': return t('track.hintDone');
    default: return '';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

function ProgressStepper({ currentStatus }: ProgressStepperProps) {
  const { t } = useTranslation();
  const currentIdx = STATUS_INDEX[currentStatus] ?? 0;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('track.orderStatus')}</Text>
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const future = idx > currentIdx;
        const lineColor = done ? Theme.primary : Theme.border;
        const circleColor = active ? Theme.primary : done ? Theme.primary : Theme.border;
        const labelColor = future ? Theme.textSecondary : Theme.text;
        return (
          <View key={step.status} style={styles.step} accessibilityLabel={`${t(step.labelKey)}, ${active ? 'текущий шаг' : done ? 'завершён' : 'ожидается'}`}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepCircle, { borderColor: circleColor, backgroundColor: (done || active) ? circleColor : 'transparent' }]}>
                {done
                  ? <FontAwesome name="check" size={10} color="#fff" />
                  : <FontAwesome name={step.icon as keyof typeof FontAwesome.glyphMap} size={11} color={active ? '#fff' : Theme.border} />
                }
              </View>
              {idx < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: lineColor }]} />}
            </View>
            <View style={styles.stepRight}>
              <Text style={[styles.stepLabel, { color: labelColor, fontWeight: active ? '700' : '400' }]}>{t(step.labelKey)}</Text>
              {active && <Text style={styles.stepActiveHint}>{getStepHint(t, step.status)}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default React.memo(ProgressStepper);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
  },
  stepLeft: {
    alignItems: 'center',
    width: 26,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 3,
  },
  stepRight: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: Spacing.md,
    gap: 3,
  },
  stepLabel: {
    fontSize: 15,
  },
  stepActiveHint: {
    fontSize: 13,
    color: Theme.textSecondary,
  },
});

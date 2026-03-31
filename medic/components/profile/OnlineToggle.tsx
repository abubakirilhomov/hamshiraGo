import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';

interface OnlineToggleProps {
  isOnline: boolean;
  onToggle: (value: boolean) => void;
  loading: boolean;
  onlineLabel: string;
  offlineLabel: string;
  onlineHint: string;
  offlineHint: string;
  /** Whether background location ("Always") permission is active */
  hasAlwaysLocation: boolean;
  /** Labels for the location warning card */
  alwaysLocationOffLabel: string;
  alwaysLocationMsg: string;
  allowAlwaysLabel: string;
  onEnableAlwaysLocation: () => void;
}

function OnlineToggleInner({
  isOnline,
  onToggle,
  loading,
  onlineLabel,
  offlineLabel,
  onlineHint,
  offlineHint,
  hasAlwaysLocation,
  alwaysLocationOffLabel,
  alwaysLocationMsg,
  allowAlwaysLabel,
  onEnableAlwaysLocation,
}: OnlineToggleProps) {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.onlineRow}>
          <View style={styles.onlineInfo}>
            <View style={[styles.dot, { backgroundColor: isOnline ? Theme.success : Theme.textSecondary }]} />
            <View>
              <Text style={styles.onlineLabel}>
                {isOnline ? onlineLabel : offlineLabel}
              </Text>
              <Text style={styles.onlineHint}>
                {isOnline ? onlineHint : offlineHint}
              </Text>
            </View>
          </View>
          {loading ? (
            <ActivityIndicator color={Theme.primary} />
          ) : (
            <Switch
              value={isOnline}
              onValueChange={onToggle}
              trackColor={{ false: Theme.border, true: `${Theme.primary}80` }}
              thumbColor={isOnline ? Theme.primary : Theme.textSecondary}
              accessibilityLabel="Переключить онлайн статус"
              accessibilityRole="switch"
              accessibilityState={{ checked: isOnline }}
            />
          )}
        </View>
      </View>

      {isOnline && !hasAlwaysLocation && (
        <View style={[styles.card, styles.locationWarningCard]}>
          <View style={styles.warningRow}>
            <FontAwesome name="exclamation-triangle" size={16} color="#92400e" />
            <Text style={styles.warningTitle}>{alwaysLocationOffLabel}</Text>
          </View>
          <Text style={styles.warningText}>{alwaysLocationMsg}</Text>
          <Pressable
            style={({ pressed }) => [styles.warningBtn, pressed && { opacity: 0.85 }]}
            onPress={onEnableAlwaysLocation}
          >
            <Text style={styles.warningBtnText}>{allowAlwaysLabel}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

export const OnlineToggle = React.memo(OnlineToggleInner);

const styles = StyleSheet.create({
  card: {
    margin: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
  onlineLabel: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.text },
  onlineHint: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary, marginTop: 2 },
  locationWarningCard: {
    marginTop: -4,
    backgroundColor: '#fef3c720',
    borderColor: '#f59e0b40',
  },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  warningTitle: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700', color: '#92400e' },
  warningText: { fontSize: Typography.bodySmall.fontSize, lineHeight: 18, color: '#78350f', marginBottom: Spacing.md },
  warningBtn: {
    backgroundColor: Theme.warning,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  warningBtnText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700', color: '#fff' },
});

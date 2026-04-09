import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing } from '@/constants/Theme';

interface SalomatDisclaimerProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function SalomatDisclaimer({ visible, onAccept, onDecline }: SalomatDisclaimerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <FontAwesome name="heartbeat" size={28} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Salomat haqida</Text>

          {/* Body text */}
          <Text style={styles.bodyText}>
            Salomat — AI-yordamchi, shifokor emas. Uning maslahatlari axborot
            xarakteriga ega. Shoshilinch holatlarda 103 ga qo'ng'iroq qiling.
          </Text>

          <Text style={styles.bodyTextSecondary}>
            Xabarlar Anthropic Claude texnologiyasi yordamida qayta ishlanadi.
          </Text>

          {/* Accept button */}
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            onPress={onAccept}
          >
            <LinearGradient
              colors={Theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.acceptButton}
            >
              <Text style={styles.acceptText}>Roziman</Text>
            </LinearGradient>
          </Pressable>

          {/* Decline button */}
          <Pressable
            style={({ pressed }) => [styles.declineButton, pressed && { opacity: 0.6 }]}
            onPress={onDecline}
          >
            <Text style={styles.declineText}>Bekor qilish</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Theme.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: Spacing.md,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  bodyTextSecondary: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  acceptButton: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  acceptText: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: '#fff',
  },
  declineButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  declineText: {
    fontSize: 14,
    fontFamily: Fonts.interMd,
    color: Theme.textTertiary,
  },
});

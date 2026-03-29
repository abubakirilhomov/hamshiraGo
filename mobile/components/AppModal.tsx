import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/constants/Theme';

export interface AppModalButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface Props {
  visible: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  buttons?: AppModalButton[];
  onClose?: () => void;
}

/**
 * Custom modal replacing system Alert.alert.
 * Usage:
 *   <AppModal
 *     visible={show}
 *     title="Выйти?"
 *     message="Вы будете отключены от аккаунта."
 *     buttons={[
 *       { text: 'Отмена', style: 'cancel', onPress: () => setShow(false) },
 *       { text: 'Выйти', style: 'destructive', onPress: logout },
 *     ]}
 *     onClose={() => setShow(false)}
 *   />
 */
export default function AppModal({ visible, title, message, children, buttons, onClose }: Props) {
  const btns: AppModalButton[] = buttons?.length
    ? buttons
    : [{ text: 'OK', style: 'default', onPress: onClose }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.box} onStartShouldSetResponder={() => true}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}

          <View style={[styles.btnRow, btns.length > 2 && styles.btnRowColumn]}>
            {btns.map((btn, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.btn,
                  btns.length === 2 && styles.btnHalf,
                  btns.length > 2 && styles.btnFull,
                  btn.style === 'cancel' && styles.btnCancel,
                  btn.style === 'destructive' && styles.btnDestructive,
                  btn.style === 'default' && styles.btnPrimary,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => { btn.onPress?.(); }}
              >
                <Text
                  style={[
                    styles.btnText,
                    btn.style === 'cancel' && styles.btnTextCancel,
                    btn.style === 'destructive' && styles.btnTextDestructive,
                    btn.style === 'default' && styles.btnTextDefault,
                  ]}
                >
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btnRowColumn: {
    flexDirection: 'column',
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnHalf: { flex: 1 },
  btnFull: { width: '100%' },
  btnCancel: {
    backgroundColor: '#f3f4f6',
  },
  btnDestructive: {
    backgroundColor: '#fee2e2',
  },
  btnPrimary: {
    backgroundColor: Theme.primary,
  },
  btnPressed: { opacity: 0.75 },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnTextCancel: { color: '#374151' },
  btnTextDestructive: { color: '#ef4444' },
  btnTextDefault: { color: '#fff' },
});

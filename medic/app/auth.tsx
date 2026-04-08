import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/utils/analytics';

type Mode = 'login' | 'register';

type LoginRole = 'medic' | 'doctor';

export default function AuthScreen() {
  const { login, loginDoctor, register } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('login');
  const [loginRole, setLoginRole] = useState<LoginRole>('medic');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError(t('auth.errorPhonePassword'));
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError(t('auth.errorNameRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errorPasswordLength'));
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        if (loginRole === 'doctor') {
          await loginDoctor(phone.trim(), password);
          trackEvent('login_doctor').catch(() => {});
        } else {
          await login(phone.trim(), password);
          trackEvent('login').catch(() => {});
        }
      } else {
        const years = parseInt(experienceYears) || 0;
        await register(phone.trim(), password, name.trim(), years);
        trackEvent('register').catch(() => {});
      }
    } catch (e: unknown) {
      const raw = (e instanceof Error ? e.message : '').toLowerCase();
      if (raw.includes('password') || raw.includes('number invalid') || raw.includes('invalid credentials')) {
        setError(t('auth.errorInvalidCreds'));
      } else if (raw.includes('blocked')) {
        setError(t('auth.errorBlocked'));
      } else if (raw.includes('already') || raw.includes('duplicate') || raw.includes('unique')) {
        setError(t('auth.errorDuplicate'));
      } else {
        setError((e instanceof Error ? e.message : '') || t('auth.errorGeneral'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={Theme.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.logoWrap}>
            <FontAwesome name="stethoscope" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>HamshiraGo</Text>
          <Text style={styles.appTagline}>{t('auth.tagline')}</Text>
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => { setMode('login'); setError(null); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'login' }}
              accessibilityLabel={t('auth.login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                {t('auth.login')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => { setMode('register'); setError(null); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'register' }}
              accessibilityLabel={t('auth.register')}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                {t('auth.register')}
              </Text>
            </Pressable>
          </View>

          {mode === 'login' && (
            <View style={styles.roleRow}>
              <Pressable
                style={[styles.roleBtn, loginRole === 'medic' && styles.roleBtnActive]}
                onPress={() => { setLoginRole('medic'); setError(null); }}
              >
                <FontAwesome name="plus-square" size={14} color={loginRole === 'medic' ? Theme.primary : Theme.textSecondary} />
                <Text style={[styles.roleBtnText, loginRole === 'medic' && styles.roleBtnTextActive]}>
                  {t('auth.roleMedic', { defaultValue: 'Hamshira' })}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleBtn, loginRole === 'doctor' && styles.roleBtnActive]}
                onPress={() => { setLoginRole('doctor'); setError(null); }}
              >
                <FontAwesome name="stethoscope" size={14} color={loginRole === 'doctor' ? Theme.primary : Theme.textSecondary} />
                <Text style={[styles.roleBtnText, loginRole === 'doctor' && styles.roleBtnTextActive]}>
                  {t('auth.roleDoctor', { defaultValue: 'Doktor' })}
                </Text>
              </Pressable>
            </View>
          )}

          {mode === 'register' && (
            <>
              <Text style={styles.label}>{t('auth.name')} *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.namePlaceholder')}
                placeholderTextColor={Theme.textSecondary}
                autoCapitalize="words"
                accessibilityLabel="Имя"
              />
              <Text style={styles.label}>{t('auth.experienceYears')}</Text>
              <TextInput
                style={styles.input}
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="3"
                placeholderTextColor={Theme.textSecondary}
                keyboardType="number-pad"
                accessibilityLabel="Опыт работы в годах"
              />
            </>
          )}

          <Text style={styles.label}>{t('auth.phone')} *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phonePlaceholder')}
            placeholderTextColor={Theme.textSecondary}
            testID="auth_phone_input"
            keyboardType="phone-pad"
            accessibilityLabel="Телефон"
          />

          <Text style={styles.label}>{t('auth.password')} *</Text>
          <TextInput
            testID="auth_password_input"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={Theme.textSecondary}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Пароль"
          />

          {error && (
            <View style={styles.errorBox}>
              <FontAwesome name="exclamation-circle" size={14} color={Theme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            testID="auth_submit_button"
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.submitBtnPressed,
              loading && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={mode === 'login' ? t('auth.login') : t('auth.register')}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? t('auth.login') : t('auth.register')}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scroll: { flexGrow: 1 },
  header: {
    paddingTop: 80,
    paddingBottom: 48,
    alignItems: 'center',
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: { fontSize: Typography.h1.fontSize, fontWeight: '700', color: '#fff' },
  appTagline: { fontSize: Typography.body.fontSize, color: 'rgba(255,255,255,0.85)', marginTop: Spacing.xs },
  card: {
    margin: Spacing.lg,
    marginTop: -Spacing.xl,
    backgroundColor: Theme.surface,
    borderRadius: Radius.xl,
    padding: 20,
    ...Shadow.lg,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Theme.background,
    borderRadius: Radius.sm,
    padding: Spacing.xs,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  tabText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.textSecondary },
  tabTextActive: { color: Theme.primary },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Theme.border,
    backgroundColor: Theme.background,
  },
  roleBtnActive: {
    borderColor: Theme.primary,
    backgroundColor: `${Theme.primary}12`,
  },
  roleBtnText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    color: Theme.textSecondary,
  },
  roleBtnTextActive: {
    color: Theme.primary,
    fontWeight: '700',
  },
  label: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: Typography.body.fontSize,
    color: Theme.text,
    marginBottom: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Theme.error}12`,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: Typography.caption.fontSize, color: Theme.error },
  submitBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  submitBtnPressed: { opacity: 0.9 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});

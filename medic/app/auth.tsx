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
import { FontAwesome6 } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/utils/analytics';

type Mode = 'login' | 'register';

type LoginRole = 'medic' | 'doctor';

export default function AuthScreen() {
  const { login, loginDoctor, register } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar: HamshiraGo + ? icon */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>HamshiraGo</Text>
          <View style={styles.helpIcon}>
            <FontAwesome name="question" size={14} color={Theme.textSecondary} />
          </View>
        </View>

        {/* Medkit icon */}
        <View style={styles.iconWrap}>
          <FontAwesome6 name="kit-medical" size={40} color={Theme.primary} />
        </View>

        {/* Welcome title */}
        <Text style={styles.welcomeTitle}>Xush kelibsiz!</Text>
        <Text style={styles.welcomeSubtitle}>{t('auth.tagline')}</Text>

        {/* Form card */}
        <View style={styles.card}>
          {/* Login / Register toggle */}
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

          {/* Hamshira / Doktor toggle */}
          {mode === 'login' && (
            <View style={styles.roleRow}>
              <Pressable
                style={[styles.roleBtn, loginRole === 'medic' && styles.roleBtnActive]}
                onPress={() => { setLoginRole('medic'); setError(null); }}
              >
                <FontAwesome name="plus-square" size={14} color={loginRole === 'medic' ? Theme.primary : Theme.textTertiary} />
                <Text style={[styles.roleBtnText, loginRole === 'medic' && styles.roleBtnTextActive]}>
                  {t('auth.roleMedic', { defaultValue: 'Hamshira' })}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleBtn, loginRole === 'doctor' && styles.roleBtnActive]}
                onPress={() => { setLoginRole('doctor'); setError(null); }}
              >
                <FontAwesome name="stethoscope" size={14} color={loginRole === 'doctor' ? Theme.primary : Theme.textTertiary} />
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
                placeholderTextColor={Theme.textTertiary}
                autoCapitalize="words"
                accessibilityLabel="Ism"
              />
              <Text style={styles.label}>{t('auth.experienceYears')}</Text>
              <TextInput
                style={styles.input}
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="3"
                placeholderTextColor={Theme.textTertiary}
                keyboardType="number-pad"
                accessibilityLabel="Tajriba yillari"
              />
            </>
          )}

          <Text style={styles.label}>{t('auth.phone')} *</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+998</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('auth.phonePlaceholder')}
              placeholderTextColor={Theme.textTertiary}
              testID="auth_phone_input"
              keyboardType="phone-pad"
              accessibilityLabel="Telefon"
            />
          </View>

          <Text style={styles.label}>{t('auth.password')} *</Text>
          <TextInput
            testID="auth_password_input"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={Theme.textTertiary}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Parol"
          />

          {error && (
            <View style={styles.errorBox}>
              <FontAwesome name="exclamation-circle" size={14} color={Theme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Gradient pill CTA */}
          <Pressable
            testID="auth_submit_button"
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={mode === 'login' ? t('auth.login') : t('auth.register')}
          >
            <LinearGradient
              colors={Theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? t('auth.login') : t('auth.register')}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* YOKI divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>YOKI</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Ghost secondary button */}
          <Pressable
            style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          >
            <Text style={styles.ghostBtnText}>
              {mode === 'login' ? t('auth.register') : t('auth.login')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  topBarTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: 22,
    color: Theme.text,
  },
  helpIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },

  welcomeTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: 26,
    color: Theme.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    ...Typography.body,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: 20,
    ...Shadow.sm,
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
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
  tabText: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textSecondary,
  },
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
    borderRadius: Radius.md,
    backgroundColor: Theme.surfaceContainerLow,
  },
  roleBtnActive: {
    backgroundColor: Theme.primaryLight,
  },
  roleBtnText: {
    fontFamily: Fonts.interMd,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textSecondary,
  },
  roleBtnTextActive: {
    color: Theme.primary,
    fontFamily: Fonts.interSb,
  },

  label: {
    fontFamily: Fonts.interMd,
    fontSize: Typography.label.fontSize,
    color: Theme.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: Fonts.inter,
    fontSize: Typography.body.fontSize,
    color: Theme.text,
    marginBottom: 14,
  },

  phoneRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 14,
  },
  phonePrefix: {
    backgroundColor: Theme.surfaceContainerHigh,
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontFamily: Fonts.interSb,
    fontSize: Typography.body.fontSize,
    color: Theme.textSecondary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Theme.surfaceContainerLow,
    borderTopRightRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: Fonts.inter,
    fontSize: Typography.body.fontSize,
    color: Theme.text,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.inter,
    fontSize: Typography.caption.fontSize,
    color: Theme.error,
  },

  submitBtn: {
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.button.fontSize,
    color: Theme.textInverse,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.surfaceContainerHigh,
  },
  dividerText: {
    fontFamily: Fonts.interMd,
    fontSize: Typography.caption.fontSize,
    color: Theme.textTertiary,
  },

  ghostBtn: {
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    backgroundColor: Theme.surfaceContainerLow,
  },
  ghostBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.button.fontSize,
    color: Theme.primary,
  },
});

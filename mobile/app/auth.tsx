import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, Radius, Spacing, Shadow, Fonts, Typography } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/constants/api';
import { trackEvent } from '@/utils/analytics';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralExpanded, setReferralExpanded] = useState(false);
  const [referralStatus, setReferralStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError(t('auth.errorPhonePassword'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errorPasswordLength'));
      return;
    }
    const fullPhone = phone.trim().startsWith('+998') ? phone.trim() : `+998${phone.trim()}`;
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(fullPhone, password);
        trackEvent('login').catch(() => {});
      } else {
        await register(fullPhone, password, name.trim() || undefined, referralCode.trim() || undefined);
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

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setReferralCode('');
    setReferralStatus('idle');
    setReferralExpanded(false);
  };

  const handleReferralBlur = async () => {
    const code = referralCode.trim();
    if (!code) { setReferralStatus('idle'); return; }
    try {
      await apiFetch(`/referrals/validate/${encodeURIComponent(code)}`);
      setReferralStatus('valid');
    } catch {
      setReferralStatus('invalid');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>HamshiraGo</Text>
          <View style={styles.helpCircle}>
            <FontAwesome name="question" size={14} color={Theme.textSecondary} />
          </View>
        </View>

        {/* Green medkit icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <FontAwesome name="medkit" size={26} color="#fff" />
          </View>
        </View>

        {/* Welcome text */}
        <Text style={styles.welcomeTitle}>Xush kelibsiz!</Text>
        <Text style={styles.welcomeSubtitle}>
          Tibbiy xizmatlarni boshqarish uchun tizimga kiring
        </Text>

        {/* Form card */}
        <View style={styles.card}>
          {/* Name (register only) */}
          {mode === 'register' && (
            <>
              <Text style={styles.label}>{t('auth.name')}</Text>
              <TextInput
                testID="auth_name_input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.namePlaceholder')}
                placeholderTextColor={Theme.textTertiary}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Ism"
              />
            </>
          )}

          {/* Phone */}
          <Text style={styles.label}>Telefon raqami</Text>
          <View style={styles.inputRow}>
            <Text style={styles.phonePrefix}>+998</Text>
            <TextInput
              style={styles.inputInRow}
              value={phone}
              onChangeText={setPhone}
              placeholder="90 123 45 67"
              placeholderTextColor={Theme.textTertiary}
              keyboardType="phone-pad"
              testID="auth_phone_input"
              autoComplete="tel"
              returnKeyType="next"
              maxLength={9}
              accessibilityLabel="Telefon"
            />
          </View>

          {/* Password */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Parol</Text>
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              accessibilityLabel="Parolni ko'rsatish"
            >
              <FontAwesome
                name={showPassword ? 'eye' : 'eye-slash'}
                size={16}
                color={Theme.textTertiary}
              />
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Kamida 6 ta belgi"
            placeholderTextColor={Theme.textTertiary}
            testID="auth_password_input"
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Parol"
          />

          {/* Referral code (register mode) */}
          {mode === 'register' && (
            <>
              <Pressable
                style={styles.referralToggle}
                onPress={() => setReferralExpanded((v) => !v)}
              >
                <View style={styles.referralToggleLeft}>
                  <Text style={styles.referralToggleText}>Referal kod</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalBadgeText}>IXTIYORIY</Text>
                  </View>
                </View>
                <FontAwesome
                  name={referralExpanded ? 'chevron-up' : 'chevron-down'}
                  size={11}
                  color={Theme.textTertiary}
                />
              </Pressable>
              {referralExpanded && (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      referralStatus === 'invalid' && styles.inputError,
                      referralStatus === 'valid' && styles.inputSuccess,
                    ]}
                    value={referralCode}
                    onChangeText={(v) => { setReferralCode(v.toUpperCase()); setReferralStatus('idle'); }}
                    onBlur={handleReferralBlur}
                    placeholder="XXXXXXXX"
                    placeholderTextColor={Theme.textTertiary}
                    autoCapitalize="characters"
                    maxLength={16}
                    accessibilityLabel="Referal kod"
                  />
                  {referralStatus === 'valid' && (
                    <Text style={[styles.referralHint, { color: Theme.success }]}>
                      {t('referral.codeValid')}
                    </Text>
                  )}
                  {referralStatus === 'invalid' && (
                    <Text style={[styles.referralHint, { color: Theme.error }]}>
                      {t('referral.codeInvalid')}
                    </Text>
                  )}
                </>
              )}
            </>
          )}

          {/* Forgot password (login mode) */}
          {mode === 'login' && (
            <Pressable style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Parolni unutdingizmi?</Text>
            </Pressable>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <FontAwesome name="exclamation-circle" size={14} color={Theme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit button */}
          <Pressable
            testID="auth_submit_button"
            style={({ pressed }) => [
              styles.submitBtnOuter,
              pressed && styles.submitBtnPressed,
              loading && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
          >
            <LinearGradient
              colors={Theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>YOKI</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Secondary / toggle button */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={toggleMode}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryBtnText}>
            {mode === 'login' ? "Ro'yxatdan o'tish" : 'Kirish'}
          </Text>
        </Pressable>

        {/* Footer legal text */}
        <Text style={styles.footerText}>
          Tizimga kirish orqali siz bizning{' '}
          <Text style={styles.footerLink}>Foydalanish shartlari</Text>
          {' '}va{' '}
          <Text style={styles.footerLink}>Maxfiylik siyosatimiz</Text>
          ga rozilik bildirasiz.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  scroll: {
    flexGrow: 1,
  },

  /* ---- Top bar ---- */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  topBarTitle: {
    fontSize: 20,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  helpCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Icon ---- */
  iconWrap: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Welcome text ---- */
  welcomeTitle: {
    fontSize: 26,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
  },

  /* ---- Form card ---- */
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: 24,
    ...Shadow.sm,
  },

  /* ---- Labels ---- */
  label: {
    ...Typography.label,
    color: Theme.text,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  /* ---- Inputs (no borders, tonal contrast) ---- */
  input: {
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.inter,
    color: Theme.text,
    marginBottom: 16,
  },
  inputError: {
    backgroundColor: '#fef2f2',
  },
  inputSuccess: {
    backgroundColor: '#f0fdf4',
  },

  /* ---- Phone input with prefix ---- */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    marginBottom: 16,
  },
  phonePrefix: {
    fontSize: 16,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    paddingLeft: 16,
    paddingRight: 4,
  },
  inputInRow: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.inter,
    color: Theme.text,
  },

  /* ---- Referral toggle ---- */
  referralToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 4,
  },
  referralToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralToggleText: {
    fontSize: 14,
    fontFamily: Fonts.interMd,
    color: Theme.textSecondary,
  },
  optionalBadge: {
    backgroundColor: Theme.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  optionalBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.interSb,
    color: Theme.primary,
    letterSpacing: 0.5,
  },
  referralHint: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    marginTop: -12,
    marginBottom: 10,
  },

  /* ---- Forgot password ---- */
  forgotWrap: {
    alignItems: 'flex-end',
    marginBottom: 8,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: Fonts.interMd,
    color: Theme.primary,
  },

  /* ---- Error ---- */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.error,
  },

  /* ---- Submit button (gradient pill) ---- */
  submitBtnOuter: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  submitBtnGradient: {
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnPressed: { opacity: 0.9 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    ...Typography.button,
    color: '#fff',
  },

  /* ---- OR divider ---- */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.surfaceContainerHigh,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: Fonts.interMd,
    color: Theme.textTertiary,
    marginHorizontal: 12,
    letterSpacing: 1,
  },

  /* ---- Secondary (ghost) button ---- */
  secondaryBtn: {
    marginHorizontal: Spacing.lg,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...Typography.button,
    color: Theme.primary,
  },

  /* ---- Footer ---- */
  footerText: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: Spacing.xxl,
    lineHeight: 18,
  },
  footerLink: {
    textDecorationLine: 'underline',
    color: Theme.textSecondary,
  },
});

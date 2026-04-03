import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text, View } from '@/components/Themed';
import { Theme, Radius, Spacing, Shadow } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/constants/api';
import { trackEvent } from '@/utils/analytics';

type Mode = 'login' | 'register';

export default function AuthScreen() {
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
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(phone.trim(), password);
        trackEvent('login').catch(() => {});
      } else {
        await register(phone.trim(), password, name.trim() || undefined, referralCode.trim() || undefined);
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
            <FontAwesome name="medkit" size={36} color="#fff" />
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

          {mode === 'register' && (
            <>
              <Text style={styles.label}>{t('auth.name')}</Text>
              <TextInput
                testID="auth_name_input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.namePlaceholder')}
                placeholderTextColor={Theme.textSecondary}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Имя"
              />
            </>
          )}

          <Text style={styles.label}>{t('auth.phone')}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phonePlaceholder')}
            placeholderTextColor={Theme.textSecondary}
            keyboardType="phone-pad"
            testID="auth_phone_input"
            autoComplete="tel"
            returnKeyType="next"
            accessibilityLabel="Телефон"
          />

          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={Theme.textSecondary}
            testID="auth_password_input"
            secureTextEntry={!__DEV__}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Пароль"
          />

          {mode === 'register' && (
            <>
              <Pressable style={styles.referralToggle} onPress={() => setReferralExpanded((v) => !v)}>
                <Text style={styles.referralToggleText}>{t('referral.hasCode')}</Text>
                <FontAwesome name={referralExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={Theme.textSecondary} />
              </Pressable>
              {referralExpanded && (
                <>
                  <TextInput
                    style={[styles.input, referralStatus === 'invalid' && { borderColor: Theme.error }, referralStatus === 'valid' && { borderColor: Theme.success }]}
                    value={referralCode}
                    onChangeText={(v) => { setReferralCode(v.toUpperCase()); setReferralStatus('idle'); }}
                    onBlur={handleReferralBlur}
                    placeholder="XXXXXXXX"
                    placeholderTextColor={Theme.textSecondary}
                    autoCapitalize="characters"
                    maxLength={16}
                    accessibilityLabel="Реферальный код"
                  />
                  {referralStatus === 'valid' && (
                    <Text style={[styles.referralHint, { color: Theme.success }]}>{t('referral.codeValid')}</Text>
                  )}
                  {referralStatus === 'invalid' && (
                    <Text style={[styles.referralHint, { color: Theme.error }]}>{t('referral.codeInvalid')}</Text>
                  )}
                </>
              )}
            </>
          )}

          {error && (
            <View style={styles.errorBox}>
              <FontAwesome name="exclamation-circle" size={14} color={Theme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            testID="auth_submit_button"
            style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, loading && styles.submitBtnDisabled]}
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

          <Pressable onPress={toggleMode} style={styles.switchLink}>
            <Text style={styles.switchText} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
              {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
            </Text>
          </Pressable>
        </View>
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
  header: {
    paddingTop: 80,
    paddingBottom: Spacing.xxxl,
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
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  appTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
  },
  card: {
    margin: Spacing.lg,
    marginTop: -24,
    backgroundColor: Theme.surface,
    borderRadius: Radius.xl,
    padding: 20,
    ...Shadow.lg,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Theme.background,
    borderRadius: 10,
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
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textSecondary,
  },
  tabTextActive: {
    color: Theme.primary,
  },
  label: {
    fontSize: 13,
    color: Theme.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,

    fontSize: 16,
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
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Theme.error,
  },
  submitBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  submitBtnPressed: { opacity: 0.9 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  switchLink: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  switchText: {
    fontSize: 14,
  },
  switchTextBold: {
    fontWeight: '600',
  },
  referralToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 2,
  },
  referralToggleText: {
    fontSize: 13,
    color: Theme.textSecondary,
  },
  referralHint: {
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
});

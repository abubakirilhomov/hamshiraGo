import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/i18n';

export default function LanguagePickerScreen() {
  const { setLanguage } = useLanguage();
  const router = useRouter();

  const pick = async (lang: Language) => {
    await setLanguage(lang);
    router.replace('/auth');
  };

  return (
    <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.container}>
      <Text style={styles.title}>Tilni tanlang{'\n'}Выберите язык</Text>

      <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={() => pick('uz')}>
        <Text style={styles.flag}>🇺🇿</Text>
        <Text style={styles.btnLabel}>O'zbek tili</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={() => pick('ru')}>
        <Text style={styles.flag}>🇷🇺</Text>
        <Text style={styles.btnLabel}>Русский язык</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  btn: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  btnPressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  flag: {
    fontSize: 48,
  },
  btnLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

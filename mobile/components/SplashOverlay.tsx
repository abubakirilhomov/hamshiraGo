import { Image, StyleSheet, Text, View } from 'react-native';
import { Theme, Radius, Spacing } from '@/constants/Theme';

export function SplashOverlay() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>HamshiraGo</Text>
      <Text style={styles.sub}>by tezcode.ai</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: Radius.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.primary,
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: 14,
    color: Theme.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

import { Image, StyleSheet, Text, View } from 'react-native';
import { Radius, Spacing, Typography, Theme } from '@/constants/Theme';

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
    backgroundColor: Theme.primary,
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
    fontSize: Typography.h1.fontSize,
    fontWeight: '700',
    color: Theme.textInverse,
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: Typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

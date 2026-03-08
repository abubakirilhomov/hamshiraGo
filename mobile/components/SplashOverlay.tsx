import { Image, StyleSheet, Text, View } from 'react-native';

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
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0d9488',
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

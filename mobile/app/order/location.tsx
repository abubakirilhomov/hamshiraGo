import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState, memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/Theme';
import type { OrderAddress } from '@/types/order';
import { useAuth } from '@/context/AuthContext';
import { GPS_ACCURACY_THRESHOLD_METERS } from '@/constants/config';

const LocationMapComponent: React.ComponentType<any> =
  Platform.OS === 'web'
    ? () => null
    : memo(require('@/components/LocationMap').LocationMap);

export default function OrderLocationScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const initialPinSetRef = useRef(false);
  const [address, setAddress] = useState<Partial<OrderAddress>>({
    house: '',
    floor: '',
    apartment: '',
    phone: '',
  });

  const isWeakGps = accuracyMeters != null && accuracyMeters > GPS_ACCURACY_THRESHOLD_METERS;
  const displayCoords = pin ?? coords;

  const fetchLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      const acc = loc.coords.accuracy ?? null;
      setCoords({ latitude, longitude });
      setAccuracyMeters(acc);
      if (!initialPinSetRef.current) {
        initialPinSetRef.current = true;
        setPin({ latitude, longitude });
      }
    } catch {
      setLocationPermission(false);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const handleConfirm = () => {
    if (!displayCoords || !address.house?.trim() || !address.phone?.trim()) {
      Alert.alert('Заполните адрес', 'Укажите дом и телефон.');
      return;
    }
    const phoneTrimmed = (address.phone ?? '').trim();
    const phoneDigits = phoneTrimmed.replace(/\D/g, '');
    const isValidPhone = /^\+998\d{9}$/.test(phoneTrimmed.replace(/[\s\-()]/g, '')) || (phoneDigits.length >= 9 && phoneDigits.length <= 12);
    if (!isValidPhone) {
      Alert.alert('Неверный телефон', 'Введите номер в формате +998 XX XXX XX XX');
      return;
    }
    router.push({
      pathname: '/order/confirm',
      params: {
        serviceId: serviceId ?? '',
        lat: String(displayCoords.latitude),
        lng: String(displayCoords.longitude),
        house: address.house,
        floor: address.floor ?? '',
        apartment: address.apartment ?? '',
        phone: address.phone,
      },
    });
  };

  if (loadingLocation && locationPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Определение местоположения...</Text>
      </View>
    );
  }

  if (locationPermission === false) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIconWrap}>
          <FontAwesome name="map-marker" size={48} color={Theme.textSecondary} />
        </View>
        <Text style={styles.errorTitle}>Нет доступа к геолокации</Text>
        <Text style={styles.errorHint}>
          Включите геолокацию в настройках или укажите адрес вручную ниже.
        </Text>
        <Pressable onPress={fetchLocation}>
          <LinearGradient
            colors={[Theme.primaryGradient[0], Theme.primaryGradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Повторить</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Manzilni tanlang</Text>
        <Pressable style={styles.headerGps} onPress={fetchLocation} hitSlop={12}>
          <FontAwesome name="crosshairs" size={20} color={Theme.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Accuracy warning */}
        {accuracyMeters != null && isWeakGps && (
          <View style={styles.accuracyRow}>
            <FontAwesome name="exclamation-triangle" size={16} color={Theme.warning} />
            <Text style={styles.accuracyText}>
              Точность ~{Math.round(accuracyMeters)} м -- Слабый сигнал GPS. Подвиньте метку на карте.
            </Text>
          </View>
        )}

        {/* Map */}
        {Platform.OS !== 'web' && displayCoords ? (
          <View style={styles.mapWrap}>
            <LocationMapComponent
              latitude={displayCoords.latitude}
              longitude={displayCoords.longitude}
              onPinChange={setPin}
              medics={[]}
              selectedMedicId={null}
              onSelectMedic={() => {}}
            />
          </View>
        ) : null}

        {/* Bottom sheet form */}
        <View style={styles.formSheet}>
          {/* House/Building */}
          <View style={styles.inputWrap}>
            <FontAwesome name="building-o" size={16} color={Theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.tonalInput}
              value={address.house ?? ''}
              onChangeText={(house) => setAddress((a) => ({ ...a, house }))}
              placeholder="Uy / Bino nomi *"
              placeholderTextColor={Theme.textTertiary}
            />
          </View>

          {/* Floor + Apartment row */}
          <View style={styles.twoCol}>
            <View style={[styles.inputWrap, styles.halfInput]}>
              <TextInput
                style={styles.tonalInput}
                value={address.floor ?? ''}
                onChangeText={(floor) => setAddress((a) => ({ ...a, floor }))}
                placeholder="Qavat"
                placeholderTextColor={Theme.textTertiary}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.inputWrap, styles.halfInput]}>
              <TextInput
                style={styles.tonalInput}
                value={address.apartment ?? ''}
                onChangeText={(apartment) => setAddress((a) => ({ ...a, apartment }))}
                placeholder="Xonadon / Ofis"
                placeholderTextColor={Theme.textTertiary}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputWrap}>
            <Text style={styles.phonePrefix}>+998</Text>
            <TextInput
              style={[styles.tonalInput, { paddingLeft: 52 }]}
              value={address.phone ?? ''}
              onChangeText={(phone) => setAddress((a) => ({ ...a, phone }))}
              placeholder="Telefon raqami *"
              placeholderTextColor={Theme.textTertiary}
              keyboardType="phone-pad"
            />
          </View>

          {/* CTA */}
          <Pressable onPress={handleConfirm}>
            <LinearGradient
              colors={[Theme.primaryGradient[0], Theme.primaryGradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Tasdiqlash</Text>
              <FontAwesome name="arrow-right" size={16} color="#fff" />
            </LinearGradient>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Theme.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },

  /* Error state */
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.full,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    fontSize: 15,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
  },
  headerGps: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Accuracy */
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Theme.warningContainer,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
  },
  accuracyText: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: '#854d0e',
    flex: 1,
  },

  /* Map */
  mapWrap: {
    height: '50%',
    minHeight: 260,
    maxHeight: 340,
    marginBottom: 0,
  },
  coordsFallback: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.lg,
  },
  coordsText: {
    fontSize: 14,
    fontFamily: Fonts.interMd,
    color: Theme.text,
  },
  coordsHint: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: Spacing.xs,
  },

  /* Address preview */
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  addressPreviewText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.interMd,
    color: Theme.text,
  },

  /* Form sheet */
  formSheet: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.lg,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: Spacing.lg,
    top: 16,
    zIndex: 1,
  },
  tonalInput: {
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    paddingLeft: 44,
    fontSize: 15,
    fontFamily: Fonts.inter,
    color: Theme.text,
  },
  phonePrefix: {
    position: 'absolute',
    left: Spacing.lg,
    top: 15,
    zIndex: 1,
    fontSize: 15,
    fontFamily: Fonts.interMd,
    color: Theme.textSecondary,
  },
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },

  /* CTA */
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: '#fff',
  },
});

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
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
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
    // Accept +998XXXXXXXXX or bare 9-digit numbers (with any spacing/dashes)
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
        <FontAwesome name="map-marker" size={48} color={Theme.textSecondary} />
        <Text style={styles.errorTitle}>Нет доступа к геолокации</Text>
        <Text style={styles.errorHint} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
          Включите геолокацию в настройках или укажите адрес вручную ниже.
        </Text>
        <Pressable style={styles.retryButton} onPress={fetchLocation}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Accuracy & weak GPS warning */}
        {accuracyMeters != null && (
          <View style={[styles.accuracyRow, isWeakGps && styles.accuracyRowWeak]}>
            <FontAwesome
              name={isWeakGps ? 'exclamation-triangle' : 'crosshairs'}
              size={16}
              color={isWeakGps ? Theme.warning : Theme.primary}
            />
            <Text
              style={[styles.accuracyText, isWeakGps && styles.accuracyTextWeak]}
              lightColor={isWeakGps ? '#854d0e' : undefined}
              darkColor={isWeakGps ? '#ca8a04' : undefined}
            >
              Точность ~{Math.round(accuracyMeters)} м
              {isWeakGps && ' • Слабый сигнал GPS. Подвиньте метку на карте вручную.'}
            </Text>
          </View>
        )}

        {/* Map — only on native; web shows coords text */}
        {Platform.OS !== 'web' && displayCoords ? (
          <LocationMapComponent
            latitude={displayCoords.latitude}
            longitude={displayCoords.longitude}
            onPinChange={setPin}
            medics={[]}
            selectedMedicId={null}
            onSelectMedic={() => {}}
          />
        ) : displayCoords ? (
          <View style={styles.coordsFallback}>
            <Text style={styles.coordsText}>
              Координаты: {displayCoords.latitude.toFixed(5)}, {displayCoords.longitude.toFixed(5)}
            </Text>
            <Text style={styles.coordsHint} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
              На телефоне откроется карта для уточнения точки.
            </Text>
          </View>
        ) : null}

        {/* Address form */}
        <Text style={styles.sectionTitle}>Адрес</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Дом *</Text>
          <TextInput
            style={styles.input}
            value={address.house ?? ''}
            onChangeText={(house) => setAddress((a) => ({ ...a, house }))}
            placeholder="ул. Примерная, 1"
            placeholderTextColor={Theme.textSecondary}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Этаж</Text>
              <TextInput
                style={styles.input}
                value={address.floor ?? ''}
                onChangeText={(floor) => setAddress((a) => ({ ...a, floor }))}
                placeholder="3"
                placeholderTextColor={Theme.textSecondary}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Квартира</Text>
              <TextInput
                style={styles.input}
                value={address.apartment ?? ''}
                onChangeText={(apartment) => setAddress((a) => ({ ...a, apartment }))}
                placeholder="42"
                placeholderTextColor={Theme.textSecondary}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Text style={styles.label}>Телефон *</Text>
          <TextInput
            style={styles.input}
            value={address.phone ?? ''}
            onChangeText={(phone) => setAddress((a) => ({ ...a, phone }))}
            placeholder="+998 90 123 45 67"
            placeholderTextColor={Theme.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Подтвердить заказ</Text>
        </Pressable>
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Theme.textSecondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Theme.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: `${Theme.primary}12`,
    borderRadius: 10,
    marginBottom: 12,
  },
  accuracyRowWeak: {
    backgroundColor: `${Theme.warning}20`,
  },
  accuracyText: {
    fontSize: 13,
    color: Theme.primary,
    flex: 1,
  },
  accuracyTextWeak: {
    fontSize: 13,
    flex: 1,
  },
  coordsFallback: {
    padding: 16,
    backgroundColor: Theme.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  coordsText: {
    fontSize: 14,
    color: Theme.text,
  },
  coordsHint: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 10,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: Theme.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: Theme.text,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  confirmButton: {
    backgroundColor: Theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonPressed: { opacity: 0.9 },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

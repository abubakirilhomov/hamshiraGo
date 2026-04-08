import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, setUnauthorizedHandler } from '@/constants/api';
import { setBackgroundLocationToken, stopBackgroundLocationUpdates } from '@/utils/backgroundLocation';

const TOKEN_KEY = 'medic_auth_token';
const MEDIC_KEY = 'medic_auth_user';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'medic' | 'doctor';

export interface MedicUser {
  id: string;
  phone: string;
  name: string;
  role?: UserRole;
  experienceYears: number;
  specialization?: string;
  rating: number | null;
  reviewCount: number;
  balance: number;
  earnings: number;
  isOnline: boolean;
  verificationStatus: VerificationStatus;
  facePhotoUrl: string | null;
  licensePhotoUrl: string | null;
  profilePhotoUrl: string | null;
  verificationRejectedReason: string | null;
  telegramChatId: string | null;
  onlineDisabledReason?: 'INACTIVE_5H' | null;
  workZoneLat?: number | null;
  workZoneLng?: number | null;
  workZoneRadius?: number | null;
  consultationCount?: number;
}

interface AuthState {
  medic: MedicUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  loginDoctor: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string, experienceYears?: number) => Promise<void>;
  updateOnlineStatus: (isOnline: boolean) => void;
  refreshProfile: () => Promise<void>;
  logout: () => void;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ medic: null, token: null, isLoading: true });

  // Restore session from SecureStore on startup
  useEffect(() => {
    (async () => {
      try {
        const [token, medicJson] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(MEDIC_KEY),
        ]);
        if (token && medicJson) {
          const medic = JSON.parse(medicJson) as MedicUser;
          setState({ medic, token, isLoading: false });
        } else {
          setState({ medic: null, token: null, isLoading: false });
        }
      } catch {
        setState({ medic: null, token: null, isLoading: false });
      }
    })();
  }, []);

  const persist = async (token: string, medic: MedicUser) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(MEDIC_KEY, JSON.stringify(medic)),
    ]);
  };

  const login = async (phone: string, password: string) => {
    const res = await apiFetch<{ access_token: string; medic: MedicUser }>('/medics/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    const medic = { ...res.medic, role: 'medic' as UserRole };
    await persist(res.access_token, medic);
    setState({ medic, token: res.access_token, isLoading: false });
  };

  const loginDoctor = async (phone: string, password: string) => {
    const res = await apiFetch<{ access_token: string; doctor: MedicUser }>('/doctors/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    const doctor = { ...res.doctor, role: 'doctor' as UserRole };
    await persist(res.access_token, doctor);
    setState({ medic: doctor, token: res.access_token, isLoading: false });
  };

  const register = async (
    phone: string,
    password: string,
    name: string,
    experienceYears?: number,
  ) => {
    const res = await apiFetch<{ access_token: string; medic: MedicUser }>('/medics/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, name, experienceYears }),
    });
    const medic = { ...res.medic, role: 'medic' as UserRole };
    await persist(res.access_token, medic);
    setState({ medic, token: res.access_token, isLoading: false });
  };

  const updateOnlineStatus = (isOnline: boolean) => {
    setState((s) => ({
      ...s,
      medic: s.medic
        ? {
            ...s.medic,
            isOnline,
            onlineDisabledReason: isOnline ? null : s.medic.onlineDisabledReason ?? null,
          }
        : null,
    }));
  };

  /** Re-fetch profile from backend to get latest verificationStatus */
  const refreshProfile = async () => {
    const currentToken = state.token;
    if (!currentToken) return;
    try {
      const currentRole = state.medic?.role ?? 'medic';
      const endpoint = currentRole === 'doctor' ? '/doctors/me' : '/medics/me';
      const profile = await apiFetch<MedicUser>(endpoint, { token: currentToken });
      const profileWithRole = { ...profile, role: currentRole };
      setState((prev) => ({ ...prev, medic: profileWithRole }));
      await SecureStore.setItemAsync(MEDIC_KEY, JSON.stringify(profileWithRole)).catch(() => {});
    } catch {
      // ignore — keep stale data
    }
  };

  const logout = async () => {
    // Immediately clear background location token to prevent stale API calls
    setBackgroundLocationToken(null);
    stopBackgroundLocationUpdates().catch(() => {});

    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(MEDIC_KEY),
    ]).catch(() => {});
    setState({ medic: null, token: null, isLoading: false });
  };

  // Register global 401 handler — auto-logout on expired/invalid token
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; });
  useEffect(() => {
    setUnauthorizedHandler(() => logoutRef.current());
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginDoctor, register, updateOnlineStatus, refreshProfile, logout, role: (state.medic?.role ?? 'medic') as UserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '@/constants/api';

const TOKEN_KEY = 'medic_auth_token';
const MEDIC_KEY = 'medic_auth_user';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MedicUser {
  id: string;
  phone: string;
  name: string;
  experienceYears: number;
  rating: number | null;
  balance: number;
  isOnline: boolean;
  verificationStatus: VerificationStatus;
  facePhotoUrl: string | null;
  licensePhotoUrl: string | null;
  verificationRejectedReason: string | null;
  telegramChatId: string | null;
  onlineDisabledReason?: 'INACTIVE_5H' | null;
}

interface AuthState {
  medic: MedicUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string, experienceYears?: number) => Promise<void>;
  updateOnlineStatus: (isOnline: boolean) => void;
  refreshProfile: () => Promise<void>;
  logout: () => void;
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
    await persist(res.access_token, res.medic);
    setState({ medic: res.medic, token: res.access_token, isLoading: false });
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
    await persist(res.access_token, res.medic);
    setState({ medic: res.medic, token: res.access_token, isLoading: false });
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
      const profile = await apiFetch<MedicUser>('/medics/me', { token: currentToken });
      setState((prev) => ({ ...prev, medic: profile }));
      await SecureStore.setItemAsync(MEDIC_KEY, JSON.stringify(profile)).catch(() => {});
    } catch {
      // ignore — keep stale data
    }
  };

  const logout = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(MEDIC_KEY),
    ]).catch(() => {});
    setState({ medic: null, token: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, updateOnlineStatus, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, setUnauthorizedHandler } from '@/constants/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name?: string, referredByCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, isLoading: true });

  // Restore session from SecureStore on startup
  useEffect(() => {
    (async () => {
      try {
        const [token, userJson] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (token && userJson) {
          const user = JSON.parse(userJson) as AuthUser;
          // Validate token is still valid on cold start
          try {
            const fresh = await apiFetch<AuthUser>('/auth/me', { token });
            setState({ user: fresh ?? user, token, isLoading: false });
            if (fresh?.name !== user.name) {
              await SecureStore.setItemAsync(USER_KEY, JSON.stringify(fresh));
            }
          } catch {
            // Token expired/invalid — clear session
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            setState({ user: null, token: null, isLoading: false });
          }
        } else {
          setState({ user: null, token: null, isLoading: false });
        }
      } catch {
        setState({ user: null, token: null, isLoading: false });
      }
    })();
  }, []);

  const persist = async (token: string, user: AuthUser) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
  };

  const login = async (phone: string, password: string) => {
    const res = await apiFetch<{ access_token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    await persist(res.access_token, res.user);
    setState({ user: res.user, token: res.access_token, isLoading: false });
  };

  const register = async (phone: string, password: string, name?: string, referredByCode?: string) => {
    const res = await apiFetch<{ access_token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        password,
        ...(name ? { name } : {}),
        ...(referredByCode ? { referredByCode } : {}),
      }),
    });
    await persist(res.access_token, res.user);
    setState({ user: res.user, token: res.access_token, isLoading: false });
  };

  const logout = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]).catch(() => {});
    setState({ user: null, token: null, isLoading: false });
  };

  // Register global 401 handler — auto-logout on expired/invalid token
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; });
  useEffect(() => {
    setUnauthorizedHandler(() => logoutRef.current());
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

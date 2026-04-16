"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface UserInfo {
  id: string;
  phone: string;
  name: string | null;
  avatarUrl?: string | null;
}

interface UserContextValue {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserInfo | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const stored = localStorage.getItem("user");
      if (stored) {
        setUserState(JSON.parse(stored) as UserInfo);
      } else {
        const payload = JSON.parse(atob(token.split(".")[1])) as { sub?: string; phone?: string };
        setUserState({ id: payload.sub ?? "", phone: payload.phone ?? "", name: null });
      }
    } catch { /* ignore */ }
  }, []);

  const setUser = (u: UserInfo | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
    } else {
      localStorage.removeItem("user");
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

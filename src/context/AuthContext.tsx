// src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  refreshUser: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps): React.ReactNode {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  async function fetchUser() {
    const { data } = await authClient.getSession();
    if (data?.user) {
      setUser(data.user as unknown as AuthUser);
    }
  }

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <AuthContext.Provider value={{ user, loading: false, isAdmin, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

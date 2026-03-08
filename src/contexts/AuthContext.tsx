import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authService } from "@/services/auth";
import type { EnterpriseInfo } from "@/services/auth";
import queryClient from "@/lib/queryClient";

export type UserRole = "Citizen" | "Enterprise" | "Collector" | "Admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  district?: string;
  points?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, phone: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("eco_user");
    if (!saved || saved === "undefined" || saved === "null") {
      localStorage.removeItem("eco_user");
      return null;
    }
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem("eco_user");
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Luôn re-decode từ token khi load để đảm bảo role luôn mới nhất từ JWT
  useEffect(() => {
    const token = localStorage.getItem("eco_token");
    if (token) {
      try {
        const userData = authService.getUserAfterLogin(token);
        setUser(userData);
        localStorage.setItem("eco_user", JSON.stringify(userData));
      } catch {
        localStorage.removeItem("eco_token");
        localStorage.removeItem("eco_refresh_token");
        localStorage.removeItem("eco_user");
        setUser(null);
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const tokenResponse = await authService.login(email, password);
      if (!tokenResponse?.accessToken) {
        throw new Error("Đăng nhập thất bại: không nhận được token từ server");
      }
      localStorage.setItem("eco_token", tokenResponse.accessToken);
      localStorage.setItem("eco_refresh_token", tokenResponse.refreshToken ?? "");
      const userData = authService.getUserAfterLogin(tokenResponse.accessToken);
      localStorage.setItem("eco_user", JSON.stringify(userData));
      setUser(userData);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (fullName: string, phone: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      await authService.register(fullName, phone, email, password, role);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem("eco_token");
    localStorage.removeItem("eco_refresh_token");
    localStorage.removeItem("eco_user");
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

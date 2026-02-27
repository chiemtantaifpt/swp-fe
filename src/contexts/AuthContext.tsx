import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "citizen" | "enterprise" | "collector" | "admin";

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
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const MOCK_USERS: (User & { password: string })[] = [
  { id: "1", email: "citizen@test.com", password: "123456", name: "Nguyễn Văn An", role: "citizen", district: "Quận 1", points: 320 },
  { id: "2", email: "enterprise@test.com", password: "123456", name: "Công ty Tái chế Xanh", role: "enterprise", district: "Quận 1" },
  { id: "3", email: "collector@test.com", password: "123456", name: "Trần Minh Tuấn", role: "collector", district: "Quận 1" },
  { id: "4", email: "admin@test.com", password: "123456", name: "Admin Hệ Thống", role: "admin" },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("eco_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem("eco_user", JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string, role: UserRole) => {
    const newUser: User = { id: Date.now().toString(), email, name, role, district: "Quận 1", points: 0 };
    setUser(newUser);
    localStorage.setItem("eco_user", JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("eco_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

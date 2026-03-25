import React, { createContext, useContext, useState, useCallback } from 'react';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  onboardingComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA: boolean }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  pendingUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, User & { password: string }> = {
  'patient@demo.com': { id: '1', email: 'patient@demo.com', password: 'password', name: 'Sarah Johnson', role: 'patient', onboardingComplete: true },
  'doctor@demo.com': { id: '2', email: 'doctor@demo.com', password: 'password', name: 'Dr. Michael Chen', role: 'doctor' },
  'admin@demo.com': { id: '3', email: 'admin@demo.com', password: 'password', name: 'Admin User', role: 'admin' },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('telemed_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const found = MOCK_USERS[email];
    if (!found) {
      // For demo: create user on-the-fly as patient
      const newUser: User = { id: Date.now().toString(), email, name: email.split('@')[0], role: 'patient', onboardingComplete: false };
      setPendingUser(newUser);
      setIsLoading(false);
      return { requires2FA: true };
    }
    const { password: _, ...userData } = found;
    setPendingUser(userData);
    setIsLoading(false);
    return { requires2FA: true };
  }, []);

  const verify2FA = useCallback(async (_code: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    if (pendingUser) {
      setUser(pendingUser);
      localStorage.setItem('telemed_user', JSON.stringify(pendingUser));
      setPendingUser(null);
    }
    setIsLoading(false);
  }, [pendingUser]);

  const signup = useCallback(async (email: string, _password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const newUser: User = { id: Date.now().toString(), email, name, role, onboardingComplete: false };
    MOCK_USERS[email] = { ...newUser, password: _password };
    setPendingUser(newUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPendingUser(null);
    localStorage.removeItem('telemed_user');
  }, []);

  const resetPassword = useCallback(async (_email: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('telemed_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, verify2FA, logout, resetPassword, updateUser, pendingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

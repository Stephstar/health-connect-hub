import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

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
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA: boolean }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  verify2FA: (code: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  pendingUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadUserProfile(userId: string, fallbackEmail: string): Promise<User | null> {
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
  ]);
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email || fallbackEmail,
    name: profile.full_name || fallbackEmail.split('@')[0],
    role: (roleRow?.role as UserRole) || 'patient',
    avatar: profile.avatar_url || undefined,
    phone: profile.phone || undefined,
    onboardingComplete: profile.onboarding_complete,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Defer Supabase calls to avoid deadlocks
        setTimeout(async () => {
          const profile = await loadUserProfile(newSession.user.id, newSession.user.email || '');
          setUser(profile);
          setIsLoading(false);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
      setSession(existing);
      if (existing?.user) {
        const profile = await loadUserProfile(existing.user.id, existing.user.email || '');
        setUser(profile);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Skip 2FA in real auth — return false so login page routes directly
      return { requires2FA: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: name, role },
        },
      });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (_code: string): Promise<User> => {
    // 2FA disabled in real auth — return current user
    if (user) return user;
    throw new Error('No user to verify');
  }, [user]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPendingUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    const updates: {
      full_name?: string;
      avatar_url?: string;
      phone?: string;
      onboarding_complete?: boolean;
    } = {};
    if (data.name !== undefined) updates.full_name = data.name;
    if (data.avatar !== undefined) updates.avatar_url = data.avatar;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.onboardingComplete !== undefined) updates.onboarding_complete = data.onboardingComplete;
    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }
    setUser(prev => prev ? { ...prev, ...data } : prev);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, session, isAuthenticated: !!session, isLoading,
      login, signup, verify2FA, logout, resetPassword, updateUser, pendingUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

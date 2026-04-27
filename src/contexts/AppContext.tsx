import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Appointment {
  id: string;
  doctorId?: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  price: number;
  reason?: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  specialty: string;
  bio?: string;
  rating: number;
  reviews: number;
  price: number;
  avatar: string;
  available: boolean;
  yearsExperience: number;
  languages: string[];
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
}

export interface OnboardingData {
  step: number;
  personalInfo: { firstName: string; lastName: string; dob: string; gender: string; phone: string; address: string };
  medicalHistory: { conditions: string[]; surgeries: string; familyHistory: string };
  allergies: { list: string[]; custom: string };
  medications: { current: string[]; custom: string };
  insurance: { provider: string; policyNumber: string; groupNumber: string };
  preferredDoctors: string[];
}

interface AppContextType {
  appointments: Appointment[];
  doctors: Doctor[];
  messages: Message[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
  loading: boolean;
  bookAppointment: (input: { doctorId: string; date: string; time: string; type: 'video' | 'in-person'; price: number; reason?: string }) => Promise<Appointment | null>;
  addAppointment: (apt: Appointment) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  sendMessage: (recipientId: string, content: string) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;
  onboardingData: OnboardingData;
  updateOnboarding: (data: Partial<OnboardingData>) => void;
  markNotificationRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultOnboarding: OnboardingData = {
  step: 0,
  personalInfo: { firstName: '', lastName: '', dob: '', gender: '', phone: '', address: '' },
  medicalHistory: { conditions: [], surgeries: '', familyHistory: '' },
  allergies: { list: [], custom: '' },
  medications: { current: [], custom: '' },
  insurance: { provider: '', policyNumber: '', groupNumber: '' },
  preferredDoctors: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultOnboarding);
  const [loading, setLoading] = useState(false);

  const loadDoctors = useCallback(async () => {
    const { data } = await supabase
      .from('doctors')
      .select('id, user_id, full_name, specialty, bio, avatar_url, consultation_fee, rating, reviews_count, years_experience, languages, status')
      .eq('status', 'verified');
    if (!data) return;
    setDoctors(data.map(d => ({
      id: d.id,
      userId: d.user_id || undefined,
      name: d.full_name,
      specialty: d.specialty,
      bio: d.bio || undefined,
      rating: Number(d.rating),
      reviews: d.reviews_count,
      price: Number(d.consultation_fee),
      avatar: d.avatar_url || '',
      available: true,
      yearsExperience: d.years_experience,
      languages: d.languages,
    })));
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('appointments')
      .select('id, doctor_id, patient_id, appointment_date, appointment_time, type, status, price, reason, doctors!inner(full_name, specialty, avatar_url)')
      .order('appointment_date', { ascending: false });
    if (user.role === 'patient') query = query.eq('patient_id', user.id);
    const { data } = await query;
    if (!data) return;
    setAppointments(data.map((a: {
      id: string;
      doctor_id: string;
      appointment_date: string;
      appointment_time: string;
      type: 'video' | 'in-person';
      status: Appointment['status'];
      price: number;
      reason: string | null;
      doctors: { full_name: string; specialty: string; avatar_url: string | null };
    }) => ({
      id: a.id,
      doctorId: a.doctor_id,
      doctorName: a.doctors.full_name,
      doctorSpecialty: a.doctors.specialty,
      doctorAvatar: a.doctors.avatar_url || '',
      date: a.appointment_date,
      time: a.appointment_time,
      type: a.type,
      status: a.status,
      price: Number(a.price),
      reason: a.reason || undefined,
    })));
  }, [user]);

  const loadMessages = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, is_read, created_at')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!data) return;
    // Get sender names
    const senderIds = Array.from(new Set(data.map(m => m.sender_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', senderIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    setMessages(data.map(m => {
      const p = profileMap.get(m.sender_id);
      return {
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        senderName: p?.full_name || 'Unknown',
        senderAvatar: p?.avatar_url || '',
        content: m.content,
        timestamp: m.created_at,
        isRead: m.is_read,
      };
    }));
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!data) return;
    setNotifications(data.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      read: n.read,
      time: timeAgo(n.created_at),
    })));
  }, [user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDoctors(), loadAppointments(), loadMessages(), loadNotifications()]);
    setLoading(false);
  }, [loadDoctors, loadAppointments, loadMessages, loadNotifications]);

  // Always load doctors (public). Load user data when authenticated.
  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAppointments();
      loadMessages();
      loadNotifications();
    } else {
      setAppointments([]);
      setMessages([]);
      setNotifications([]);
    }
  }, [isAuthenticated, user, loadAppointments, loadMessages, loadNotifications]);

  const bookAppointment: AppContextType['bookAppointment'] = useCallback(async (input) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        doctor_id: input.doctorId,
        appointment_date: input.date,
        appointment_time: input.time,
        type: input.type,
        price: input.price,
        reason: input.reason,
        status: 'upcoming',
      })
      .select('id, doctor_id, appointment_date, appointment_time, type, status, price, reason, doctors!inner(full_name, specialty, avatar_url)')
      .single();
    if (error || !data) {
      console.error('bookAppointment error', error);
      return null;
    }
    // Create invoice
    await supabase.from('invoices').insert({
      patient_id: user.id,
      appointment_id: data.id,
      amount: input.price,
      description: `Consultation with ${data.doctors.full_name}`,
      status: 'pending',
    });
    // Notify
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Appointment Booked',
      message: `Your appointment with ${data.doctors.full_name} on ${input.date} at ${input.time} is confirmed.`,
      type: 'appointment',
    });
    const apt: Appointment = {
      id: data.id,
      doctorId: data.doctor_id,
      doctorName: data.doctors.full_name,
      doctorSpecialty: data.doctors.specialty,
      doctorAvatar: data.doctors.avatar_url || '',
      date: data.appointment_date,
      time: data.appointment_time,
      type: data.type,
      status: data.status,
      price: Number(data.price),
      reason: data.reason || undefined,
    };
    setAppointments(prev => [apt, ...prev]);
    loadNotifications();
    return apt;
  }, [user, loadNotifications]);

  // Legacy compat: takes a fully built Appointment object (used by old code).
  const addAppointment = useCallback(async (apt: Appointment) => {
    setAppointments(prev => [apt, ...prev]);
  }, []);

  const cancelAppointment = useCallback(async (id: string) => {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
  }, []);

  const updateAppointmentStatus = useCallback(async (id: string, status: Appointment['status']) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  const sendMessage = useCallback(async (recipientId: string, content: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, recipient_id: recipientId, content })
      .select()
      .single();
    if (data) {
      setMessages(prev => [{
        id: data.id,
        senderId: data.sender_id,
        recipientId: data.recipient_id,
        senderName: user.name,
        senderAvatar: user.avatar || '',
        content: data.content,
        timestamp: data.created_at,
        isRead: data.is_read,
      }, ...prev]);
    }
  }, [user]);

  const markMessageRead = useCallback(async (id: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  }, []);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
  }, []);

  const clearChatMessages = useCallback(() => setChatMessages([]), []);

  const updateOnboarding = useCallback((data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return (
    <AppContext.Provider value={{
      appointments, doctors, messages, notifications, chatMessages, loading,
      bookAppointment, addAppointment, cancelAppointment, updateAppointmentStatus,
      sendMessage, markMessageRead,
      addChatMessage, clearChatMessages,
      onboardingData, updateOnboarding, markNotificationRead, refresh,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

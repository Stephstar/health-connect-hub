import React, { createContext, useContext, useState } from 'react';

export interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
}

export interface Message {
  id: string;
  senderId: string;
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
  addAppointment: (apt: Appointment) => void;
  cancelAppointment: (id: string) => void;
  messages: Message[];
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  onboardingData: OnboardingData;
  updateOnboarding: (data: Partial<OnboardingData>) => void;
  notifications: { id: string; title: string; message: string; read: boolean; time: string }[];
  markNotificationRead: (id: string) => void;
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

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', doctorName: 'Dr. Michael Chen', doctorSpecialty: 'Cardiologist', doctorAvatar: '', date: '2026-03-25', time: '10:00 AM', type: 'video', status: 'upcoming', price: 75 },
  { id: '2', doctorName: 'Dr. Amara Okafor', doctorSpecialty: 'Dermatologist', doctorAvatar: '', date: '2026-03-28', time: '2:30 PM', type: 'in-person', status: 'upcoming', price: 120 },
  { id: '3', doctorName: 'Dr. Emily Watson', doctorSpecialty: 'General Practice', doctorAvatar: '', date: '2026-03-15', time: '9:00 AM', type: 'video', status: 'completed', price: 50 },
];

const MOCK_MESSAGES: Message[] = [
  { id: '1', senderId: '2', senderName: 'Dr. Michael Chen', senderAvatar: '', content: 'Your lab results look great. No concerns at this time.', timestamp: '2026-03-22T14:30:00', isRead: false },
  { id: '2', senderId: '3', senderName: 'Dr. Amara Okafor', senderAvatar: '', content: 'Please remember to apply the prescribed cream twice daily.', timestamp: '2026-03-21T09:15:00', isRead: true },
];

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'Appointment Reminder', message: 'Your appointment with Dr. Chen is tomorrow at 10:00 AM', read: false, time: '1 hour ago' },
  { id: '2', title: 'Lab Results Ready', message: 'Your blood work results are now available', read: false, time: '3 hours ago' },
  { id: '3', title: 'Prescription Refill', message: 'Your prescription for Lisinopril is ready for refill', read: true, time: '1 day ago' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [messages] = useState<Message[]>(MOCK_MESSAGES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultOnboarding);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const addAppointment = (apt: Appointment) => setAppointments(prev => [apt, ...prev]);
  const cancelAppointment = (id: string) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a));
  const addChatMessage = (msg: ChatMessage) => setChatMessages(prev => [...prev, msg]);
  const updateOnboarding = (data: Partial<OnboardingData>) => setOnboardingData(prev => ({ ...prev, ...data }));
  const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <AppContext.Provider value={{ appointments, addAppointment, cancelAppointment, messages, chatMessages, addChatMessage, onboardingData, updateOnboarding, notifications, markNotificationRead }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

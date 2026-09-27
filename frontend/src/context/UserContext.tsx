import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface SkillProficiency {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category?: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  avatar: string;
}

export interface OnboardingState {
  currentRole: string;
  yearsOfExperience: string;
  workSituation: string;
  industry: string;
  education: string;
  skills: SkillProficiency[];
  goalType: 'Growth' | 'Transition';
  targetRole: string;
  targetSkills: string[];
  aiAnalysis?: string;
  isOnboarded: boolean;
}

interface UserContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onboarding: OnboardingState;
  setOnboarding: React.Dispatch<React.SetStateAction<OnboardingState>>;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateOnboarding: (updates: Partial<OnboardingState>) => void;
  resetUserSession: () => void;
}

export const formatNameFromEmail = (emailStr?: string): string => {
  if (!emailStr || !emailStr.includes('@')) return 'User';
  const namePart = emailStr.split('@')[0];
  const words = namePart.split(/[\._\-]/).filter(Boolean);
  if (words.length === 0) return 'User';
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const DEFAULT_USER: UserProfile = {
  fullName: 'Aisha Halima',
  email: 'aisha.halima@hernext.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
};

const DEFAULT_ONBOARDING: OnboardingState = {
  currentRole: 'Frontend Developer',
  yearsOfExperience: '3-5 years',
  workSituation: 'Full-time',
  industry: 'Fintech',
  education: "Bachelor's Degree",
  skills: [
    { name: 'React', level: 'Advanced', category: 'Technical' },
    { name: 'TypeScript', level: 'Advanced', category: 'Technical' },
    { name: 'Next.js', level: 'Intermediate', category: 'Technical' },
    { name: 'Tailwind CSS', level: 'Expert', category: 'Tools' },
    { name: 'State Management', level: 'Advanced', category: 'Technical' },
  ],
  goalType: 'Transition',
  targetRole: 'AI Engineer',
  targetSkills: ['Python', 'PyTorch', 'LLM Fine-tuning', 'Prompt Engineering'],
  aiAnalysis: 'High capability transfer from web architecture to AI agent development.',
  isOnboarded: true,
};

const STORAGE_KEY = 'hernext_user_session';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user && parsed.user.email) {
          return {
            ...parsed.user,
            fullName: parsed.user.fullName || formatNameFromEmail(parsed.user.email)
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load user session from localStorage', e);
    }
    return DEFAULT_USER;
  });

  const [onboarding, setOnboarding] = useState<OnboardingState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.onboarding && parsed.onboarding.currentRole) {
          return parsed.onboarding;
        }
      }
    } catch (e) {
      console.warn('Failed to load onboarding session from localStorage', e);
    }
    return DEFAULT_ONBOARDING;
  });

  // Save to localStorage whenever user or onboarding state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, onboarding })
      );
    } catch (e) {
      console.warn('Failed to save user session to localStorage', e);
    }
  }, [user, onboarding]);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const emailToUse = updates.email !== undefined ? updates.email : prev.email;
      const computedName = updates.fullName 
        ? updates.fullName 
        : (emailToUse ? formatNameFromEmail(emailToUse) : prev.fullName);
      
      const nextUser = {
        ...prev,
        ...updates,
        fullName: computedName,
        email: emailToUse
      };
      return nextUser;
    });
  };

  const updateOnboarding = (updates: Partial<OnboardingState>) => {
    setOnboarding((prev) => ({ ...prev, ...updates }));
  };

  const resetUserSession = () => {
    setUser(DEFAULT_USER);
    setOnboarding(DEFAULT_ONBOARDING);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        onboarding,
        setOnboarding,
        updateUser,
        updateOnboarding,
        resetUserSession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

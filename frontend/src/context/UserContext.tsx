import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { SESSION_ENDED_EVENT, USER_SESSION_KEY } from '../lib/session';
import { getProfile, type CareerProfile } from '../lib/api';
export interface SkillProficiency {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category?: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  avatar: string;
  country?: string;
  state?: string;
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
  careerProfile: CareerProfile | null;
  isCareerProfileLoading: boolean;
  refreshCareerProfile: () => Promise<CareerProfile>;
  setCareerProfile: React.Dispatch<React.SetStateAction<CareerProfile | null>>;
  setOnboarding: React.Dispatch<React.SetStateAction<OnboardingState>>;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateOnboarding: (updates: Partial<OnboardingState>) => void;
  resetUserSession: () => void;
  /**
   * Server-owned onboarding completion state.
   *   null    - not yet known (still loading); route guards must wait
   *   false   - the backend has no completed onboarding for this account
   *   true    - POST /onboarding committed for this account
   *
   * This is deliberately NOT persisted to localStorage and NOT derived from the
   * `onboarding` display cache. Completion used to be inferred from a
   * career_profiles row existing, which also happened when a failed onboarding
   * left a half-written profile behind.
   */
  onboardingCompleted: boolean | null;
  setOnboardingCompleted: (completed: boolean | null) => void;
}

export const formatNameFromEmail = (emailStr?: string): string => {
  if (!emailStr || !emailStr.includes('@')) return 'User';
  const namePart = emailStr.split('@')[0];
  const words = namePart.split(/[\._\-]/).filter(Boolean);
  if (words.length === 0) return 'User';
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const DEFAULT_USER: UserProfile = {
  fullName: '',
  email: '',
  avatar: '',
  country: '',
  state: '',
};

const DEFAULT_ONBOARDING: OnboardingState = {
  currentRole: '',
  yearsOfExperience: '',
  workSituation: '',
  industry: '',
  education: '',
  skills: [],
  goalType: 'Transition',
  targetRole: '',
  targetSkills: [],
  aiAnalysis: '',
  isOnboarded: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null);
  const [isCareerProfileLoading, setIsCareerProfileLoading] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(USER_SESSION_KEY);
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
      const saved = localStorage.getItem(USER_SESSION_KEY);
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

  const refreshCareerProfile = useCallback(async (): Promise<CareerProfile> => {
    setIsCareerProfileLoading(true);
    try {
      const profile = await getProfile();
      setCareerProfile(profile);
      return profile;
    } finally {
      setIsCareerProfileLoading(false);
    }
  }, []);

  // Rehydrate the backend profile on startup when an authenticated session exists.
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return;
    void refreshCareerProfile().catch((error) => {
      setCareerProfile(null);
      console.warn('Failed to load career profile from the backend', error);
    });
  }, [refreshCareerProfile]);

  // Save to localStorage whenever user or onboarding state changes.
  // onboardingCompleted is intentionally excluded: it is server-owned truth and
  // a stale cached value would gate routes on the wrong account's history.
  // careerProfile is excluded for the same reason: it is rehydrated from the
  // backend per session, so it is never written to another account's cache.
  useEffect(() => {
    try {
      localStorage.setItem(
        USER_SESSION_KEY,
        JSON.stringify({ user, onboarding })
      );
    } catch (e) {
      console.warn('Failed to save user session to localStorage', e);
    }
  }, [user, onboarding]);

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

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

  const resetUserSession = useCallback(() => {
    setUser(DEFAULT_USER);
    setOnboarding(DEFAULT_ONBOARDING);
    setOnboardingCompleted(null);
    // The backend career profile is account-scoped, so it must be dropped with
    // the rest of the in-memory session. Leaving it set would let the next
    // signed-in account briefly render the previous participant's profile.
    setCareerProfile(null);
    try {
      localStorage.removeItem(USER_SESSION_KEY);
    } catch (e) {
      console.warn('Failed to clear user session from localStorage', e);
    }
  }, []);

  /**
   * `endSession()` in lib/session.ts clears localStorage before it navigates,
   * but this provider also holds the same data in memory. React unmounts
   * during the redirect, so without this the save effect could write the stale
   * user straight back to localStorage. Resetting first keeps the two in step.
   */
  useEffect(() => {
    window.addEventListener(SESSION_ENDED_EVENT, resetUserSession);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, resetUserSession);
  }, [resetUserSession]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        onboarding,
        careerProfile,
        isCareerProfileLoading,
        refreshCareerProfile,
        setCareerProfile,
        setOnboarding,
        updateUser,
        updateOnboarding,
        resetUserSession,
        onboardingCompleted,
        setOnboardingCompleted,
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

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface CareerData {
  targetRole: string;
  company: string;
  jobDescription: string;
  currentRole: string;
  yearsExperience: string;
  topSkills: string;
}

interface DashboardContextType {
  careerData: CareerData | null;
  setCareerData: (data: CareerData) => void;
  isAssessmentComplete: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [careerData, setCareerData] = useState<CareerData | null>(null);

  return (
    <DashboardContext.Provider value={{
      careerData,
      setCareerData,
      isAssessmentComplete: careerData !== null,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};

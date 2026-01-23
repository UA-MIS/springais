// Skills context for shared state management across components
import { createContext, useContext, ReactNode } from 'react';
import { useSkills } from '../hooks/useSkills';

type SkillsContextType = ReturnType<typeof useSkills>;

const SkillsContext = createContext<SkillsContextType | null>(null);

export function SkillsProvider({ children }: { children: ReactNode }) {
  const skillsState = useSkills();

  return (
    <SkillsContext.Provider value={skillsState}>
      {children}
    </SkillsContext.Provider>
  );
}

export function useSkillsContext() {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new Error('useSkillsContext must be used within a SkillsProvider');
  }
  return context;
}

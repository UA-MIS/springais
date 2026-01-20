import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to dark mode
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('springais-theme');
    return (saved as ThemeMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('springais-theme', theme);
    // Update document class for global CSS targeting
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme color definitions
export const themeColors = {
  dark: {
    // Background
    pageBg: '#0a0a0f',
    cardBg: 'rgba(255, 255, 255, 0.07)',
    cardBorder: 'rgba(255, 255, 255, 0.15)',
    cardHoverBorder: 'rgba(255, 255, 255, 0.25)',
    // Header/Sidebar
    headerBg: 'rgba(255, 255, 255, 0.06)',
    sidebarBg: 'rgba(255, 255, 255, 0.04)',
    // Text
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.75)',
    textMuted: 'rgba(255, 255, 255, 0.45)',
    // Accent
    accent: '#FFE600',
    accentHover: '#e6cf00',
    // Borders
    border: 'rgba(255, 255, 255, 0.10)',
    // Overlays
    overlayGradient: 'linear-gradient(180deg, rgba(24,24,27,0.70) 0%, rgba(9,9,11,0.45) 40%, rgba(0,0,0,0.70) 80%, rgba(0,0,0,1) 100%)',
  },
  light: {
    // Background
    pageBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    cardHoverBorder: '#cbd5e1',
    // Header/Sidebar
    headerBg: '#2E2E38',
    sidebarBg: '#f1f5f9',
    // Text
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    // Accent
    accent: '#FFE600',
    accentHover: '#e6cf00',
    // Borders
    border: '#e2e8f0',
    // Overlays
    overlayGradient: 'none',
  },
};

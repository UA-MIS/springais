import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Extended theme modes: light, dark, and game (medieval fantasy)
type ThemeMode = 'light' | 'dark' | 'game';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
  isDark: boolean;
  isGame: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('springais-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'game') {
      return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('springais-theme', theme);
    document.documentElement.classList.remove('light', 'dark', 'game');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const cycleTheme = () => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'game';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      cycleTheme,
      isDark: theme === 'dark',
      isGame: theme === 'game'
    }}>
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
    // Game-specific (not used in dark but needed for type consistency)
    bronze: '#8B5A2B',
    forestGreen: '#2d4a3e',
    deepBlue: '#1a2a4a',
    glowPrimary: 'none',
    glowSecondary: 'none',
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
    // Game-specific (not used in light but needed for type consistency)
    bronze: '#8B5A2B',
    forestGreen: '#2d4a3e',
    deepBlue: '#1a2a4a',
    glowPrimary: 'none',
    glowSecondary: 'none',
  },
  game: {
    // Background - Deep parchment brown-black
    pageBg: '#1a1510',
    cardBg: 'rgba(60, 50, 40, 0.85)',
    cardBorder: 'rgba(139, 90, 43, 0.5)',
    cardHoverBorder: 'rgba(139, 90, 43, 0.8)',
    // Header/Sidebar - Dark wood tones
    headerBg: '#2a2520',
    sidebarBg: 'rgba(40, 35, 30, 0.95)',
    // Text - Parchment and aged paper
    textPrimary: '#e8dcc4',
    textSecondary: '#c4b998',
    textMuted: '#7a7060',
    // Accent - EY Yellow as gold
    accent: '#FFE600',
    accentHover: '#ffd700',
    // Borders - Leather brown
    border: 'rgba(139, 90, 43, 0.3)',
    // Overlays - Subtle fantasy gradient
    overlayGradient: 'radial-gradient(ellipse at 20% 30%, rgba(139, 90, 43, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(64, 156, 155, 0.06) 0%, transparent 50%)',
    // Game-specific colors
    bronze: '#8B5A2B',
    forestGreen: '#2d4a3e',
    deepBlue: '#1a2a4a',
    glowPrimary: '0 0 20px rgba(255, 230, 0, 0.3)',
    glowSecondary: '0 0 15px rgba(139, 90, 43, 0.4)',
  },
};

// Helper to get current colors based on theme
export function getThemeColors(theme: ThemeMode) {
  return themeColors[theme];
}

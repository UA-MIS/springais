// Theme configuration for Skills Dashboard
// Provides both light and dark theme variants

export const DARK_THEME = {
  name: 'Dark',
  // Page - transparent (uses MainLayout background)
  pageBg: 'transparent',
  // Header
  headerBg: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
  headerText: '#ffffff',
  headerSubtext: 'rgba(255, 255, 255, 0.7)',
  // Button
  primaryBtn: { bg: '#FFE600', text: '#1a1a24', hover: '#e6cf00', border: '#FFE600' },
  // Cards - glass effect
  cardBg: 'rgba(255, 255, 255, 0.07)',
  cardBorder: 'rgba(255, 255, 255, 0.15)',
  cardHoverBorder: 'rgba(255, 255, 255, 0.25)',
  cardShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  // Badges
  badges: {
    active: { bg: 'rgba(254, 243, 199, 0.2)', text: '#fcd34d' },
    complete: { bg: 'rgba(209, 250, 229, 0.2)', text: '#34d399' },
    recommended: { bg: 'rgba(219, 234, 254, 0.2)', text: '#60a5fa' },
  },
  // Tabs
  tabBg: 'rgba(255, 255, 255, 0.05)',
  activeTab: { bg: 'rgba(255, 255, 255, 0.1)', text: '#FFE600', border: 'rgba(255, 255, 255, 0.15)' },
  inactiveTab: { text: 'rgba(255, 255, 255, 0.6)' },
  // Category
  categoryBg: 'rgba(255, 255, 255, 0.1)',
  categoryText: '#ffffff',
  // Search
  searchBg: 'rgba(255, 255, 255, 0.05)',
  searchBorder: 'rgba(255, 255, 255, 0.15)',
  searchFocusBorder: 'rgba(255, 255, 255, 0.3)',
  searchText: '#ffffff',
  searchPlaceholder: 'rgba(255, 255, 255, 0.4)',
};

export const LIGHT_THEME = {
  name: 'Light',
  // Page
  pageBg: 'transparent',
  // Header
  headerBg: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
  headerText: '#ffffff',
  headerSubtext: '#cbd5e1',
  // Button
  primaryBtn: { bg: '#FFE600', text: '#1a1a24', hover: '#e6cf00', border: '#FFE600' },
  // Cards
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  cardHoverBorder: '#cbd5e1',
  cardShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  // Text
  textPrimary: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  // Badges
  badges: {
    active: { bg: '#fef3c7', text: '#92400e' },
    complete: { bg: '#d1fae5', text: '#065f46' },
    recommended: { bg: '#dbeafe', text: '#1e40af' },
  },
  // Tabs
  tabBg: '#f1f5f9',
  activeTab: { bg: '#ffffff', text: '#1e293b', border: '#e2e8f0' },
  inactiveTab: { text: '#64748b' },
  // Category
  categoryBg: '#f1f5f9',
  categoryText: '#1e293b',
  // Search
  searchBg: '#ffffff',
  searchBorder: '#e2e8f0',
  searchFocusBorder: '#94a3b8',
  searchText: '#1e293b',
  searchPlaceholder: '#94a3b8',
};

// Legacy export for backward compatibility - will be replaced by context
export const THEME = DARK_THEME;

// Green progress colors (same for both themes)
export const PROGRESS_COLORS = {
  meter: '#22c55e',
  ring: ['#166534', '#22c55e', '#4ade80'],
  text: '#16a34a',
  bg: '#dcfce7',
};

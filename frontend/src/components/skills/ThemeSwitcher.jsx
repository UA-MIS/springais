// Theme configuration for Skills Dashboard
// Professional executive theme with green progress indicators

export const THEME = {
  name: 'Executive',
  // Page - Dark background
  pageBg: '#1e293b',
  // Header - Slightly lighter dark
  headerBg: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
  headerText: '#ffffff',
  headerSubtext: '#cbd5e1',
  // Button
  primaryBtn: { bg: '#e2e8f0', text: '#1e293b', hover: '#f1f5f9', border: '#cbd5e1' },
  // Cards - Light grey for contrast
  cardBg: '#e2e8f0',
  cardBorder: '#cbd5e1',
  cardHoverBorder: '#94a3b8',
  cardShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  // Badges - Professional grays and subtle colors
  badges: {
    active: { bg: '#fef3c7', text: '#92400e' },
    complete: { bg: '#d1fae5', text: '#065f46' },
    recommended: { bg: '#dbeafe', text: '#1e40af' },
  },
  // Tabs
  tabBg: '#334155',
  activeTab: { bg: '#e2e8f0', text: '#1e293b', border: '#e2e8f0' },
  // Category
  categoryBg: '#cbd5e1',
  categoryText: '#1e293b',
  // Search
  searchBorder: '#94a3b8',
  searchFocusBorder: '#64748b',
};

// Green progress colors
export const PROGRESS_COLORS = {
  meter: '#22c55e', // Solid green for meter
  ring: ['#166534', '#22c55e', '#4ade80'], // Gradient for rings
  text: '#16a34a',
  bg: '#dcfce7',
};

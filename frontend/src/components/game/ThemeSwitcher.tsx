import { useState, useRef, useEffect } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function CastleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M5 21V7l3-3 3 3v14"/>
      <path d="M13 21V7l3-3 3 3v14"/>
      <path d="M9 21v-4h6v4"/>
      <path d="M3 7h4"/>
      <path d="M17 7h4"/>
      <rect x="9" y="10" width="1" height="1"/>
      <rect x="14" y="10" width="1" height="1"/>
    </svg>
  );
}

function SwordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
      <line x1="13" y1="19" x2="19" y2="13"/>
      <line x1="16" y1="16" x2="20" y2="20"/>
      <line x1="19" y1="21" x2="21" y2="19"/>
    </svg>
  );
}

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { state, toggleAdventureMode } = useAdventureMode();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const colors = themeColors[theme];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { id: 'light' as const, name: 'Light', icon: <SunIcon /> },
    { id: 'dark' as const, name: 'Dark', icon: <MoonIcon /> },
    { id: 'game' as const, name: 'Medieval', icon: <CastleIcon /> },
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[1];

  return (
    <div className="flex items-center gap-2">
      {/* Theme Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
          style={{
            backgroundColor: theme === 'game' ? 'rgba(139, 90, 43, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            color: theme === 'game' ? '#c4b998' : theme === 'light' ? '#ffffff' : colors.textSecondary,
            border: `1px solid ${theme === 'game' ? 'rgba(139, 90, 43, 0.5)' : 'transparent'}`,
          }}
        >
          {currentTheme.icon}
          <span className="text-sm hidden sm:inline">{currentTheme.name}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden z-50"
              style={{
                backgroundColor: theme === 'game' ? 'rgba(42, 37, 32, 0.98)' : 'rgba(30, 30, 30, 0.98)',
                border: `1px solid ${theme === 'game' ? 'rgba(139, 90, 43, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                minWidth: '150px',
              }}
            >
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                  style={{
                    backgroundColor: theme === t.id
                      ? (theme === 'game' ? 'rgba(255, 230, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)')
                      : 'transparent',
                    color: theme === t.id ? colors.accent : colors.textSecondary,
                  }}
                >
                  {t.icon}
                  <span className="text-sm">{t.name}</span>
                  {theme === t.id && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Adventure Mode Toggle */}
      <motion.button
        onClick={toggleAdventureMode}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
        style={{
          backgroundColor: state.enabled
            ? 'rgba(255, 230, 0, 0.2)'
            : (theme === 'game' ? 'rgba(139, 90, 43, 0.3)' : 'rgba(255, 255, 255, 0.1)'),
          color: state.enabled ? '#FFE600' : theme === 'light' ? '#ffffff' : colors.textSecondary,
          border: `1px solid ${state.enabled ? '#FFE600' : 'transparent'}`,
          boxShadow: state.enabled ? '0 0 15px rgba(255, 230, 0, 0.2)' : 'none',
        }}
        title={state.enabled ? 'Disable Adventure Mode' : 'Enable Adventure Mode'}
      >
        <SwordIcon />
        <span className="text-sm hidden sm:inline">
          {state.enabled ? 'Adventure' : 'Standard'}
        </span>
      </motion.button>
    </div>
  );
}

/**
 * BadgeSearch - Searchable autocomplete for badge catalog.
 *
 * Used in AddExtraModal when category is "certification".
 * Debounces input, fetches from GET /api/badges/catalog/search.
 */

import { useState, useEffect, useRef } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { searchCatalog, Badge } from '../../services/badgeService';

interface BadgeSearchProps {
  onSelect: (badge: Badge) => void;
  placeholder?: string;
}

export default function BadgeSearch({ onSelect, placeholder = 'Search certifications...' }: BadgeSearchProps) {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchCatalog(query, 10);
        setResults(data.results);
        setIsOpen(data.results.length > 0);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (badge: Badge) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect(badge);
  };

  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#3b82f6';
      case 'advanced': return '#f59e0b';
      case 'expert': return '#dc2626';
      default: return colors.textMuted;
    }
  };

  return (
    <div ref={containerRef} className="relative" data-testid="badge-search">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 rounded-lg text-sm"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            color: colors.textPrimary,
            border: `1px solid ${colors.cardBorder}`,
          }}
          data-testid="badge-search-input"
        />
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: colors.textMuted }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {isLoading && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: `${colors.textMuted} transparent transparent transparent` }}
            data-testid="badge-search-loading"
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden shadow-lg max-h-60 overflow-y-auto"
          style={{
            backgroundColor: (isDark || isGame) ? '#1e1e24' : '#fff',
            border: `1px solid ${colors.cardBorder}`,
          }}
          data-testid="badge-search-dropdown"
        >
          {results.map((badge) => (
            <button
              key={badge.id}
              onClick={() => handleSelect(badge)}
              className="w-full px-4 py-3 text-left transition-colors flex items-center gap-3"
              style={{
                borderBottom: `1px solid ${colors.cardBorder}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  (isDark || isGame) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {/* Badge icon */}
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {badge.name}
                </div>
                <div className="text-xs flex items-center gap-2" style={{ color: colors.textMuted }}>
                  <span>{badge.issuer}</span>
                  {badge.difficulty_level && (
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${getDifficultyColor(badge.difficulty_level)}20`,
                        color: getDifficultyColor(badge.difficulty_level),
                      }}
                    >
                      {badge.difficulty_level}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

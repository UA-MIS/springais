// Search and filter bar component
// Provides search input and filter tabs

import { useState, useEffect } from 'react';

export default function SkillSearchBar({ 
  filterTab, 
  onFilterChange, 
  onSearchChange,
  theme 
}) {
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const tabs = [
    { id: 'all', label: 'All Skills' },
    { id: 'active', label: 'In Progress' },
    { id: 'recommended', label: 'Recommended' },
  ];

  return (
    <div className="mb-6">
      {/* Filter Tabs */}
      <div 
        className="inline-flex items-center gap-1 mb-4 p-1 rounded-xl"
        style={{ backgroundColor: theme?.tabBg || '#f1f5f9' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange?.(tab.id)}
            className="px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={filterTab === tab.id ? {
              backgroundColor: theme?.activeTab?.bg || '#ffffff',
              color: theme?.activeTab?.text || '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            } : {
              backgroundColor: 'transparent',
              color: theme?.headerSubtext || '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5"
            style={{ color: theme?.headerSubtext || '#64748b' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search skills by name, category..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all duration-200 text-sm"
          style={{ 
            backgroundColor: theme?.cardBg || '#ffffff',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: theme?.searchBorder || '#e2e8f0',
            color: theme?.categoryText || '#1e293b',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme?.searchFocusBorder || '#64748b';
            e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.05)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme?.searchBorder || '#e2e8f0';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
    </div>
  );
}

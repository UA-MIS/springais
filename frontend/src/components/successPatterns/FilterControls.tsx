import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterOptions {
  department: string;
  roleLevel: string;
  timePeriod: string;
}

interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  border: string;
  accent: string;
}

interface FilterControlsProps {
  onFilterChange: (filters: FilterOptions) => void;
  isDark?: boolean;
  colors?: ThemeColors;
}

export default function FilterControls({ onFilterChange, isDark = true, colors }: FilterControlsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterOptions>({
    department: searchParams.get('dept') || 'All',
    roleLevel: searchParams.get('level') || 'All',
    timePeriod: searchParams.get('period') || 'All time',
  });

  // Default colors for backwards compatibility
  const themeColors = colors || {
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    cardBg: '#ffffff',
    cardBorder: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.15)',
    accent: '#FFE600',
  };

  const optionStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#09090b' : '#ffffff',
    color: isDark ? 'rgba(255,255,255,0.92)' : '#1e293b',
  };

  const hasActiveFilters =
    filters.department !== 'All' ||
    filters.roleLevel !== 'All' ||
    filters.timePeriod !== 'All time';

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (filters.department !== 'All') params.set('dept', filters.department);
    if (filters.roleLevel !== 'All') params.set('level', filters.roleLevel);
    if (filters.timePeriod !== 'All time') params.set('period', filters.timePeriod);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      department: 'All',
      roleLevel: 'All',
      timePeriod: 'All time',
    };
    setFilters(clearedFilters);
    setSearchParams({}, { replace: true });
    onFilterChange(clearedFilters);
  };

  const activeFiltersList = [];
  if (filters.department !== 'All') activeFiltersList.push(filters.department);
  if (filters.roleLevel !== 'All') activeFiltersList.push(filters.roleLevel);
  if (filters.timePeriod !== 'All time') activeFiltersList.push(filters.timePeriod);

  const selectStyle: React.CSSProperties = {
    backgroundColor: isDark ? 'rgba(9, 9, 11, 0.6)' : themeColors.cardBg,
    color: themeColors.textPrimary,
    borderColor: themeColors.border,
  };

  return (
    <div
      className="p-6 rounded-sm shadow-2xl mb-6 transition-colors"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : themeColors.cardBg,
        border: `1px solid ${themeColors.cardBorder}`,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
      }}
    >
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Department Filter */}
        <div className="flex-1">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: themeColors.textMuted }}
          >
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full px-4 py-2 rounded-lg outline-none transition-colors"
            style={selectStyle}
          >
            <option value="All" style={optionStyle}>All</option>
            <option value="Advisory" style={optionStyle}>Advisory</option>
            <option value="Tax" style={optionStyle}>Tax</option>
            <option value="Consulting" style={optionStyle}>Consulting</option>
            <option value="Audit" style={optionStyle}>Audit</option>
          </select>
        </div>

        {/* Role Level Filter */}
        <div className="flex-1">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: themeColors.textMuted }}
          >
            Role Level
          </label>
          <select
            value={filters.roleLevel}
            onChange={(e) => handleFilterChange('roleLevel', e.target.value)}
            className="w-full px-4 py-2 rounded-lg outline-none transition-colors"
            style={selectStyle}
          >
            <option value="All" style={optionStyle}>All</option>
            <option value="Analyst" style={optionStyle}>Analyst</option>
            <option value="Consultant" style={optionStyle}>Consultant</option>
            <option value="Manager" style={optionStyle}>Manager</option>
            <option value="Director" style={optionStyle}>Director</option>
          </select>
        </div>

        {/* Time Period Filter */}
        <div className="flex-1">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: themeColors.textMuted }}
          >
            Time Period
          </label>
          <select
            value={filters.timePeriod}
            onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
            className="w-full px-4 py-2 rounded-lg outline-none transition-colors"
            style={selectStyle}
          >
            <option value="All time" style={optionStyle}>All time</option>
            <option value="Last 5 years" style={optionStyle}>Last 5 years</option>
            <option value="Last 10 years" style={optionStyle}>Last 10 years</option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyFilters}
          className="px-6 py-2 font-semibold rounded-lg transition-colors"
          style={{ backgroundColor: themeColors.accent, color: '#2E2E38' }}
        >
          Apply Filters
        </button>

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 font-semibold rounded-lg transition-colors"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : themeColors.cardBg,
              color: themeColors.textPrimary,
              border: `1px solid ${themeColors.border}`,
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: `1px solid ${themeColors.border}` }}
        >
          <p className="text-sm" style={{ color: themeColors.textMuted }}>
            Filtered by:{' '}
            <span className="font-semibold" style={{ color: themeColors.textSecondary }}>
              {activeFiltersList.join(', ')}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

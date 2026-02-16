import { useState, useEffect, useRef, useMemo } from 'react';
import { Match } from '../../services/mockMatchData';

export interface FilterState {
  departments: string[];
  locations: string[];
  min_score: number;
  experience_levels: string[];
  usOnly: boolean;
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

interface MatchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isDark: boolean;
  colors: ThemeColors;
  matches?: Match[];
}

export default function MatchFilters({ filters, onFiltersChange, isDark, colors, matches = [] }: MatchFiltersProps) {
  // Derive filter options from actual match data
  const filterOptions = useMemo(() => {
    const departments = [...new Set(matches.map(m => m.department).filter(Boolean))].sort();
    const locations = [...new Set(matches.map(m => m.location).filter(Boolean))].sort();
    const experienceLevels = [...new Set(matches.map(m => m.experience_required).filter(Boolean))].sort();
    return { departments, locations, experienceLevels };
  }, [matches]);

  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);
  const locRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setIsDepartmentOpen(false);
      }
      if (locRef.current && !locRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (expRef.current && !expRef.current.contains(event.target as Node)) {
        setIsExperienceOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDepartment = (dept: string) => {
    const newDepartments = filters.departments.includes(dept)
      ? filters.departments.filter(d => d !== dept)
      : [...filters.departments, dept];
    onFiltersChange({ ...filters, departments: newDepartments });
  };

  const toggleLocation = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter(l => l !== location)
      : [...filters.locations, location];
    onFiltersChange({ ...filters, locations: newLocations });
  };

  const toggleExperience = (level: string) => {
    const newLevels = filters.experience_levels.includes(level)
      ? filters.experience_levels.filter(l => l !== level)
      : [...filters.experience_levels, level];
    onFiltersChange({ ...filters, experience_levels: newLevels });
  };

  const resetFilters = () => {
    onFiltersChange({
      departments: [],
      locations: [],
      min_score: 0,
      experience_levels: [],
      usOnly: true,  // Default to US only
    });
  };

  const toggleUsOnly = () => {
    onFiltersChange({ ...filters, usOnly: !filters.usOnly });
  };

  const hasActiveFilters =
    filters.departments.length > 0 ||
    filters.locations.length > 0 ||
    filters.experience_levels.length > 0 ||
    !filters.usOnly;  // Show reset if US filter is off

  const inputBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg;
  const dropdownBgColor = isDark ? 'rgba(30, 30, 40, 0.95)' : colors.cardBg;

  return (
    <div
      className="mb-6 p-4 rounded-sm shadow-2xl transition-colors"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm underline transition-colors"
            style={{ color: colors.textMuted }}
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Department Dropdown */}
        <div className="relative" ref={deptRef}>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: colors.textMuted }}
          >
            Department
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
              className="w-full px-4 py-2 rounded-sm text-left flex justify-between items-center transition-colors"
              style={{
                backgroundColor: inputBgColor,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            >
              <span className="text-sm">
                {filters.departments.length === 0
                  ? 'All Departments'
                  : `${filters.departments.length} selected`}
              </span>
              <span style={{ color: colors.textMuted }}>▼</span>
            </button>
            {isDepartmentOpen && (
              <div
                className="absolute z-10 w-full mt-1 rounded-sm shadow-2xl max-h-60 overflow-y-auto"
                style={{
                  backgroundColor: dropdownBgColor,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {filterOptions.departments.map((dept) => (
                  <label
                    key={dept}
                    className="flex items-center px-4 py-2 cursor-pointer transition-colors"
                    style={{ color: colors.textPrimary }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.departments.includes(dept)}
                      onChange={() => toggleDepartment(dept)}
                      className="mr-2"
                    />
                    <span className="text-sm">{dept}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="relative" ref={locRef}>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: colors.textMuted }}
          >
            Location
          </label>
          <div className="relative">
            <button
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="w-full px-4 py-2 rounded-sm text-left flex justify-between items-center transition-colors"
              style={{
                backgroundColor: inputBgColor,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            >
              <span className="text-sm">
                {filters.locations.length === 0
                  ? 'All Locations'
                  : `${filters.locations.length} selected`}
              </span>
              <span style={{ color: colors.textMuted }}>▼</span>
            </button>
            {isLocationOpen && (
              <div
                className="absolute z-10 w-full mt-1 rounded-sm shadow-2xl max-h-60 overflow-y-auto"
                style={{
                  backgroundColor: dropdownBgColor,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {filterOptions.locations.map((location) => (
                  <label
                    key={location}
                    className="flex items-center px-4 py-2 cursor-pointer transition-colors"
                    style={{ color: colors.textPrimary }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.locations.includes(location)}
                      onChange={() => toggleLocation(location)}
                      className="mr-2"
                    />
                    <span className="text-sm">{location}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Experience Level Dropdown */}
        <div className="relative" ref={expRef}>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: colors.textMuted }}
          >
            Experience Level
          </label>
          <div className="relative">
            <button
              onClick={() => setIsExperienceOpen(!isExperienceOpen)}
              className="w-full px-4 py-2 rounded-sm text-left flex justify-between items-center transition-colors"
              style={{
                backgroundColor: inputBgColor,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            >
              <span className="text-sm">
                {filters.experience_levels.length === 0
                  ? 'All Levels'
                  : `${filters.experience_levels.length} selected`}
              </span>
              <span style={{ color: colors.textMuted }}>▼</span>
            </button>
            {isExperienceOpen && (
              <div
                className="absolute z-10 w-full mt-1 rounded-sm shadow-2xl max-h-60 overflow-y-auto"
                style={{
                  backgroundColor: dropdownBgColor,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {filterOptions.experienceLevels.map((level) => (
                  <label
                    key={level}
                    className="flex items-center px-4 py-2 cursor-pointer transition-colors"
                    style={{ color: colors.textPrimary }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.experience_levels.includes(level)}
                      onChange={() => toggleExperience(level)}
                      className="mr-2"
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* US Only Toggle */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: colors.textMuted }}
          >
            Region
          </label>
          <button
            onClick={toggleUsOnly}
            className="w-full px-4 py-2 rounded-sm text-left flex justify-between items-center transition-colors"
            style={{
              backgroundColor: filters.usOnly ? colors.accent : inputBgColor,
              border: `1px solid ${filters.usOnly ? colors.accent : colors.border}`,
              color: filters.usOnly ? '#2E2E38' : colors.textPrimary,
            }}
          >
            <span className="text-sm font-medium">
              {filters.usOnly ? 'US Only' : 'All Regions'}
            </span>
            <span
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{
                backgroundColor: filters.usOnly
                  ? 'rgba(0, 0, 0, 0.2)'
                  : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                style={{
                  backgroundColor: filters.usOnly ? '#2E2E38' : colors.textMuted,
                  left: filters.usOnly ? '22px' : '2px',
                }}
              />
            </span>
          </button>
          <p
            className="text-xs mt-1"
            style={{ color: colors.textMuted }}
          >
            {filters.usOnly ? 'Showing US positions only' : 'Showing all global positions'}
          </p>
        </div>
      </div>

      {/* Active Filter Tags */}
      {(filters.departments.length > 0 || filters.locations.length > 0 || filters.experience_levels.length > 0) && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <div className="flex flex-wrap gap-2">
            {filters.departments.map((dept) => (
              <button
                key={dept}
                onClick={() => toggleDepartment(dept)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: colors.accent,
                  color: '#2E2E38',
                }}
              >
                {dept} ×
              </button>
            ))}
            {filters.locations.map((loc) => (
              <button
                key={loc}
                onClick={() => toggleLocation(loc)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: colors.accent,
                  color: '#2E2E38',
                }}
              >
                {loc} ×
              </button>
            ))}
            {filters.experience_levels.map((level) => (
              <button
                key={level}
                onClick={() => toggleExperience(level)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: colors.accent,
                  color: '#2E2E38',
                }}
              >
                {level} ×
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { MOCK_FILTER_OPTIONS } from '../../services/mockMatchData';

export interface FilterState {
  departments: string[];
  locations: string[];
  min_score: number;
  experience_levels: string[];
}

interface MatchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function MatchFilters({ filters, onFiltersChange }: MatchFiltersProps) {
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
      min_score: 70,
      experience_levels: []
    });
  };

  const hasActiveFilters = 
    filters.departments.length > 0 ||
    filters.locations.length > 0 ||
    filters.min_score !== 70 ||
    filters.experience_levels.length > 0;

  return (
    <div className="mb-6 p-4 border border-white/15 bg-white/7 rounded-sm shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-white/60 hover:text-white/85 underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Department Dropdown */}
        <div className="relative" ref={deptRef}>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Department
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
              className="w-full px-4 py-2 bg-white/10 border border-white/15 rounded-sm text-left flex justify-between items-center hover:bg-white/15 hover:border-[#FFE600] transition-colors"
            >
              <span className="text-sm text-white/85">
                {filters.departments.length === 0
                  ? 'All Departments'
                  : `${filters.departments.length} selected`}
              </span>
              <span className="text-white/60">▼</span>
            </button>
            {isDepartmentOpen && (
              <div className="absolute z-10 w-full mt-1 border border-white/15 bg-white/7 backdrop-blur-md rounded-sm shadow-2xl max-h-60 overflow-y-auto">
                {MOCK_FILTER_OPTIONS.departments.map((dept) => (
                  <label
                    key={dept}
                    className="flex items-center px-4 py-2 hover:bg-white/10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.departments.includes(dept)}
                      onChange={() => toggleDepartment(dept)}
                      className="mr-2"
                    />
                    <span className="text-sm text-white/85">{dept}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="relative" ref={locRef}>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Location
          </label>
          <div className="relative">
            <button
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="w-full px-4 py-2 bg-white/10 border border-white/15 rounded-sm text-left flex justify-between items-center hover:bg-white/15 hover:border-[#FFE600] transition-colors"
            >
              <span className="text-sm text-white/85">
                {filters.locations.length === 0
                  ? 'All Locations'
                  : `${filters.locations.length} selected`}
              </span>
              <span className="text-white/60">▼</span>
            </button>
            {isLocationOpen && (
              <div className="absolute z-10 w-full mt-1 border border-white/15 bg-white/7 backdrop-blur-md rounded-sm shadow-2xl max-h-60 overflow-y-auto">
                {MOCK_FILTER_OPTIONS.locations.map((location) => (
                  <label
                    key={location}
                    className="flex items-center px-4 py-2 hover:bg-white/10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.locations.includes(location)}
                      onChange={() => toggleLocation(location)}
                      className="mr-2"
                    />
                    <span className="text-sm text-white/85">{location}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Experience Level Dropdown */}
        <div className="relative" ref={expRef}>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Experience Level
          </label>
          <div className="relative">
            <button
              onClick={() => setIsExperienceOpen(!isExperienceOpen)}
              className="w-full px-4 py-2 bg-white/10 border border-white/15 rounded-sm text-left flex justify-between items-center hover:bg-white/15 hover:border-[#FFE600] transition-colors"
            >
              <span className="text-sm text-white/85">
                {filters.experience_levels.length === 0
                  ? 'All Levels'
                  : `${filters.experience_levels.length} selected`}
              </span>
              <span className="text-white/60">▼</span>
            </button>
            {isExperienceOpen && (
              <div className="absolute z-10 w-full mt-1 border border-white/15 bg-white/7 backdrop-blur-md rounded-sm shadow-2xl max-h-60 overflow-y-auto">
                {MOCK_FILTER_OPTIONS.experience_levels.map((level) => (
                  <label
                    key={level}
                    className="flex items-center px-4 py-2 hover:bg-white/10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.experience_levels.includes(level)}
                      onChange={() => toggleExperience(level)}
                      className="mr-2"
                    />
                    <span className="text-sm text-white/85">{level}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Min Score Slider */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Min Match Score: {filters.min_score}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.min_score}
            onChange={(e) => onFiltersChange({ ...filters, min_score: parseInt(e.target.value) })}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FFE600]"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Active Filter Tags */}
      {(filters.departments.length > 0 || filters.locations.length > 0 || filters.experience_levels.length > 0) && (
        <div className="mt-4 pt-4 border-t border-white/15">
          <div className="flex flex-wrap gap-2">
            {filters.departments.map((dept) => (
              <button
                key={dept}
                onClick={() => toggleDepartment(dept)}
                className="px-3 py-1 bg-[#FFE600] text-[#2E2E38] rounded-full text-xs font-medium hover:bg-[#E6CF00] transition-colors"
              >
                {dept} ×
              </button>
            ))}
            {filters.locations.map((loc) => (
              <button
                key={loc}
                onClick={() => toggleLocation(loc)}
                className="px-3 py-1 bg-[#FFE600] text-[#2E2E38] rounded-full text-xs font-medium hover:bg-[#E6CF00] transition-colors"
              >
                {loc} ×
              </button>
            ))}
            {filters.experience_levels.map((level) => (
              <button
                key={level}
                onClick={() => toggleExperience(level)}
                className="px-3 py-1 bg-[#FFE600] text-[#2E2E38] rounded-full text-xs font-medium hover:bg-[#E6CF00] transition-colors"
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

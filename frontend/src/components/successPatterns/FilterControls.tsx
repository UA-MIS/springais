import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterOptions {
  department: string;
  roleLevel: string;
  timePeriod: string;
}

interface FilterControlsProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function FilterControls({ onFilterChange }: FilterControlsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterOptions>({
    department: searchParams.get('dept') || 'All',
    roleLevel: searchParams.get('level') || 'All',
    timePeriod: searchParams.get('period') || 'All time',
  });

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

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Department Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#2E2E38] mb-2">
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFE600] focus:border-[#FFE600] outline-none"
          >
            <option value="All">All</option>
            <option value="Advisory">Advisory</option>
            <option value="Tax">Tax</option>
            <option value="Consulting">Consulting</option>
            <option value="Audit">Audit</option>
          </select>
        </div>

        {/* Role Level Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#2E2E38] mb-2">
            Role Level
          </label>
          <select
            value={filters.roleLevel}
            onChange={(e) => handleFilterChange('roleLevel', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFE600] focus:border-[#FFE600] outline-none"
          >
            <option value="All">All</option>
            <option value="Analyst">Analyst</option>
            <option value="Consultant">Consultant</option>
            <option value="Manager">Manager</option>
            <option value="Director">Director</option>
          </select>
        </div>

        {/* Time Period Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#2E2E38] mb-2">
            Time Period
          </label>
          <select
            value={filters.timePeriod}
            onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFE600] focus:border-[#FFE600] outline-none"
          >
            <option value="All time">All time</option>
            <option value="Last 5 years">Last 5 years</option>
            <option value="Last 10 years">Last 10 years</option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyFilters}
          className="px-6 py-2 bg-[#FFE600] text-[#2E2E38] font-semibold rounded-lg hover:bg-[#FFD700] transition-colors"
        >
          Apply Filters
        </button>

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 bg-gray-200 text-[#2E2E38] font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Filtered by: <span className="font-semibold text-[#2E2E38]">{activeFiltersList.join(', ')}</span>
          </p>
        </div>
      )}
    </div>
  );
}

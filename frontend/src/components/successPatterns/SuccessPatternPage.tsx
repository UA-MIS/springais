import React, { useState, useEffect } from 'react';
import { getSuccessPatterns, SuccessPatternsData, FilterOptions } from '../../services/successPatternService';
import MetricCards from './MetricCards';
import SuccessRateChart from './SuccessRateChart';
import TimeToPromotionChart from './TimeToPromotionChart';
import SkillFrequencyChart from './SkillFrequencyChart';
import DepartmentDistributionChart from './DepartmentDistributionChart';
import FilterControls, { FilterOptions as FilterControlsOptions } from './FilterControls';

export default function SuccessPatternPage() {
  const [data, setData] = useState<SuccessPatternsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});

  const fetchData = async (filterOptions: FilterOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSuccessPatterns(filterOptions);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load success pattern data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (filterControls: FilterControlsOptions) => {
    const filterOptions: FilterOptions = {
      department: filterControls.department !== 'All' ? filterControls.department : undefined,
      roleLevel: filterControls.roleLevel !== 'All' ? filterControls.roleLevel : undefined,
      timePeriod: filterControls.timePeriod !== 'All time' ? filterControls.timePeriod : undefined,
    };
    setFilters(filterOptions);
    fetchData(filterOptions);
  };

  const handleDepartmentClick = (department: string) => {
    // When department is clicked in pie chart, apply that filter
    handleFilterChange({
      department,
      roleLevel: 'All',
      timePeriod: 'All time',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F6FA]">
        <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFE600] mb-4"></div>
            <p className="text-gray-600">Loading success pattern data...</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F6F6FA]">
        <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading data</p>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchData(filters)}
            className="px-6 py-2 bg-[#FFE600] text-[#2E2E38] font-semibold rounded-lg hover:bg-[#FFD700] transition-colors"
          >
            Retry
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F6F6FA]">
        <div className="container mx-auto p-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No data available</p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6FA]">
      <div className="container mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#2E2E38] mb-2">
          Success Patterns & Career Insights
        </h1>
        <p className="text-lg text-gray-600">
          Data-driven insights from successful career transitions at EY
        </p>
      </div>

      {/* Filter Controls */}
      <FilterControls onFilterChange={handleFilterChange} />

      {/* Metric Cards */}
      <MetricCards metrics={data.metrics} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1 */}
        <SuccessRateChart data={data.successRateByTransition} />
        <TimeToPromotionChart data={data.timeToPromotion} />

        {/* Row 2 */}
        <SkillFrequencyChart data={data.skillFrequency} />
        <DepartmentDistributionChart
          data={data.departmentDistribution}
          onDepartmentClick={handleDepartmentClick}
        />
      </div>
      </div>
    </div>
  );
}

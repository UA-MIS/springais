import { useState, useEffect } from 'react';
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
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-center min-h-[420px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFE600] mb-4"></div>
            <p className="text-white/60">Loading success pattern data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-sm border border-white/15 bg-white/7 p-6 text-center shadow-2xl backdrop-blur-md">
          <p className="text-white font-semibold mb-2">Error loading data</p>
          <p className="text-white/60 mb-5">{error}</p>
          <button
            onClick={() => fetchData(filters)}
            className="px-6 py-2 bg-[#FFE600] text-[#2E2E38] font-semibold rounded-lg hover:bg-[#FFD700] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-sm border border-white/15 bg-white/7 p-6 text-center shadow-2xl backdrop-blur-md">
          <p className="text-white/60">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Success Patterns & Career Insights
        </h1>
        <p className="text-lg text-white/60">
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
  );
}

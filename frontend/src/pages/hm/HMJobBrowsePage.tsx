import { useState, useEffect } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useHiringManager } from '../../context/HiringManagerContext';
import { JobBrowseFilters } from '../../services/hiringManagerService';

export default function HMJobBrowsePage() {
  const { theme, isDark } = useTheme();
  const colors = themeColors[theme];
  const { state, fetchBrowseJobs, saveJob, isHiringManager } = useHiringManager();

  const [filters, setFilters] = useState<JobBrowseFilters>({
    is_active: true,
    page: 1,
    page_size: 20,
  });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (isHiringManager) {
      fetchBrowseJobs(filters);
    }
  }, [filters, isHiringManager, fetchBrowseJobs]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      await saveJob(jobId);
    } catch (err) {
      console.error('Failed to save job:', err);
    }
  };

  if (!isHiringManager) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-6">
        <div
          className="p-8 rounded-lg text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            Access Restricted
          </h2>
          <p style={{ color: colors.textMuted }}>
            This page is only available to Hiring Manager accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
        Browse Jobs
      </h1>
      <p className="mb-6" style={{ color: colors.textMuted }}>
        Find jobs you're hiring for and add them to your list
      </p>

      {/* Search and Filters */}
      <div
        className="p-4 rounded-lg mb-6"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 rounded-md"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#fff',
                border: `1px solid ${colors.cardBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 rounded-md font-semibold"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {state.loading ? (
        <div className="text-center py-12" style={{ color: colors.textMuted }}>
          Loading jobs...
        </div>
      ) : state.error ? (
        <div
          className="p-6 rounded-lg text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <p style={{ color: colors.textPrimary }}>{state.error}</p>
        </div>
      ) : (
        <>
          <p className="mb-4" style={{ color: colors.textMuted }}>
            Showing {state.browseResults.length} of {state.browseTotalCount} jobs
          </p>

          <div className="space-y-4">
            {state.browseResults.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      {job.title}
                    </h3>
                    <p style={{ color: colors.textMuted }}>
                      {job.service_line} - {job.location}
                    </p>
                    {job.required_skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.required_skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 text-xs rounded"
                            style={{
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                              color: colors.textSecondary,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {job.required_skills.length > 5 && (
                          <span className="text-xs" style={{ color: colors.textMuted }}>
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleSaveJob(job.id)}
                    disabled={job.is_saved}
                    className="px-4 py-2 rounded-md font-semibold transition-colors"
                    style={{
                      backgroundColor: job.is_saved
                        ? isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                        : colors.accent,
                      color: job.is_saved ? colors.textMuted : '#2E2E38',
                      cursor: job.is_saved ? 'default' : 'pointer',
                    }}
                  >
                    {job.is_saved ? 'Saved' : 'Add to My Jobs'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {state.browseTotalCount > (filters.page_size || 20) && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                disabled={(filters.page || 1) <= 1}
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.textPrimary,
                  opacity: (filters.page || 1) <= 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span className="px-4 py-2" style={{ color: colors.textPrimary }}>
                Page {filters.page || 1}
              </span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                disabled={(filters.page || 1) * (filters.page_size || 20) >= state.browseTotalCount}
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.textPrimary,
                  opacity: (filters.page || 1) * (filters.page_size || 20) >= state.browseTotalCount ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useHiringManager } from '../../context/HiringManagerContext';

export default function HMMyJobsPage() {
  const { theme, isDark } = useTheme();
  const colors = themeColors[theme];
  const navigate = useNavigate();
  const { state, unsaveJob, isHiringManager } = useHiringManager();

  const handleUnsave = async (savedJobId: string) => {
    if (confirm('Remove this job from your list?')) {
      try {
        await unsaveJob(savedJobId);
      } catch (err) {
        console.error('Failed to remove job:', err);
      }
    }
  };

  const handleViewInterest = (jobPostingId: string) => {
    navigate(`/hm/interest/${jobPostingId}`);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
            My Jobs
          </h1>
          <p style={{ color: colors.textMuted }}>
            Jobs you're hiring for
          </p>
        </div>
        <button
          onClick={() => navigate('/hm/browse')}
          className="px-4 py-2 rounded-md font-semibold"
          style={{
            backgroundColor: colors.accent,
            color: '#2E2E38',
          }}
        >
          Browse Jobs
        </button>
      </div>

      {state.loading ? (
        <div className="text-center py-12" style={{ color: colors.textMuted }}>
          Loading...
        </div>
      ) : state.myJobs.length === 0 ? (
        <div
          className="p-12 rounded-lg text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
            No jobs saved yet
          </h3>
          <p className="mb-6" style={{ color: colors.textMuted }}>
            Browse jobs and add the ones you're hiring for to see candidate interest.
          </p>
          <button
            onClick={() => navigate('/hm/browse')}
            className="px-6 py-2 rounded-md font-semibold"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {state.myJobs.map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      {job.job_title}
                    </h3>
                    {!job.is_active && (
                      <span
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  <p style={{ color: colors.textMuted }}>
                    {job.service_line} - {job.location}
                  </p>

                  {/* Candidate Interest Summary */}
                  <div
                    className="mt-3 p-3 rounded"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      <span className="font-semibold" style={{ color: colors.accent }}>
                        {job.candidate_interest_count}
                      </span>
                      {' '}candidate{job.candidate_interest_count !== 1 ? 's' : ''} interested
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleViewInterest(job.job_posting_id)}
                    className="px-4 py-2 rounded-md font-semibold transition-colors"
                    style={{
                      backgroundColor: colors.accent,
                      color: '#2E2E38',
                    }}
                  >
                    View Interest
                  </button>
                  <button
                    onClick={() => handleUnsave(job.id)}
                    className="px-4 py-2 rounded-md text-sm transition-colors"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: colors.textMuted,
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

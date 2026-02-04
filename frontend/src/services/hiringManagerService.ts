import api from './api';

// ============================================================
// Types
// ============================================================

export interface HMSavedJob {
  id: string;
  job_posting_id: string;
  job_title: string;
  service_line: string;
  location: string;
  is_active: boolean;
  notes: string | null;
  saved_at: string;
  candidate_interest_count: number;
}

export interface HMSavedJobsListResponse {
  jobs: HMSavedJob[];
  total_count: number;
}

export interface JobBrowseItem {
  id: string;
  title: string;
  service_line: string;
  location: string;
  is_active: boolean;
  posted_date: string | null;
  required_skills: string[];
  is_saved: boolean;
}

export interface JobBrowseResponse {
  jobs: JobBrowseItem[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface FitLevelDistribution {
  strong_fit: number;
  good_fit: number;
  moderate_fit: number;
  developing: number;
}

export interface SkillGapSummary {
  skill_name: string;
  candidates_missing: number;
  percentage_missing: number;
}

export interface AnonymizedCandidateDetail {
  candidate_label: string;
  overall_score: number;
  skill_match_score: number;
  matched_skills: string[];
  transferable_skills: string[];
  skill_gaps: string[];
  fit_level: 'strong_fit' | 'good_fit' | 'moderate_fit' | 'developing';
}

export interface CandidateInterestResponse {
  job_posting_id: string;
  job_title: string;
  total_interested: number;
  fit_distribution: FitLevelDistribution;
  average_overall_score: number | null;
  average_skill_match: number | null;
  common_skill_gaps: SkillGapSummary[];
  candidates: AnonymizedCandidateDetail[];
  last_updated: string;
  privacy_notice: string;
}

export interface JobBrowseFilters {
  service_line?: string;
  location?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

// ============================================================
// API Functions
// ============================================================

export async function browseJobs(filters: JobBrowseFilters = {}): Promise<JobBrowseResponse> {
  const params: Record<string, string | number | boolean> = {};

  if (filters.service_line) params.service_line = filters.service_line;
  if (filters.location) params.location = filters.location;
  if (filters.search) params.search = filters.search;
  if (filters.is_active !== undefined) params.is_active = filters.is_active;
  if (filters.page) params.page = filters.page;
  if (filters.page_size) params.page_size = filters.page_size;

  const response = await api.get<JobBrowseResponse>('/hm/jobs', { params });
  return response.data;
}

export async function saveJobToMyJobs(
  jobPostingId: string,
  notes?: string
): Promise<HMSavedJob> {
  const response = await api.post<HMSavedJob>('/hm/my-jobs', {
    job_posting_id: jobPostingId,
    notes,
  });
  return response.data;
}

export async function getMyJobs(): Promise<HMSavedJobsListResponse> {
  const response = await api.get<HMSavedJobsListResponse>('/hm/my-jobs');
  return response.data;
}

export async function removeFromMyJobs(savedJobId: string): Promise<void> {
  await api.delete(`/hm/my-jobs/${savedJobId}`);
}

export async function updateJobNotes(
  savedJobId: string,
  notes: string | null
): Promise<HMSavedJob> {
  const response = await api.patch<HMSavedJob>(`/hm/my-jobs/${savedJobId}/notes`, {
    notes,
  });
  return response.data;
}

export async function getCandidateInterest(
  jobPostingId: string
): Promise<CandidateInterestResponse> {
  const response = await api.get<CandidateInterestResponse>(
    `/hm/my-jobs/${jobPostingId}/interest`
  );
  return response.data;
}

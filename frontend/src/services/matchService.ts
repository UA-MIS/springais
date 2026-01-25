import api from './api';
import { Match } from './mockMatchData';

export type MatchMode = 'best_fit' | 'stretch' | 'exploratory';

export interface MatchFilters {
  departments?: string[];
  locations?: string[];
  min_score?: number;
  experience_levels?: string[];
}

const DEFAULT_EMPLOYEE_ID = 1;
const DEFAULT_MATCH_LIMIT = 500;  // Fetch all matches for client-side filtering

const mapMatchResult = (item: any): Match => {
  const gapAnalysis = item.gap_analysis || {};
  return {
    id: String(item.job_id),
    job_id: String(item.job_id),
    job_title: item.title,
    service_line: item.service_line,
    department: item.department,
    location: item.location,
    posted_date: new Date().toISOString().split('T')[0],
    experience_required: undefined,
    overall_score: item.scores?.overall ?? 0,
    skill_match_score: item.scores?.skill_match ?? 0,
    experience_score: item.scores?.experience_match ?? 0,
    role_fit_score: item.scores?.role_fit ?? item.scores?.growth_potential ?? 0,
    matched_skills: gapAnalysis.overlapping_skills || [],
    transferable_skills: gapAnalysis.transferable_skills || [],
    skill_gaps: gapAnalysis.missing_skills || [],
    explanation: item.explanation || '',
    salary_range: item.salary_range,
    job_posting_url: item.job_posting_url,
  };
};

const mapMatchDetail = (item: any): Match => {
  const gapAnalysis = item.gap_analysis || {};
  const experienceRequired = item.experience_years_min !== undefined && item.experience_years_max !== undefined
    ? `${item.experience_years_min}-${item.experience_years_max} years`
    : undefined;

  return {
    id: String(item.job_id),
    job_id: String(item.job_id),
    job_title: item.title,
    service_line: item.service_line,
    department: item.department,
    location: item.location,
    posted_date: item.posted_date || new Date().toISOString().split('T')[0],
    experience_required: experienceRequired,
    overall_score: item.scores?.overall ?? 0,
    skill_match_score: item.scores?.skill_match ?? 0,
    experience_score: item.scores?.experience_match ?? 0,
    role_fit_score: item.scores?.role_fit ?? item.scores?.growth_potential ?? 0,
    matched_skills: gapAnalysis.overlapping_skills || [],
    transferable_skills: gapAnalysis.transferable_skills || [],
    skill_gaps: gapAnalysis.missing_skills || [],
    explanation: item.explanation || '',
    salary_range: item.salary_range,
    job_posting_url: item.job_posting_url,
    job_description: item.job_description,
    required_skills: item.required_skills || [],
    preferred_skills: item.preferred_skills || [],
  };
};

export async function getMatches(
  filters?: MatchFilters
): Promise<{ matches: Match[]; total: number }> {
  // Fetch all matches in one request for client-side filtering
  const params: Record<string, string | number> = {
    limit: DEFAULT_MATCH_LIMIT,
    min_score: 0,  // Get all matches, filter/sort client-side
  };

  const response = await api.get(`/matches/employee/${DEFAULT_EMPLOYEE_ID}`, { params });
  const data = response.data;
  const matches = (data.matches || []).map(mapMatchResult);

  return {
    matches,
    total: data.total_count ?? matches.length,
  };
}

export async function getMatchDetails(matchId: string): Promise<Match | null> {
  const response = await api.get(`/matches/employee/${DEFAULT_EMPLOYEE_ID}/job/${matchId}`);
  const detail = response.data?.match;
  if (!detail) {
    return null;
  }
  return mapMatchDetail(detail);
}

export async function saveMatch(match: Match, mode: MatchMode): Promise<void> {
  await api.post('/matches/save', {
    job_posting_id: match.job_id,
    match_mode: mode,
    scores: {
      skill_match: match.skill_match_score,
      experience_match: match.experience_score,
      role_fit: match.role_fit_score,
      overall: match.overall_score,
    },
    skill_gaps: match.skill_gaps,
    matched_skills: match.matched_skills,
    explanation: match.explanation,
  });
}

export interface DeepAnalysis {
  overall_fit_assessment: string;
  skill_impacts: {
    skill_name: string;
    impact_description: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    is_gap: boolean;
    gap_severity?: 'blocker' | 'significant' | 'moderate' | 'minor';
  }[];
  success_factors: string[];
  risk_factors: string[];
  ramp_up_time_estimate: string;
  comparable_roles: string[];
  recommended_learning_path: string[];
}

export async function getDeepAnalysis(jobId: string): Promise<DeepAnalysis> {
  const response = await api.get(`/matches/job/${jobId}/deep-analysis`);
  return response.data;
}

export interface SavedMatch {
  match_id: string;
  job_id: string;
  job_title: string;
  department: string;
  service_line: string;
  location: string;
  match_mode: MatchMode;
  scores: {
    skill_match: number;
    experience_match: number;
    role_fit: number;
    overall: number;
  };
  skill_gaps: string[];
  matched_skills: string[];
  explanation: string | null;
  saved_at: string;
}

export async function getSavedMatches(): Promise<SavedMatch[]> {
  const response = await api.get('/matches/saved');
  return response.data.matches || [];
}

export async function deleteSavedMatch(matchId: string): Promise<void> {
  await api.delete(`/matches/saved/${matchId}`);
}

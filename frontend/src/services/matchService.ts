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
    growth_potential_score: item.scores?.growth_potential ?? 0,
    matched_skills: gapAnalysis.overlapping_skills || [],
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
    growth_potential_score: item.scores?.growth_potential ?? 0,
    matched_skills: gapAnalysis.overlapping_skills || [],
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
  mode: MatchMode,
  filters?: MatchFilters
): Promise<{ matches: Match[]; total: number }> {
  // Fetch all matches in one request for client-side filtering
  // Client-side filtering handles mode-based score ranges and US-only filter
  const params: Record<string, string | number> = {
    mode: 'exploratory',  // Use exploratory to get ALL matches (lowest threshold)
    limit: DEFAULT_MATCH_LIMIT,
    min_score: 0,  // Get all matches, filter client-side
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
    employee_id: String(DEFAULT_EMPLOYEE_ID),
    job_posting_id: match.job_id,
    match_mode: mode,
    scores: {
      skill_match: match.skill_match_score,
      experience_match: match.experience_score,
      growth_potential: match.growth_potential_score,
      overall: match.overall_score,
    },
    skill_gaps: match.skill_gaps,
    matched_skills: match.matched_skills,
    explanation: match.explanation,
  });
}

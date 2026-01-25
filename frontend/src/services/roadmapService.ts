import api from './api';

export type RoadmapEmphasis = 'technical' | 'leadership' | 'balanced';

export interface TargetRole {
  job_id: string;
  job_title: string;
  service_line?: string;
  order: number;
}

export interface RoadmapGenerateRequest {
  target_roles: TargetRole[];
  auto_order?: boolean;
  emphasis?: RoadmapEmphasis;
  custom_instructions?: string;
  include_certifications?: boolean;
  timeline_preference?: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'experience' | 'certification' | 'leadership' | 'networking';
  priority: 'critical' | 'high' | 'medium' | 'optional';
  estimated_duration_months: number;
  prerequisites: string[];
  skills_to_develop: string[];
  resources: string[];
  success_indicators: string[];
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  target_role?: string;
  estimated_duration_months: number;
  milestones: RoadmapMilestone[];
  status: 'completed' | 'in_progress' | 'upcoming';
}

export interface RoadmapResponse {
  roadmap_id: string;
  generated_at: string;
  current_role: string;
  current_skills: string[];
  executive_summary: string;
  total_estimated_months: number;
  phases: RoadmapPhase[];
  critical_skills_to_develop: string[];
  quick_wins: string[];
  potential_blockers: string[];
  emphasis_applied: RoadmapEmphasis;
  customization_notes?: string;
}

export interface SavedRoadmapSummary {
  id: string;
  title: string;
  target_role_titles: string[];
  total_phases: number;
  total_milestones: number;
  total_estimated_months: number;
  emphasis: string;
  executive_summary?: string;
  generated_at: string;
  created_at: string;
}

export interface SavedRoadmapDetail {
  id: string;
  title: string;
  roadmap: RoadmapResponse;
  created_at: string;
}

export interface SavedRoadmapsListResponse {
  roadmaps: SavedRoadmapSummary[];
  total_count: number;
}

export async function generateRoadmap(
  request: RoadmapGenerateRequest
): Promise<RoadmapResponse> {
  const response = await api.post('/roadmap/generate', request);
  return response.data;
}

export async function getSavedRoadmaps(): Promise<SavedRoadmapsListResponse> {
  const response = await api.get('/roadmap/saved');
  return response.data;
}

export async function getSavedRoadmap(roadmapId: string): Promise<SavedRoadmapDetail> {
  const response = await api.get(`/roadmap/saved/${roadmapId}`);
  return response.data;
}

export async function deleteSavedRoadmap(roadmapId: string): Promise<void> {
  await api.delete(`/roadmap/saved/${roadmapId}`);
}

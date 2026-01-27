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

// ============================================
// Progress Tracking Types
// ============================================

export interface MilestoneProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
  notes: string | null;
  phase_id: string;
}

export interface RoadmapExtra {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  category: 'certification' | 'skill' | 'project' | 'achievement';
  completed_at: string;
}

export interface RoadmapProgressData {
  milestones: Record<string, MilestoneProgress>;
  milestones_by_phase: Record<string, Array<{ milestone_id: string; status: string; completed_at: string | null; notes: string | null }>>;
  extras: RoadmapExtra[];
  extras_by_phase: Record<string, RoadmapExtra[]>;
  overall_progress: number;
  completed_count: number;
  total_count: number;
  extras_count: number;
}

export interface RoadmapEdit {
  id: string;
  edit_type: 'ai_assisted' | 'manual';
  description: string;
  affected_elements: string[];
  original_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  created_at: string;
}

export interface EditHistoryResponse {
  edits: RoadmapEdit[];
  has_manual_edits: boolean;
  edit_mode: 'view' | 'ai_edit' | 'manual_edit';
}

export interface AIEditResponse {
  success: boolean;
  summary: string;
  changes: Array<{
    type: string;
    element_id: string;
    description: string;
    old_value?: unknown;
    new_value?: unknown;
  }>;
  reasoning: string;
  preview: RoadmapResponse;
}

export interface EnhancedChatResponse {
  response: string;
  model_used: string;
  context_tab: string;
}

// ============================================
// Progress Tracking API Functions
// ============================================

export async function getRoadmapProgress(roadmapId: string): Promise<RoadmapProgressData> {
  const response = await api.get(`/roadmap/saved/${roadmapId}/progress`);
  return response.data;
}

export async function toggleMilestone(
  roadmapId: string,
  milestoneId: string,
  phaseId: string
): Promise<{
  milestone_id: string;
  phase_id: string;
  status: string;
  completed_at: string | null;
  overall_progress: number;
  completed_count: number;
  total_count: number;
}> {
  const response = await api.post(`/roadmap/saved/${roadmapId}/milestones/${milestoneId}/toggle`, {
    phase_id: phaseId,
  });
  return response.data;
}

export async function updateMilestoneNotes(
  roadmapId: string,
  milestoneId: string,
  phaseId: string,
  notes: string
): Promise<{ milestone_id: string; notes: string }> {
  const response = await api.post(`/roadmap/saved/${roadmapId}/milestones/${milestoneId}/notes`, {
    phase_id: phaseId,
    notes,
  });
  return response.data;
}

export async function addExtra(
  roadmapId: string,
  phaseId: string,
  title: string,
  description: string | null,
  category: string
): Promise<RoadmapExtra> {
  const response = await api.post(`/roadmap/saved/${roadmapId}/extras`, {
    phase_id: phaseId,
    title,
    description,
    category,
  });
  return response.data;
}

export async function deleteExtra(roadmapId: string, extraId: string): Promise<void> {
  await api.delete(`/roadmap/saved/${roadmapId}/extras/${extraId}`);
}

// ============================================
// Edit Tracking API Functions
// ============================================

export async function getEditHistory(roadmapId: string): Promise<EditHistoryResponse> {
  const response = await api.get(`/roadmap/saved/${roadmapId}/edits`);
  return response.data;
}

export async function recordEdit(
  roadmapId: string,
  editType: string,
  description: string,
  affectedElements: string[],
  originalValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): Promise<RoadmapEdit> {
  const response = await api.post(`/roadmap/saved/${roadmapId}/edits`, {
    edit_type: editType,
    description,
    affected_elements: affectedElements,
    original_values: originalValues,
    new_values: newValues,
  });
  return response.data;
}

export async function updateEditMode(
  roadmapId: string,
  editMode: 'view' | 'ai_edit' | 'manual_edit'
): Promise<{ roadmap_id: string; edit_mode: string }> {
  const response = await api.put(`/roadmap/saved/${roadmapId}/edit-mode?edit_mode=${editMode}`);
  return response.data;
}

// ============================================
// AI Edit API Functions
// ============================================

export async function requestAIEdit(
  roadmapId: string,
  instructions: string,
  editType: string = 'timeline'
): Promise<AIEditResponse> {
  const response = await api.post(`/roadmap/saved/${roadmapId}/edit/ai`, {
    instructions,
    edit_type: editType,
  });
  return response.data;
}

export async function applyAIEdit(
  roadmapId: string,
  updatedRoadmap: RoadmapResponse
): Promise<{ success: boolean; roadmap_id: string; total_phases: number; total_milestones: number }> {
  const response = await api.post(`/roadmap/saved/${roadmapId}/edit/apply`, updatedRoadmap);
  return response.data;
}

// ============================================
// Enhanced Chat API Function
// ============================================

export async function enhancedChat(
  roadmapId: string,
  message: string,
  useDeepThinking: boolean = false,
  currentTab: string = 'overview',
  currentPhaseId: string | null = null,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<EnhancedChatResponse> {
  const response = await api.post(`/roadmap/saved/${roadmapId}/chat/enhanced`, {
    message,
    use_deep_thinking: useDeepThinking,
    current_tab: currentTab,
    current_phase_id: currentPhaseId,
    conversation_history: conversationHistory,
  });
  return response.data;
}

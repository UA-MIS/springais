import api from './api';

export interface ExternalResource {
  title: string;
  url: string;
  type: string;
  provider: string;
  estimated_time: string;
  description: string;
}

export interface EYResource {
  title: string;
  url: string;
  type: string;
  badge_available: boolean;
  description: string;
  badge_id?: string;
  issuer?: string;
  image_url?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Module {
  id: string;
  number: number;
  title: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  // Learning content (may be null until generated)
  learning_content?: string | null;
  external_resources?: ExternalResource[];
  ey_resources?: EYResource[];
}

export interface LearningContent {
  learning_guide: string;
  external_resources: ExternalResource[];
  ey_resources: EYResource[];
  practice_exercises: string[];
  success_criteria: string[];
}

export interface SkillProgress {
  current: number;
  total: number;
  unit: string;
  percentage: number;
}

export interface SkillWithProgress {
  id: string;
  name: string;
  category: string;
  status: string;
  proficiency: number;
  // New proficiency fields
  proficiency_level: number;
  proficiency_label: string;
  source: 'resume' | 'job_gap' | 'manual' | 'roadmap';
  counts_for_matching: boolean;
  last_updated_at: string | null;
  needs_update: boolean;
  progress: SkillProgress;
  modules: Module[];
  started_at: string | null;
  completed_at: string | null;
}

// Proficiency labels constant
export const PROFICIENCY_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export interface ModuleCompletionPayload {
  completion_type: 'self_reported' | 'with_proof';
  proof_description?: string;
  proof_link?: string;
  request_ai_review?: boolean;
}

export interface UserSkillsWithProgressResponse {
  skills: SkillWithProgress[];
  total_count: number;
}

export async function getUserSkillsWithProgress(): Promise<UserSkillsWithProgressResponse> {
  const response = await api.get('/skills/me/progress');
  return response.data;
}

export async function startSkill(skillName: string): Promise<{ status: string; skill_id: string }> {
  const response = await api.post(`/skills/${encodeURIComponent(skillName)}/start`);
  return response.data;
}

export async function updateModuleProgress(
  skillName: string,
  moduleId: string,
  progress: number
): Promise<{ status: string; progress: number }> {
  const response = await api.patch(
    `/skills/${encodeURIComponent(skillName)}/modules/${moduleId}/progress`,
    { progress }
  );
  return response.data;
}

export async function completeModule(
  skillName: string,
  moduleId: string
): Promise<{ status: string; completed_at: string }> {
  const response = await api.post(
    `/skills/${encodeURIComponent(skillName)}/modules/${moduleId}/complete`
  );
  return response.data;
}

export async function completeSkill(
  skillName: string
): Promise<{ status: string; completed_at: string }> {
  const response = await api.post(
    `/skills/${encodeURIComponent(skillName)}/complete`
  );
  return response.data;
}

// ============================================
// Proficiency Management
// ============================================

export async function updateProficiency(
  skillName: string,
  proficiency: number
): Promise<{ skill_name: string; proficiency_level: number; counts_for_matching: boolean }> {
  const response = await api.patch(
    `/skills/${encodeURIComponent(skillName)}/proficiency`,
    { proficiency }
  );
  return response.data;
}

// ============================================
// Module Completion with Proof
// ============================================

export async function completeModuleWithProof(
  skillName: string,
  moduleId: string,
  payload: ModuleCompletionPayload
): Promise<{ status: string; completed_at: string; ai_feedback?: string }> {
  const response = await api.post(
    `/skills/${encodeURIComponent(skillName)}/modules/${moduleId}/complete-with-proof`,
    payload
  );
  return response.data;
}

export async function uploadModuleProof(
  skillName: string,
  moduleId: string,
  file: File
): Promise<{ filename: string; size: number; content_type: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    `/skills/${encodeURIComponent(skillName)}/modules/${moduleId}/upload-proof`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

// ============================================
// Learning Content
// ============================================

export async function generateModuleContent(
  skillName: string,
  moduleId: string
): Promise<LearningContent> {
  const response = await api.post(
    `/skills/${encodeURIComponent(skillName)}/modules/${moduleId}/generate-content`
  );
  return response.data;
}

// ============================================
// Quick Add Skills
// ============================================

export async function quickAddSkill(
  skillName: string,
  source: string = 'job_gap'
): Promise<{ skill_id: string; skill_name: string; proficiency: number; source: string; counts_for_matching: boolean }> {
  const response = await api.post('/skills/quick-add', { skill_name: skillName, source });
  return response.data;
}

// ============================================
// Stale Skills
// ============================================

export async function getStaleSkills(): Promise<{ stale_skills: Array<{
  skill_name: string;
  proficiency: number;
  proficiency_label: string;
  last_updated: string | null;
  days_since_update: number | null;
}>; count: number }> {
  const response = await api.get('/skills/stale');
  return response.data;
}

// ============================================
// Task Tracking
// ============================================

export async function toggleModuleTask(
  skillName: string,
  moduleId: string,
  taskIndex: number,
  completed: boolean
): Promise<{ tasks_completed: number[]; task_count: number; status: string }> {
  const response = await api.patch(
    `/skills/${encodeURIComponent(skillName)}/modules/${moduleId}/tasks`,
    { task_index: taskIndex, completed }
  );
  return response.data;
}

// ============================================
// Skill Maintenance
// ============================================

export async function recategorizeSkills(): Promise<{
  updated_count: number;
  total_skills: number;
  changes: Array<{ skill: string; old_category: string; new_category: string }>;
}> {
  const response = await api.post('/skills/recategorize');
  return response.data;
}

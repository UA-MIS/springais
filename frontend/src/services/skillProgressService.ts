import api from './api';

export interface Module {
  id: string;
  number: number;
  title: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
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
  progress: SkillProgress;
  modules: Module[];
  started_at: string | null;
  completed_at: string | null;
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

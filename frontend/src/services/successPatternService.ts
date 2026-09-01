import api from './api';

// Types for success patterns
export interface SuccessPatternMetrics {
  avgTimeToPromotion: number;
  overallSuccessRate: number;
  totalSampleSize: number;
  topSkills: string[];
}

export interface TransitionData {
  transition: string;
  successRate: number;
  sampleSize: number;
  color?: string;
}

export interface StageData {
  stage: string;
  avgYears: number;
}

export interface SkillFrequency {
  skill: string;
  frequency: number;
}

export interface DepartmentData {
  name: string;
  value: number;
  color?: string;
}

export interface SuccessPatternsData {
  metrics: SuccessPatternMetrics;
  successRateByTransition: TransitionData[];
  timeToPromotion: {
    [department: string]: StageData[];
  };
  skillFrequency: SkillFrequency[];
  departmentDistribution: DepartmentData[];
}

// Backend API response types
interface ApiTransitionPattern {
  pattern_id: string;
  source_role: string;
  target_role: string;
  success_rate: number;
  avg_time_to_promotion_years: number;
  sample_size: number;
  service_line: string | null;
  common_skills: string[];
  recommended_skills_to_develop: string[];
}

export const mockSuccessPatterns: SuccessPatternsData = {
  metrics: {
    avgTimeToPromotion: 2.5,
    overallSuccessRate: 0.68,
    totalSampleSize: 47,
    topSkills: ["Leadership", "Client Management", "Excel"],
  },
  successRateByTransition: [
    { transition: "Analyst → Sr. Analyst", successRate: 85, sampleSize: 120, color: "#22c55e" },
    { transition: "Sr. Analyst → Consultant", successRate: 72, sampleSize: 89, color: "#FFE600" },
    { transition: "Consultant → Sr. Consultant", successRate: 68, sampleSize: 47, color: "#FFE600" },
    { transition: "Consultant → Manager", successRate: 35, sampleSize: 31, color: "#dc2626" },
    { transition: "Manager → Sr. Manager", successRate: 45, sampleSize: 23, color: "#dc2626" },
  ],
  timeToPromotion: {
    Advisory: [
      { stage: "Analyst", avgYears: 0 },
      { stage: "Sr. Analyst", avgYears: 2.5 },
      { stage: "Consultant", avgYears: 5.2 },
      { stage: "Manager", avgYears: 8.7 },
    ],
    Tax: [
      { stage: "Analyst", avgYears: 0 },
      { stage: "Sr. Analyst", avgYears: 2.8 },
      { stage: "Consultant", avgYears: 5.8 },
      { stage: "Manager", avgYears: 9.2 },
    ],
    Consulting: [
      { stage: "Analyst", avgYears: 0 },
      { stage: "Sr. Analyst", avgYears: 2.3 },
      { stage: "Consultant", avgYears: 4.9 },
      { stage: "Manager", avgYears: 8.1 },
    ],
    Audit: [
      { stage: "Analyst", avgYears: 0 },
      { stage: "Sr. Analyst", avgYears: 2.6 },
      { stage: "Consultant", avgYears: 5.5 },
      { stage: "Manager", avgYears: 9.0 },
    ],
  },
  skillFrequency: [
    { skill: "Leadership", frequency: 92 },
    { skill: "Client Management", frequency: 87 },
    { skill: "Excel", frequency: 75 },
    { skill: "Problem Solving", frequency: 68 },
    { skill: "Project Management", frequency: 65 },
    { skill: "PowerPoint", frequency: 58 },
    { skill: "Communication", frequency: 55 },
    { skill: "Data Analysis", frequency: 47 },
    { skill: "Strategic Thinking", frequency: 42 },
    { skill: "Team Collaboration", frequency: 38 },
  ],
  departmentDistribution: [
    { name: "Advisory", value: 145, color: "#FFE600" },
    { name: "Tax", value: 98, color: "#2E2E38" },
    { name: "Consulting", value: 87, color: "#747480" },
    { name: "Audit", value: 56, color: "#C4C4CD" },
  ],
};

export interface FilterOptions {
  department?: string;
  roleLevel?: string;
  timePeriod?: string;
  minSuccessRate?: number;
}

function includesNormalized(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const matrix: number[][] = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(0));

  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[s2.length][s1.length];
}

// Fuzzy match function using similarity ratio
function fuzzyMatch(str1: string, str2: string, threshold: number = 0.7): boolean {
  if (!str1 || !str2) return false;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return true;
  
  // Substring match (one contains the other)
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const similarity = shorter.length / longer.length;
    return similarity >= Math.max(threshold, 0.6);
  }
  
  // Calculate similarity using Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const editDistance = levenshteinDistance(longer, shorter);
  const similarity = (longer.length - editDistance) / longer.length;
  
  return similarity >= threshold;
}

function roleLevelKey(roleLevel?: string): string | undefined {
  if (!roleLevel) return undefined;
  const k = roleLevel.trim().toLowerCase();
  if (k === 'consult' || k === 'consultant') return 'consultant';
  if (k === 'manager') return 'manager';
  if (k === 'director') return 'director';
  if (k === 'analyst') return 'analyst';
  return k;
}

function departmentKey(department?: string): string | undefined {
  if (!department) return undefined;
  const k = department.trim().toLowerCase();
  if (k === 'consult' || k === 'consulting') return 'consulting';
  if (k === 'tax') return 'tax';
  if (k === 'advisory') return 'advisory';
  if (k === 'audit') return 'audit';
  return k;
}

// Minimal per-department overrides so filters visibly affect charts while we’re on mock data.
const departmentOverrides: Record<
  string,
  Pick<SuccessPatternsData, 'successRateByTransition' | 'skillFrequency'>
> = {
  consulting: {
    successRateByTransition: [
      { transition: 'Analyst → Sr. Analyst', successRate: 82, sampleSize: 54 },
      { transition: 'Sr. Analyst → Consultant', successRate: 76, sampleSize: 41 },
      { transition: 'Consultant → Sr. Consultant', successRate: 71, sampleSize: 33 },
      { transition: 'Consultant → Manager', successRate: 38, sampleSize: 21 },
    ],
    skillFrequency: [
      { skill: 'Client Management', frequency: 90 },
      { skill: 'Problem Solving', frequency: 78 },
      { skill: 'PowerPoint', frequency: 72 },
      { skill: 'Communication', frequency: 68 },
      { skill: 'Leadership', frequency: 64 },
      { skill: 'Project Management', frequency: 60 },
      { skill: 'Data Analysis', frequency: 54 },
      { skill: 'Excel', frequency: 50 },
      { skill: 'Strategic Thinking', frequency: 46 },
      { skill: 'Team Collaboration', frequency: 42 },
    ],
  },
  advisory: {
    successRateByTransition: [
      { transition: 'Analyst → Sr. Analyst', successRate: 88, sampleSize: 49 },
      { transition: 'Sr. Analyst → Consultant', successRate: 74, sampleSize: 36 },
      { transition: 'Consultant → Sr. Consultant', successRate: 66, sampleSize: 29 },
      { transition: 'Consultant → Manager', successRate: 33, sampleSize: 18 },
    ],
    skillFrequency: [
      { skill: 'Leadership', frequency: 88 },
      { skill: 'Client Management', frequency: 80 },
      { skill: 'Project Management', frequency: 74 },
      { skill: 'Problem Solving', frequency: 70 },
      { skill: 'Communication', frequency: 66 },
      { skill: 'Strategic Thinking', frequency: 60 },
      { skill: 'Excel', frequency: 56 },
      { skill: 'PowerPoint', frequency: 52 },
      { skill: 'Data Analysis', frequency: 48 },
      { skill: 'Team Collaboration', frequency: 44 },
    ],
  },
  tax: {
    successRateByTransition: [
      { transition: 'Analyst → Sr. Analyst', successRate: 80, sampleSize: 39 },
      { transition: 'Sr. Analyst → Consultant', successRate: 70, sampleSize: 31 },
      { transition: 'Consultant → Sr. Consultant', successRate: 63, sampleSize: 24 },
      { transition: 'Consultant → Manager', successRate: 30, sampleSize: 16 },
    ],
    skillFrequency: [
      { skill: 'Excel', frequency: 86 },
      { skill: 'Data Analysis', frequency: 76 },
      { skill: 'Problem Solving', frequency: 70 },
      { skill: 'Communication', frequency: 64 },
      { skill: 'Client Management', frequency: 58 },
      { skill: 'Strategic Thinking', frequency: 54 },
      { skill: 'Project Management', frequency: 50 },
      { skill: 'Leadership', frequency: 46 },
      { skill: 'PowerPoint', frequency: 42 },
      { skill: 'Team Collaboration', frequency: 38 },
    ],
  },
  audit: {
    successRateByTransition: [
      { transition: 'Analyst → Sr. Analyst', successRate: 78, sampleSize: 28 },
      { transition: 'Sr. Analyst → Consultant', successRate: 68, sampleSize: 22 },
      { transition: 'Consultant → Sr. Consultant', successRate: 60, sampleSize: 17 },
      { transition: 'Consultant → Manager', successRate: 28, sampleSize: 11 },
    ],
    skillFrequency: [
      { skill: 'Team Collaboration', frequency: 80 },
      { skill: 'Communication', frequency: 72 },
      { skill: 'Problem Solving', frequency: 68 },
      { skill: 'Excel', frequency: 62 },
      { skill: 'Data Analysis', frequency: 58 },
      { skill: 'Project Management', frequency: 52 },
      { skill: 'Client Management', frequency: 48 },
      { skill: 'Leadership', frequency: 44 },
      { skill: 'PowerPoint', frequency: 40 },
      { skill: 'Strategic Thinking', frequency: 36 },
    ],
  },
};

function applyFilters(base: SuccessPatternsData, filters: FilterOptions): SuccessPatternsData {
  const dept = departmentKey(filters.department);
  const role = roleLevelKey(filters.roleLevel);

  // start with base
  const next: SuccessPatternsData = {
    ...base,
    metrics: { ...base.metrics },
    successRateByTransition: [...base.successRateByTransition],
    timeToPromotion: { ...base.timeToPromotion },
    skillFrequency: [...base.skillFrequency],
    departmentDistribution: [...base.departmentDistribution],
  };

  // Department filter: constrain department-specific charts and use overrides for others (mock-only).
  if (dept) {
    const deptName = Object.keys(next.timeToPromotion).find((k) => k.toLowerCase() === dept);
    if (deptName) {
      next.timeToPromotion = { [deptName]: next.timeToPromotion[deptName] };
    }

    const deptDistItem = next.departmentDistribution.find((d) => d.name.toLowerCase() === dept);
    next.departmentDistribution = deptDistItem ? [deptDistItem] : [];

    const overrides = departmentOverrides[dept];
    if (overrides) {
      next.successRateByTransition = overrides.successRateByTransition;
      next.skillFrequency = overrides.skillFrequency;
    }
  }

  // Role filter: narrow transitions and (optionally) stage lines to the selected role.
  // Use fuzzy matching to find similar role names
  if (role) {
    next.successRateByTransition = next.successRateByTransition.filter((t) => {
      // Try fuzzy match first (more lenient)
      const transitionParts = t.transition.split(' → ');
      const matchesSource = transitionParts[0] && fuzzyMatch(transitionParts[0], role, 0.7);
      const matchesTarget = transitionParts[1] && fuzzyMatch(transitionParts[1], role, 0.7);
      
      // Fallback to substring match if fuzzy doesn't match
      return matchesSource || matchesTarget || includesNormalized(t.transition, role);
    });

    // Keep stages up to the selected role (so lines don’t show irrelevant later stages).
    const order = ['analyst', 'sr. analyst', 'consultant', 'sr. consultant', 'manager', 'sr. manager', 'director'];
    const roleIdx = order.findIndex((r) => r === role);
    if (roleIdx !== -1) {
      const allowed = new Set(order.slice(0, roleIdx + 1));
      const filtered: SuccessPatternsData['timeToPromotion'] = {};
      Object.entries(next.timeToPromotion).forEach(([d, stages]) => {
        filtered[d] = stages.filter((s) => allowed.has(s.stage.toLowerCase()));
      });
      next.timeToPromotion = filtered;
    }
  }

  // Recompute summary metrics from what’s currently shown (simple + predictable).
  const totalSampleSize = next.successRateByTransition.reduce((sum, t) => sum + t.sampleSize, 0);
  const weightedSuccess =
    totalSampleSize === 0
      ? 0
      : next.successRateByTransition.reduce((sum, t) => sum + t.successRate * t.sampleSize, 0) / totalSampleSize;

  next.metrics = {
    ...next.metrics,
    totalSampleSize,
    overallSuccessRate: weightedSuccess / 100,
  };

  // (timePeriod filter is ignored for mock data for now)
  return next;
}

// Department color mapping for consistent chart colors
const DEPARTMENT_COLORS: Record<string, string> = {
  Advisory: '#FFE600',
  Tax: '#2E2E38',
  Consulting: '#747480',
  Audit: '#C4C4CD',
  Technology: '#22c55e',
  Strategy: '#3b82f6',
};

// Success rate color coding
function getSuccessRateColor(rate: number): string {
  if (rate >= 70) return '#22c55e'; // green
  if (rate >= 50) return '#FFE600'; // yellow
  return '#dc2626'; // red
}

// Transform API response to frontend format
function transformApiResponse(patterns: ApiTransitionPattern[]): SuccessPatternsData {
  if (!patterns || patterns.length === 0) {
    return {
      metrics: {
        avgTimeToPromotion: 0,
        overallSuccessRate: 0,
        totalSampleSize: 0,
        topSkills: [],
      },
      successRateByTransition: [],
      timeToPromotion: {},
      skillFrequency: [],
      departmentDistribution: [],
    };
  }

  // Build successRateByTransition from patterns
  const successRateByTransition: TransitionData[] = patterns.map((p) => ({
    transition: `${p.source_role} → ${p.target_role}`,
    successRate: Math.round(p.success_rate * 100), // Convert to percentage
    sampleSize: p.sample_size,
    color: getSuccessRateColor(p.success_rate * 100),
  }));

  // Calculate overall metrics
  const totalSampleSize = patterns.reduce((sum, p) => sum + p.sample_size, 0);
  const weightedSuccessRate =
    totalSampleSize > 0
      ? patterns.reduce((sum, p) => sum + p.success_rate * p.sample_size, 0) / totalSampleSize
      : 0;
  const avgTimeToPromotion =
    patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.avg_time_to_promotion_years, 0) / patterns.length
      : 0;

  // Aggregate skills from all patterns
  const skillCounts: Record<string, number> = {};
  patterns.forEach((p) => {
    p.common_skills.forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  const skillFrequency: SkillFrequency[] = Object.entries(skillCounts)
    .map(([skill, count]) => ({
      skill,
      frequency: Math.round((count / patterns.length) * 100),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const topSkills = skillFrequency.slice(0, 4).map((s) => s.skill);

  // Aggregate by department/service line
  const deptCounts: Record<string, number> = {};
  patterns.forEach((p) => {
    const dept = p.service_line || 'Other';
    deptCounts[dept] = (deptCounts[dept] || 0) + p.sample_size;
  });

  const departmentDistribution: DepartmentData[] = Object.entries(deptCounts).map(([name, value]) => ({
    name,
    value,
    color: DEPARTMENT_COLORS[name] || '#888888',
  }));

  // Build time to promotion data grouped by service line and role level
  // This aggregates avg_time_to_promotion_years by role
  const roleTimeMap: Record<string, Record<string, { totalYears: number; count: number }>> = {};
  patterns.forEach((p) => {
    const dept = p.service_line || 'General';
    if (!roleTimeMap[dept]) roleTimeMap[dept] = {};

    // Track source role time
    if (!roleTimeMap[dept][p.source_role]) {
      roleTimeMap[dept][p.source_role] = { totalYears: 0, count: 0 };
    }

    // Track target role time (source time + avg transition time)
    if (!roleTimeMap[dept][p.target_role]) {
      roleTimeMap[dept][p.target_role] = { totalYears: p.avg_time_to_promotion_years, count: 1 };
    } else {
      roleTimeMap[dept][p.target_role].totalYears += p.avg_time_to_promotion_years;
      roleTimeMap[dept][p.target_role].count += 1;
    }
  });

  const timeToPromotion: Record<string, StageData[]> = {};
  Object.entries(roleTimeMap).forEach(([dept, roles]) => {
    const stages: StageData[] = Object.entries(roles)
      .map(([stage, data]) => ({
        stage,
        avgYears: data.count > 0 ? data.totalYears / data.count : 0,
      }))
      .sort((a, b) => a.avgYears - b.avgYears);
    timeToPromotion[dept] = stages;
  });

  return {
    metrics: {
      avgTimeToPromotion: Math.round(avgTimeToPromotion * 10) / 10,
      overallSuccessRate: Math.round(weightedSuccessRate * 100) / 100,
      totalSampleSize,
      topSkills,
    },
    successRateByTransition,
    timeToPromotion,
    skillFrequency,
    departmentDistribution,
  };
}

// Fetch success patterns from the backend API
export const getSuccessPatterns = async (filters: FilterOptions = {}): Promise<SuccessPatternsData> => {
  try {
    const params: Record<string, string | number> = {};

    if (filters.department) {
      params.service_line = filters.department;
    }
    if (filters.minSuccessRate !== undefined) {
      params.min_success_rate = filters.minSuccessRate;
    }
    // Note: roleLevel filter is applied client-side since API doesn't support it directly

    const response = await api.get<ApiTransitionPattern[]>('/patterns/transitions', { params });
    let patterns = response.data;

    // Apply role level filter client-side if specified
    if (filters.roleLevel) {
      const roleLevel = filters.roleLevel.toLowerCase();
      patterns = patterns.filter(
        (p) =>
          p.source_role.toLowerCase().includes(roleLevel) ||
          p.target_role.toLowerCase().includes(roleLevel)
      );
    }

    return transformApiResponse(patterns);
  } catch (error) {
    console.error('Failed to fetch success patterns, using mock fallback:', error);
    // Return mock data on error so charts are never empty
    return applyFilters(mockSuccessPatterns, filters);
  }
};

export const getMetrics = async (filters: FilterOptions = {}): Promise<SuccessPatternMetrics> => {
  const data = await getSuccessPatterns(filters);
  return data.metrics;
};

// Mock data for success patterns (will be replaced with real API in Step 3)
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
}

function includesNormalized(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
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
  let next: SuccessPatternsData = {
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
  if (role) {
    next.successRateByTransition = next.successRateByTransition.filter((t) =>
      includesNormalized(t.transition, role)
    );

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

// Simulate async API call
export const getSuccessPatterns = async (filters: FilterOptions = {}): Promise<SuccessPatternsData> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In Step 3, replace with: return api.get('/api/patterns/...')
  // For now, return mock data (optionally filter locally)
  return applyFilters(mockSuccessPatterns, filters);
};

export const getMetrics = async (filters: FilterOptions = {}): Promise<SuccessPatternMetrics> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return applyFilters(mockSuccessPatterns, filters).metrics;
};

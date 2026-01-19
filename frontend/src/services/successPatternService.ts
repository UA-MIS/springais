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

// Simulate async API call
export const getSuccessPatterns = async (_filters: FilterOptions = {}): Promise<SuccessPatternsData> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In Step 3, replace with: return api.get('/api/patterns/...')
  // For now, return mock data (optionally filter locally)
  return mockSuccessPatterns;
};

export const getMetrics = async (_filters: FilterOptions = {}): Promise<SuccessPatternMetrics> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockSuccessPatterns.metrics;
};

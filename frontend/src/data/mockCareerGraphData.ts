export type CareerRole = {
  id: string
  label: string
  department: string
  employeeCount: number
  avgYearsInRole?: number
}

export type CareerTransition = {
  source: string
  target: string
  successRate: number // 0..1
  avgTimeYears: number
  sampleSize: number
  commonSkills: string[]
}

export type CareerGraphData = {
  roles: CareerRole[]
  transitions: CareerTransition[]
  employeeCurrentRole: string // role id
}

/**
 * Mock data shaped like Step 3 `GET /api/patterns/graph`.
 * This is used in STEP-2 Block K; Step 3 Block P will swap this
 * for a real API call and keep the same data contract.
 */
export const mockCareerGraphData: CareerGraphData = {
  roles: [
    { id: 'analyst', label: 'Analyst', department: 'Advisory', employeeCount: 120, avgYearsInRole: 2.1 },
    { id: 'senior-analyst', label: 'Senior Analyst', department: 'Advisory', employeeCount: 87, avgYearsInRole: 2.8 },
    { id: 'lead-analyst', label: 'Lead Analyst', department: 'Advisory', employeeCount: 44, avgYearsInRole: 2.6 },
    { id: 'manager', label: 'Manager', department: 'Advisory', employeeCount: 45, avgYearsInRole: 3.5 },
    { id: 'senior-manager', label: 'Senior Manager', department: 'Advisory', employeeCount: 28, avgYearsInRole: 4.2 },
    { id: 'director', label: 'Director', department: 'Advisory', employeeCount: 12, avgYearsInRole: 4.7 },

    { id: 'business-analyst', label: 'Business Analyst', department: 'Consulting', employeeCount: 56, avgYearsInRole: 2.3 },
    { id: 'senior-business-analyst', label: 'Senior Business Analyst', department: 'Consulting', employeeCount: 33, avgYearsInRole: 2.7 },
    { id: 'consultant', label: 'Consultant', department: 'Consulting', employeeCount: 62, avgYearsInRole: 2.4 },
    { id: 'senior-consultant', label: 'Senior Consultant', department: 'Consulting', employeeCount: 41, avgYearsInRole: 2.9 },
    { id: 'principal-consultant', label: 'Principal Consultant', department: 'Consulting', employeeCount: 19, avgYearsInRole: 3.6 },

    { id: 'data-analyst', label: 'Data Analyst', department: 'Technology', employeeCount: 70, avgYearsInRole: 2.0 },
    { id: 'data-engineer', label: 'Data Engineer', department: 'Technology', employeeCount: 48, avgYearsInRole: 2.6 },
    { id: 'ml-engineer', label: 'ML Engineer', department: 'Technology', employeeCount: 22, avgYearsInRole: 2.8 },
    { id: 'tech-lead', label: 'Tech Lead', department: 'Technology', employeeCount: 15, avgYearsInRole: 3.3 },
  ],
  transitions: [
    {
      source: 'analyst',
      target: 'senior-analyst',
      successRate: 0.72,
      avgTimeYears: 2.3,
      sampleSize: 64,
      commonSkills: ['Excel', 'Client Communication', 'Problem Solving'],
    },
    {
      source: 'senior-analyst',
      target: 'lead-analyst',
      successRate: 0.61,
      avgTimeYears: 2.1,
      sampleSize: 37,
      commonSkills: ['Mentoring', 'Storytelling', 'Stakeholder Management'],
    },
    {
      source: 'lead-analyst',
      target: 'manager',
      successRate: 0.58,
      avgTimeYears: 2.0,
      sampleSize: 29,
      commonSkills: ['Leadership', 'Project Management', 'Decision Making'],
    },
    {
      source: 'manager',
      target: 'senior-manager',
      successRate: 0.65,
      avgTimeYears: 3.1,
      sampleSize: 24,
      commonSkills: ['Strategic Thinking', 'Stakeholder Management', 'Budgeting'],
    },
    {
      source: 'senior-manager',
      target: 'director',
      successRate: 0.49,
      avgTimeYears: 3.6,
      sampleSize: 9,
      commonSkills: ['Portfolio Management', 'Executive Presence', 'Org Design'],
    },

    {
      source: 'analyst',
      target: 'business-analyst',
      successRate: 0.42,
      avgTimeYears: 2.8,
      sampleSize: 18,
      commonSkills: ['SQL', 'Requirements', 'Communication'],
    },
    {
      source: 'business-analyst',
      target: 'senior-business-analyst',
      successRate: 0.68,
      avgTimeYears: 2.2,
      sampleSize: 22,
      commonSkills: ['Process Mapping', 'Facilitation', 'Backlog Grooming'],
    },
    {
      source: 'senior-business-analyst',
      target: 'consultant',
      successRate: 0.55,
      avgTimeYears: 1.9,
      sampleSize: 16,
      commonSkills: ['Client Management', 'Presentation', 'Problem Framing'],
    },
    {
      source: 'consultant',
      target: 'senior-consultant',
      successRate: 0.74,
      avgTimeYears: 2.4,
      sampleSize: 31,
      commonSkills: ['Delivery', 'Client Management', 'Problem Solving'],
    },
    {
      source: 'senior-consultant',
      target: 'principal-consultant',
      successRate: 0.59,
      avgTimeYears: 2.9,
      sampleSize: 14,
      commonSkills: ['Sales Support', 'Stakeholder Management', 'Leadership'],
    },

    {
      source: 'analyst',
      target: 'data-analyst',
      successRate: 0.51,
      avgTimeYears: 2.5,
      sampleSize: 20,
      commonSkills: ['SQL', 'Statistics', 'Data Viz'],
    },
    {
      source: 'data-analyst',
      target: 'data-engineer',
      successRate: 0.57,
      avgTimeYears: 2.1,
      sampleSize: 19,
      commonSkills: ['Python', 'ETL', 'Data Modeling'],
    },
    {
      source: 'data-engineer',
      target: 'ml-engineer',
      successRate: 0.46,
      avgTimeYears: 2.4,
      sampleSize: 11,
      commonSkills: ['ML Basics', 'Model Serving', 'Data Pipelines'],
    },
    {
      source: 'ml-engineer',
      target: 'tech-lead',
      successRate: 0.54,
      avgTimeYears: 2.7,
      sampleSize: 8,
      commonSkills: ['System Design', 'Mentoring', 'Ownership'],
    },
  ],
  employeeCurrentRole: 'senior-analyst',
}

/**
 * Optional helper for stress-testing layout with ~50 nodes.
 * Not used by default.
 */
export function generateMockCareerGraphData(roleCount: number = 50): CareerGraphData {
  const departments = ['Advisory', 'Consulting', 'Technology'] as const
  const roles: CareerRole[] = []
  const transitions: CareerTransition[] = []

  for (let i = 0; i < roleCount; i += 1) {
    const dept = departments[i % departments.length]
    roles.push({
      id: `role-${i}`,
      label: `Role ${i}`,
      department: dept,
      employeeCount: 10 + ((i * 7) % 140),
      avgYearsInRole: 1.5 + ((i % 9) * 0.3),
    })
  }

  // Create a mostly-forward progression + some cross links.
  for (let i = 0; i < roleCount - 1; i += 1) {
    transitions.push({
      source: `role-${i}`,
      target: `role-${i + 1}`,
      successRate: 0.4 + ((i % 7) * 0.08),
      avgTimeYears: 1.8 + ((i % 5) * 0.4),
      sampleSize: 8 + ((i * 3) % 60),
      commonSkills: ['Communication', 'Delivery', 'Ownership'].slice(0, 1 + (i % 3)),
    })

    if (i + 4 < roleCount && i % 6 === 0) {
      transitions.push({
        source: `role-${i}`,
        target: `role-${i + 4}`,
        successRate: 0.3 + ((i % 5) * 0.1),
        avgTimeYears: 2.2,
        sampleSize: 6 + ((i * 5) % 30),
        commonSkills: ['Ambiguity', 'Problem Solving'],
      })
    }
  }

  return {
    roles,
    transitions,
    employeeCurrentRole: 'role-12',
  }
}


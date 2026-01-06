# SpringAIS Mock Data Formats

**Last Updated:** 2026-01-06
**Purpose:** Standard mock data structures for frontend development

---

## Overview

This document defines mock data formats for frontend testing **before backend integration**. Use these formats in Blocks H, I, J, K, L for development, then replace with real API calls in Blocks M, N, O, P.

---

## Employee Data

```typescript
interface Employee {
  id: number;
  email: string;
  name: string;
  role: string;
  department: string;
  service_line: string;
  location: string;
  experience_years: number;
  hire_date: string; // ISO 8601
}

// Mock data:
const mockEmployee: Employee = {
  id: 1,
  email: "john.doe@ey.com",
  name: "John Doe",
  role: "Senior Consultant",
  department: "Advisory",
  service_line: "Consulting",
  location: "New York",
  experience_years: 5,
  hire_date: "2021-01-15"
};
```

---

## Skills Data

```typescript
interface Skill {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  years_experience?: number;
  source?: 'resume' | 'manual';
}

const mockSkills: Skill[] = [
  { name: "Python", proficiency: "Expert", years_experience: 5, source: "resume" },
  { name: "SQL", proficiency: "Advanced", years_experience: 4, source: "resume" },
  { name: "Machine Learning", proficiency: "Advanced", years_experience: 3, source: "resume" },
  { name: "Leadership", proficiency: "Advanced", years_experience: 5, source: "manual" }
];
```

---

## Job Match Data

```typescript
interface JobMatch {
  job_id: number;
  title: string;
  department: string;
  location: string;
  similarity_score: number; // 0-1
  composite_score: number; // 0-1
  overlapping_skills: string[];
  missing_skills: string[];
  transferable_skills?: string[];
  gap_count: number;
}

const mockMatches: JobMatch[] = [
  {
    job_id: 42,
    title: "Senior AI Engineer",
    department: "Technology",
    location: "New York",
    similarity_score: 0.87,
    composite_score: 0.82,
    overlapping_skills: ["Python", "Machine Learning", "TensorFlow"],
    missing_skills: ["Kubernetes", "Distributed Systems"],
    transferable_skills: ["Problem Solving", "Leadership"],
    gap_count: 2
  },
  {
    job_id: 73,
    title: "Machine Learning Researcher",
    department: "Research",
    location: "San Francisco",
    similarity_score: 0.82,
    composite_score: 0.76,
    overlapping_skills: ["Python", "TensorFlow", "PyTorch"],
    missing_skills: ["Research Publications", "PhD"],
    gap_count: 2
  }
];
```

---

## Career Path Data

```typescript
interface CareerNode {
  id: number;
  title: string;
  level: number;
  is_current: boolean;
}

interface CareerEdge {
  from: number;
  to: number;
  transition_count: number;
  avg_time_months: number;
  success_rate: number; // 0-1
}

interface CareerGraph {
  nodes: CareerNode[];
  edges: CareerEdge[];
}

const mockCareerGraph: CareerGraph = {
  nodes: [
    { id: 4, title: "Consultant", level: 4, is_current: false },
    { id: 5, title: "Senior Consultant", level: 5, is_current: true },
    { id: 6, title: "Manager", level: 6, is_current: false },
    { id: 7, title: "Senior Manager", level: 7, is_current: false }
  ],
  edges: [
    { from: 4, to: 5, transition_count: 45, avg_time_months: 18, success_rate: 0.72 },
    { from: 5, to: 6, transition_count: 32, avg_time_months: 24, success_rate: 0.68 },
    { from: 6, to: 7, transition_count: 18, avg_time_months: 36, success_rate: 0.55 }
  ]
};
```

---

## Success Pattern Data

```typescript
interface SuccessMetrics {
  total_transitions: number;
  successful_transitions: number;
  success_rate: number; // 0-1
  avg_time_months: number;
  median_time_months: number;
  avg_performance_score: number; // 1-5
}

interface TopSkill {
  name: string;
  frequency: number; // 0-1 (% of successful employees with this skill)
  avg_proficiency: string;
}

interface SuccessPattern {
  from_role: { id: number; title: string };
  to_role: { id: number; title: string };
  metrics: SuccessMetrics;
  top_skills: TopSkill[];
}

const mockSuccessPattern: SuccessPattern = {
  from_role: { id: 5, title: "Senior Consultant" },
  to_role: { id: 6, title: "Manager" },
  metrics: {
    total_transitions: 45,
    successful_transitions: 32,
    success_rate: 0.71,
    avg_time_months: 18.3,
    median_time_months: 16,
    avg_performance_score: 3.8
  },
  top_skills: [
    { name: "Python", frequency: 0.92, avg_proficiency: "Expert" },
    { name: "Leadership", frequency: 0.88, avg_proficiency: "Advanced" },
    { name: "SQL", frequency: 0.85, avg_proficiency: "Advanced" }
  ]
};
```

---

## Auth Data

```typescript
interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    department: string;
  };
}

const mockLoginResponse: LoginResponse = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token",
  user: {
    id: 1,
    email: "admin@ey.com",
    name: "John Doe",
    role: "Senior Consultant",
    department: "Advisory"
  }
};
```

---

## Skill Extraction Response

```typescript
interface SkillExtractionResponse {
  employee_id: number;
  skills_extracted: Array<{
    name: string;
    proficiency: string;
    years_experience?: number;
    confidence: number; // 0-1
  }>;
  embedding_created: boolean;
  processing_time_seconds: number;
}

const mockSkillExtractionResponse: SkillExtractionResponse = {
  employee_id: 1,
  skills_extracted: [
    { name: "Python", proficiency: "Expert", years_experience: 5, confidence: 0.95 },
    { name: "SQL", proficiency: "Advanced", years_experience: 4, confidence: 0.92 }
  ],
  embedding_created: true,
  processing_time_seconds: 12.4
};
```

---

## Usage in Frontend

### Creating Mock Services

```typescript
// frontend/src/services/mockApi.ts
const MOCK_DELAY = 500; // Simulate network latency

export const mockApi = {
  getMatches: async (employeeId: number): Promise<JobMatch[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return mockMatches;
  },

  getCareerPath: async (employeeId: number): Promise<CareerGraph> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return mockCareerGraph;
  },

  getSuccessPattern: async (fromRole: number, toRole: number): Promise<SuccessPattern> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return mockSuccessPattern;
  }
};
```

### Switching Between Mock and Real API

```typescript
// frontend/src/services/api.ts
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const api = USE_MOCK ? mockApi : realApi;

// In .env:
VITE_USE_MOCK=true  // Use mock data
VITE_USE_MOCK=false // Use real backend
```

---

## Related Documentation

- `reference-docs/backend/api-reference.md` - Real API response formats
- `reference-docs/data/seed-scripts.md` - Database seeding

**Implemented In:** Blocks H, I, J, K, L (frontend UI blocks)

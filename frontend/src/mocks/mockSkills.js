// Mock skills data for Skills Dashboard
// This will be replaced with real API data in Step 3 (Block N)

export const MOCK_SKILLS = [
  // Cloud & Infrastructure
  {
    id: 'skill-001',
    name: 'AWS Solutions Architect',
    category: 'cloud_infrastructure',
    proficiency: 75,
    status: 'active', // active, complete, recommended
    progress: {
      current: 6,
      total: 8,
      unit: 'modules',
    },
    lastUpdated: '2024-03-15',
    certifications: ['AWS SAA-C03'],
    notes: 'Currently preparing for certification exam',
    timeline: [
      { date: '2024-01-15', event: 'Started learning path', description: 'Enrolled in AWS Solutions Architect Associate course' },
      { date: '2024-02-01', event: 'Module 1-2 Completed', description: 'Architecting Fundamentals and Design Principles' },
      { date: '2024-02-15', event: 'Module 3-4 Completed', description: 'Compute and Storage Services' },
      { date: '2024-03-01', event: 'Module 5-6 Completed', description: 'Networking and Security' },
      { date: '2024-03-15', event: 'Module 7-8 In Progress', description: 'Databases and Migration' },
    ],
    learningResources: [
      { type: 'course', title: 'AWS Solutions Architect Associate - Official Course', url: '#', provider: 'AWS Training' },
      { type: 'certification', title: 'AWS Certified Solutions Architect - Associate', url: '#', provider: 'AWS' },
      { type: 'practice', title: 'AWS Solutions Architect Practice Exams', url: '#', provider: 'ExamPro' },
      { type: 'documentation', title: 'AWS Well-Architected Framework', url: '#', provider: 'AWS Docs' },
    ],
  },
  {
    id: 'skill-002',
    name: 'AWS Cloud Practitioner',
    category: 'cloud_infrastructure',
    proficiency: 100,
    status: 'complete',
    progress: {
      current: 1,
      total: 1,
      unit: 'certification',
    },
    completedDate: '2023-12-15',
    certifications: ['AWS CP'],
    notes: 'Certified December 2023',
    timeline: [
      { date: '2023-11-01', event: 'Started preparation', description: 'Began AWS Cloud Practitioner study plan' },
      { date: '2023-11-20', event: 'Practice exams completed', description: 'Scored 85%+ on all practice tests' },
      { date: '2023-12-15', event: 'Certification achieved', description: 'Passed AWS Certified Cloud Practitioner exam' },
    ],
    learningResources: [
      { type: 'course', title: 'AWS Cloud Practitioner Essentials', url: '#', provider: 'AWS Training' },
      { type: 'certification', title: 'AWS Certified Cloud Practitioner', url: '#', provider: 'AWS' },
    ],
  },
  {
    id: 'skill-003',
    name: 'Kubernetes',
    category: 'cloud_infrastructure',
    proficiency: 45,
    status: 'active',
    progress: {
      current: 3,
      total: 6,
      unit: 'modules',
    },
    lastUpdated: '2024-02-20',
    notes: 'Container orchestration platform',
    timeline: [
      { date: '2024-01-10', event: 'Started learning', description: 'Began Kubernetes fundamentals course' },
      { date: '2024-01-25', event: 'Module 1-2 Completed', description: 'Kubernetes Architecture and Core Concepts' },
      { date: '2024-02-10', event: 'Module 3 Completed', description: 'Pods, Services, and Deployments' },
      { date: '2024-02-20', event: 'Module 4 In Progress', description: 'ConfigMaps, Secrets, and Volumes' },
    ],
    learningResources: [
      { type: 'course', title: 'Kubernetes Fundamentals', url: '#', provider: 'CNCF' },
      { type: 'course', title: 'Kubernetes in Production', url: '#', provider: 'Linux Foundation' },
      { type: 'certification', title: 'Certified Kubernetes Administrator (CKA)', url: '#', provider: 'CNCF' },
      { type: 'documentation', title: 'Kubernetes Official Documentation', url: '#', provider: 'Kubernetes.io' },
    ],
  },
  {
    id: 'skill-004',
    name: 'Docker',
    category: 'cloud_infrastructure',
    proficiency: 100,
    status: 'complete',
    progress: {
      current: 1,
      total: 1,
      unit: 'certification',
    },
    completedDate: '2023-10-10',
    notes: 'Containerization expertise',
  },
  {
    id: 'skill-005',
    name: 'Terraform',
    category: 'cloud_infrastructure',
    proficiency: 60,
    status: 'active',
    progress: {
      current: 4,
      total: 6,
      unit: 'modules',
    },
    lastUpdated: '2024-01-30',
    notes: 'Infrastructure as Code',
  },
  {
    id: 'skill-006',
    name: 'Azure Fundamentals',
    category: 'cloud_infrastructure',
    proficiency: 30,
    status: 'active',
    progress: {
      current: 2,
      total: 5,
      unit: 'modules',
    },
    lastUpdated: '2024-03-01',
    notes: 'Multi-cloud strategy',
  },
  // Leadership & Management
  {
    id: 'skill-007',
    name: 'Team Leadership',
    category: 'leadership_management',
    proficiency: 60,
    status: 'active',
    progress: {
      current: 3,
      total: 5,
      unit: 'modules',
    },
    lastUpdated: '2024-02-15',
    notes: 'Leading project teams',
  },
  {
    id: 'skill-008',
    name: 'Mentorship',
    category: 'leadership_management',
    proficiency: 0,
    status: 'recommended',
    progress: {
      current: 0,
      total: 4,
      unit: 'modules',
    },
    notes: 'Formal mentoring program',
  },
  {
    id: 'skill-009',
    name: 'Project Management',
    category: 'leadership_management',
    proficiency: 70,
    status: 'active',
    progress: {
      current: 5,
      total: 7,
      unit: 'modules',
    },
    lastUpdated: '2024-03-10',
    notes: 'Delivery excellence',
  },
  {
    id: 'skill-010',
    name: 'Strategic Planning',
    category: 'leadership_management',
    proficiency: 30,
    status: 'active',
    progress: {
      current: 1,
      total: 4,
      unit: 'modules',
    },
    lastUpdated: '2024-01-20',
    notes: 'Long-term thinking',
  },
  {
    id: 'skill-011',
    name: 'Conflict Resolution',
    category: 'leadership_management',
    proficiency: 55,
    status: 'active',
    progress: {
      current: 3,
      total: 5,
      unit: 'modules',
    },
    lastUpdated: '2024-02-28',
    notes: 'Managing team dynamics',
  },
  // Data & Analytics
  {
    id: 'skill-012',
    name: 'Python for Data Science',
    category: 'data_analytics',
    proficiency: 80,
    status: 'active',
    progress: {
      current: 8,
      total: 10,
      unit: 'modules',
    },
    lastUpdated: '2024-03-12',
    notes: 'Data analysis and visualization',
  },
  {
    id: 'skill-013',
    name: 'SQL Advanced',
    category: 'data_analytics',
    proficiency: 85,
    status: 'active',
    progress: {
      current: 7,
      total: 8,
      unit: 'modules',
    },
    lastUpdated: '2024-03-05',
    notes: 'Complex queries and optimization',
  },
  {
    id: 'skill-014',
    name: 'Machine Learning Fundamentals',
    category: 'data_analytics',
    proficiency: 40,
    status: 'active',
    progress: {
      current: 2,
      total: 6,
      unit: 'modules',
    },
    lastUpdated: '2024-02-10',
    notes: 'ML basics and algorithms',
  },
  {
    id: 'skill-015',
    name: 'Tableau',
    category: 'data_analytics',
    proficiency: 65,
    status: 'active',
    progress: {
      current: 5,
      total: 7,
      unit: 'modules',
    },
    lastUpdated: '2024-02-25',
    notes: 'Data visualization',
  },
  // Consulting Excellence
  {
    id: 'skill-016',
    name: 'Client Presentations',
    category: 'consulting_excellence',
    proficiency: 100,
    status: 'complete',
    progress: {
      current: 1,
      total: 1,
      unit: 'certification',
    },
    completedDate: '2023-11-20',
    notes: 'Executive communication',
  },
  {
    id: 'skill-017',
    name: 'Stakeholder Management',
    category: 'consulting_excellence',
    proficiency: 85,
    status: 'active',
    progress: {
      current: 6,
      total: 7,
      unit: 'modules',
    },
    lastUpdated: '2024-03-08',
    notes: 'Building partnerships',
  },
  {
    id: 'skill-018',
    name: 'Business Analysis',
    category: 'consulting_excellence',
    proficiency: 75,
    status: 'active',
    progress: {
      current: 6,
      total: 8,
      unit: 'modules',
    },
    lastUpdated: '2024-02-18',
    notes: 'Requirements gathering',
  },
  {
    id: 'skill-019',
    name: 'Change Management',
    category: 'consulting_excellence',
    proficiency: 50,
    status: 'active',
    progress: {
      current: 3,
      total: 6,
      unit: 'modules',
    },
    lastUpdated: '2024-01-15',
    notes: 'Organizational transformation',
  },
  // Programming & Development
  {
    id: 'skill-020',
    name: 'JavaScript/TypeScript',
    category: 'programming',
    proficiency: 90,
    status: 'active',
    progress: {
      current: 9,
      total: 10,
      unit: 'modules',
    },
    lastUpdated: '2024-03-14',
    notes: 'Frontend development',
  },
  {
    id: 'skill-021',
    name: 'React',
    category: 'programming',
    proficiency: 85,
    status: 'active',
    progress: {
      current: 8,
      total: 9,
      unit: 'modules',
    },
    lastUpdated: '2024-03-11',
    notes: 'UI framework expertise',
  },
  {
    id: 'skill-022',
    name: 'Node.js',
    category: 'programming',
    proficiency: 70,
    status: 'active',
    progress: {
      current: 5,
      total: 7,
      unit: 'modules',
    },
    lastUpdated: '2024-02-22',
    notes: 'Backend development',
  },
  {
    id: 'skill-023',
    name: 'Git & Version Control',
    category: 'programming',
    proficiency: 95,
    status: 'complete',
    progress: {
      current: 1,
      total: 1,
      unit: 'certification',
    },
    completedDate: '2023-09-05',
    notes: 'Advanced Git workflows',
  },
  // Security & Compliance
  {
    id: 'skill-024',
    name: 'Security Best Practices',
    category: 'security',
    proficiency: 65,
    status: 'active',
    progress: {
      current: 5,
      total: 8,
      unit: 'modules',
    },
    lastUpdated: '2024-02-12',
    notes: 'Application security',
  },
  {
    id: 'skill-025',
    name: 'OWASP Top 10',
    category: 'security',
    proficiency: 55,
    status: 'active',
    progress: {
      current: 4,
      total: 10,
      unit: 'modules',
    },
    lastUpdated: '2024-01-28',
    notes: 'Web security vulnerabilities',
  },
  // Business Acumen
  {
    id: 'skill-026',
    name: 'Financial Analysis',
    category: 'business_acumen',
    proficiency: 45,
    status: 'active',
    progress: {
      current: 3,
      total: 6,
      unit: 'modules',
    },
    lastUpdated: '2024-02-05',
    notes: 'Budget and ROI analysis',
  },
  {
    id: 'skill-027',
    name: 'Agile Methodologies',
    category: 'business_acumen',
    proficiency: 80,
    status: 'active',
    progress: {
      current: 8,
      total: 10,
      unit: 'modules',
    },
    lastUpdated: '2024-03-09',
    notes: 'Scrum and Kanban',
  },
];

export const SKILL_CATEGORIES = [
  {
    id: 'cloud_infrastructure',
    name: 'Cloud & Infrastructure',
    emoji: '☁️',
    skillCount: 6,
    completionPercent: 85,
  },
  {
    id: 'leadership_management',
    name: 'Leadership & Management',
    emoji: '👥',
    skillCount: 5,
    completionPercent: 45,
  },
  {
    id: 'data_analytics',
    name: 'Data & Analytics',
    emoji: '📊',
    skillCount: 4,
    completionPercent: 70,
  },
  {
    id: 'consulting_excellence',
    name: 'Consulting Excellence',
    emoji: '🤝',
    skillCount: 4,
    completionPercent: 90,
  },
  {
    id: 'programming',
    name: 'Programming & Development',
    emoji: '💻',
    skillCount: 4,
    completionPercent: 85,
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    emoji: '🔒',
    skillCount: 2,
    completionPercent: 60,
  },
  {
    id: 'business_acumen',
    name: 'Business Acumen',
    emoji: '💼',
    skillCount: 2,
    completionPercent: 62,
  },
];

// Helper function to generate default timeline for skills without one
export function generateDefaultTimeline(skill) {
  const startDate = skill.lastUpdated 
    ? new Date(skill.lastUpdated) 
    : skill.completedDate 
    ? new Date(skill.completedDate) 
    : new Date();
  
  const timeline = [];
  
  if (skill.progress && skill.progress.total > 1) {
    const modulesPerMonth = Math.ceil(skill.progress.total / 3);
    for (let i = 0; i < skill.progress.current; i++) {
      const moduleDate = new Date(startDate);
      moduleDate.setMonth(moduleDate.getMonth() - (skill.progress.current - i) / modulesPerMonth);
      
      if (i === 0) {
        timeline.push({
          date: moduleDate.toISOString().split('T')[0],
          event: 'Started learning',
          description: `Began ${skill.name} learning path`,
        });
      } else if (i % 2 === 0 || i === skill.progress.current - 1) {
        timeline.push({
          date: moduleDate.toISOString().split('T')[0],
          event: `Module ${i + 1} Completed`,
          description: `Progress: ${i + 1} of ${skill.progress.total} modules`,
        });
      }
    }
    
    if (skill.progress.current < skill.progress.total) {
      timeline.push({
        date: skill.lastUpdated || new Date().toISOString().split('T')[0],
        event: 'In Progress',
        description: `Currently working on module ${skill.progress.current + 1} of ${skill.progress.total}`,
      });
    }
  } else {
    timeline.push({
      date: skill.lastUpdated || skill.completedDate || new Date().toISOString().split('T')[0],
      event: skill.status === 'complete' ? 'Completed' : 'Started',
      description: skill.status === 'complete' 
        ? `Completed ${skill.name}` 
        : `Started learning ${skill.name}`,
    });
  }
  
  return timeline;
}

// Helper function to generate default learning resources
export function generateDefaultLearningResources(skill) {
  const resources = [];
  const category = SKILL_CATEGORIES.find(c => c.id === skill.category);
  
  // Generic resources based on category
  resources.push({
    type: 'course',
    title: `${skill.name} - Fundamentals Course`,
    url: '#',
    provider: 'Online Learning Platform',
  });
  
  if (skill.category === 'cloud_infrastructure') {
    resources.push({
      type: 'documentation',
      title: `${skill.name} Official Documentation`,
      url: '#',
      provider: 'Cloud Provider',
    });
  }
  
  if (skill.proficiency < 100) {
    resources.push({
      type: 'practice',
      title: `${skill.name} Practice Exercises`,
      url: '#',
      provider: 'Practice Platform',
    });
  }
  
  if (skill.certifications && skill.certifications.length > 0) {
    resources.push({
      type: 'certification',
      title: skill.certifications[0],
      url: '#',
      provider: 'Certification Body',
    });
  }
  
  return resources;
}

// Mock function to simulate AI skill extraction from resume
export function mockExtractSkills(fileName) {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const extractedSkills = [
        {
          name: 'Python',
          category: 'programming',
          confidence: 0.95,
        },
        {
          name: 'Machine Learning',
          category: 'data_analytics',
          confidence: 0.88,
        },
        {
          name: 'AWS',
          category: 'cloud_infrastructure',
          confidence: 0.92,
        },
        {
          name: 'Team Leadership',
          category: 'leadership_management',
          confidence: 0.78,
        },
        {
          name: 'Project Management',
          category: 'leadership_management',
          confidence: 0.85,
        },
        {
          name: 'SQL',
          category: 'data_analytics',
          confidence: 0.90,
        },
      ];

      resolve({
        success: true,
        extractedSkills,
        metadata: {
          fileName,
          uploadedAt: new Date().toISOString(),
          processingTime: 3.2, // seconds
        },
      });
    }, 2500); // 2.5 second delay to simulate processing
  });
}


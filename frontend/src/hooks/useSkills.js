// Custom hook for skills state management
// Centralizes skills data and operations

import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { SKILL_CATEGORIES } from '../mocks/mockSkills';
import { useSavedRoles } from '../context/SavedRolesContext';
import {
  getUserSkillsWithProgress,
  startSkill as startSkillApi,
  completeSkill as completeSkillApi,
} from '../services/skillProgressService';

const normalizeName = (value) => value?.trim().toLowerCase();

const isKnownCategory = (categoryId) =>
  SKILL_CATEGORIES.some((category) => category.id === categoryId);

// Category keywords matching backend/app/utils/skill_categorizer.py
// IMPORTANT: Keep in sync with backend skill_categorizer.py
const CATEGORY_KEYWORDS = {
  programming: [
    // Languages
    'python', 'java', 'javascript', 'typescript', 'c#', 'c++', 'csharp',
    'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'perl',
    // Frameworks & Libraries
    'react', 'angular', 'vue', 'node', 'django', 'flask', 'spring',
    'next.js', 'nextjs', 'express', 'fastapi', 'laravel', 'rails',
    'bootstrap', 'tailwind', 'jquery', 'webpack', 'vite',
    // Web fundamentals
    'html', 'css', 'sass', 'scss', 'less',
    // Databases & Query
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'graphql',
    // Platforms
    '.net', 'asp.net', 'dotnet',
    // Concepts
    'api', 'rest', 'restful', 'microservices', 'backend', 'frontend',
    'full-stack', 'fullstack', 'web development', 'software development',
    'object-oriented', 'oop', 'functional programming',
    'authentication', 'authorization', 'mvp',
  ],
  cloud_infrastructure: [
    'aws', 'azure', 'gcp', 'cloud', 'terraform', 'devops',
    'ci/cd', 'jenkins', 'docker', 'kubernetes', 'k8s',
    'linux', 'unix', 'windows server', 'macos', 'ubuntu', 'centos',
    'nginx', 'apache', 'load balancer', 'cdn',
    'infrastructure', 'deployment', 'serverless', 'lambda',
  ],
  data_analytics: [
    'data', 'analytics', 'machine learning', 'ml', 'ai',
    'statistics', 'etl', 'spark', 'hadoop', 'tableau',
    'power bi', 'visualization', 'pandas', 'numpy', 'scikit',
    'tensorflow', 'pytorch', 'deep learning', 'neural network',
    'nlp', 'natural language', 'llm', 'large language model',
    'data science', 'data engineering', 'data catalog',
  ],
  leadership_management: [
    'leadership', 'management', 'team lead', 'director',
    'mentoring', 'coaching', 'supervision', 'people management',
    'cross-functional', 'stakeholder', 'coordination',
    'project management', 'program management', 'scrum master',
  ],
  soft: [
    'communication', 'teamwork', 'collaboration', 'presentation',
    'negotiation', 'problem solving', 'critical thinking',
    'interpersonal', 'public speaking', 'attention to detail',
    'time management', 'adaptability', 'creativity',
  ],
  business_acumen: [
    'marketing', 'branding', 'content creation', 'seo',
    'advertising', 'campaign', 'sales', 'business development',
    'strategy', 'planning', 'budgeting', 'forecasting', 'outreach',
    'product management', 'business analysis', 'requirements',
  ],
  domain: [
    'audit', 'tax', 'advisory', 'consulting', 'financial',
    'compliance', 'regulatory', 'accounting', 'risk', 'legal',
    'procurement', 'vendor', 'supply chain', 'recruitment',
    'sox', 'it controls', 'general controls', 'access control',
    'security', 'cybersecurity', 'vulnerability', 'threat',
    'data protection', 'privacy', 'gdpr',
  ],
  tools: [
    'excel', 'powerpoint', 'word', 'google suite', 'jira',
    'confluence', 'git', 'github', 'gitlab', 'slack', 'teams',
    'salesforce', 'sap', 'oracle', 'vs code', 'cursor',
    'visual studio', 'intellij', 'eclipse', 'xcode',
    'postman', 'figma', 'sketch', 'adobe', 'photoshop',
    'trello', 'asana', 'notion', 'monday',
    'digitization', 'archiving', 'document',
  ],
  research: [
    'research', 'surveys', 'analysis', 'studies', 'methodology',
    'qualitative', 'quantitative', 'user research', 'market research',
    'ux research', 'usability', 'a/b testing',
  ],
};

const getFallbackCategory = (skillName) => {
  const value = normalizeName(skillName);
  if (!value) return 'business_acumen';

  // Check against category keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => value.includes(kw))) {
      return category;
    }
  }

  // Smart fallback
  if (['manage', 'lead', 'direct', 'head'].some((word) => value.includes(word))) {
    return 'leadership_management';
  }
  if (['develop', 'engineer', 'code', 'program'].some((word) => value.includes(word))) {
    return 'programming';
  }

  return 'business_acumen'; // Better default than programming
};

// Extract skills from saved roles
const extractSkillsFromSavedRoles = (savedRoles) => {
  if (!savedRoles || savedRoles.length === 0) return [];
  
  const skillMap = new Map();
  
  savedRoles.forEach((saved) => {
    // Extract from matched_skills (skills user has)
    (saved.matched_skills || []).forEach((skillName) => {
      if (!skillMap.has(normalizeName(skillName))) {
        skillMap.set(normalizeName(skillName), {
          name: skillName,
          source: 'saved_role',
          sourceRole: saved.job_title,
          type: 'matched',
        });
      }
    });
    
    // Extract from skill_gaps (skills needed)
    (saved.skill_gaps || []).forEach((skillName) => {
      const normalized = normalizeName(skillName);
      if (!skillMap.has(normalized)) {
        skillMap.set(normalized, {
          name: skillName,
          source: 'saved_role',
          sourceRole: saved.job_title,
          type: 'gap',
        });
      }
    });
  });
  
  return Array.from(skillMap.values());
};

export function useSkills() {
  // Get saved roles context (may be undefined if not wrapped in SavedRolesProvider)
  const savedRolesContext = useSavedRoles();
  const savedRolesState = savedRolesContext?.state || { savedRoles: [] };

  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userSkillsLoaded, setUserSkillsLoaded] = useState(false);

  // AI-generated skill categories
  const [skillCategories, setSkillCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Add a new skill
  const addSkill = (newSkill) => {
    const skillWithId = {
      ...newSkill,
      id: `skill-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setSkills([...skills, skillWithId]);
  };

  // Update an existing skill
  const updateSkill = (updatedSkill) => {
    setSkills(skills.map(skill => 
      skill.id === updatedSkill.id 
        ? { ...updatedSkill, lastUpdated: new Date().toISOString().split('T')[0] }
        : skill
    ));
  };

  // Add multiple skills (for resume extraction)
  const addSkills = (newSkills) => {
    const skillsWithIds = newSkills.map((skill, index) => ({
      ...skill,
      id: `skill-${Date.now()}-${index}`,
      lastUpdated: new Date().toISOString().split('T')[0],
      proficiency: skill.proficiency || 0,
      status: skill.status || 'active',
    }));
    setSkills([...skills, ...skillsWithIds]);
  };

  // Clear all skills (used before loading fresh data)
  const clearSkills = useCallback(() => {
    setSkills([]);
    setUserSkillsLoaded(false);
  }, []);

  const mergeRecommendations = (recommendations) => {
    const normalizedRecommendations = recommendations
      .filter((rec) => rec?.skill)
      .map((rec) => {
        const category = isKnownCategory(rec.category)
          ? rec.category
          : getFallbackCategory(rec.skill);

        return {
          id: `rec-${normalizeName(rec.skill)}`,
          name: rec.skill,
          category,
          proficiency: 0,
          status: rec.status === 'in_progress' ? 'active' : 'recommended',
          // Note: actual module count comes from /skills/me/progress API - this is just a placeholder
          progress: { current: 0, total: 0, unit: 'modules', percentage: 0 },
          notes: rec.source ? `Source: ${rec.source}` : undefined,
          relatedRoles: rec.related_roles || [],
          priority: rec.priority,
        };
      });

    if (normalizedRecommendations.length > 0) {
      setSkills((prev) => {
        // Check against current state to avoid duplicates
        const existingNames = new Set(prev.map((skill) => normalizeName(skill.name)));
        const newSkills = normalizedRecommendations.filter(
          (rec) => !existingNames.has(normalizeName(rec.name))
        );
        return newSkills.length > 0 ? [...prev, ...newSkills] : prev;
      });
    }
  };

  // Merge skills from saved roles
  const mergeSavedRolesSkills = () => {
    const savedSkills = extractSkillsFromSavedRoles(savedRolesState.savedRoles);
    if (savedSkills.length === 0) return;

    const normalizedSavedSkills = savedSkills.map((savedSkill) => {
      const category = getFallbackCategory(savedSkill.name);
      const status = savedSkill.type === 'matched' ? 'active' : 'recommended';

      return {
        id: `saved-${normalizeName(savedSkill.name)}`,
        name: savedSkill.name,
        category,
        proficiency: savedSkill.type === 'matched' ? 50 : 0,
        status,
        // Note: actual module count comes from /skills/me/progress API - this is just a placeholder
        progress: { current: savedSkill.type === 'matched' ? 2 : 0, total: 0, unit: 'modules', percentage: 0 },
        notes: `From saved role: ${savedSkill.sourceRole}`,
        relatedRoles: [savedSkill.sourceRole],
        priority: savedSkill.type === 'gap' ? 'high' : 'medium',
      };
    });

    if (normalizedSavedSkills.length > 0) {
      setSkills((prev) => {
        // Check against current state to avoid duplicates
        const existingNames = new Set(prev.map((skill) => normalizeName(skill.name)));
        const newSkills = normalizedSavedSkills.filter(
          (skill) => !existingNames.has(normalizeName(skill.name))
        );
        return newSkills.length > 0 ? [...prev, ...newSkills] : prev;
      });
    }
  };

  // Fetch user's saved skills from profile AND progress tracking
  // Progress tracking now includes AI grouping info (category, module count)
  const fetchUserSkills = async () => {
    try {
      // Fetch from both endpoints in parallel
      const [profileResponse, progressResponse] = await Promise.all([
        api.get('/skills/me').catch(() => ({ data: { skills: [] } })),
        getUserSkillsWithProgress().catch(() => ({ skills: [] })),
      ]);

      const userSkills = profileResponse?.data?.skills || [];
      const progressSkills = progressResponse?.skills || [];

      // Build a map of progress-tracked skills (these have accurate status AND AI grouping info)
      const progressMap = new Map();
      progressSkills.forEach((skill) => {
        progressMap.set(normalizeName(skill.name), skill);
      });

      // Start with progress-tracked skills (they have accurate status, category, and module count)
      const mergedSkills = [...progressSkills];
      const addedNames = new Set(progressSkills.map((s) => normalizeName(s.name)));

      // Add profile skills that aren't already tracked
      // These will show with default category until they're tracked
      if (userSkills.length > 0) {
        userSkills.forEach((skill) => {
          const normalizedName = normalizeName(skill.name);
          if (!addedNames.has(normalizedName)) {
            const category = isKnownCategory(skill.category)
              ? skill.category
              : getFallbackCategory(skill.name);

            mergedSkills.push({
              id: `user-${normalizedName}`,
              name: skill.name,
              category,
              categoryId: category,
              categoryEmoji: 'star',
              proficiency: skill.proficiency === 'beginner' ? 25 :
                           skill.proficiency === 'intermediate' ? 50 :
                           skill.proficiency === 'advanced' ? 75 :
                           skill.proficiency === 'expert' ? 95 : 50,
              status: 'active',
              // Will be updated with actual module count from groupings
              progress: { current: 0, total: 0, unit: 'modules', percentage: 0 },
              source: 'profile',
            });
            addedNames.add(normalizedName);
          }
        });
      }

      setSkills(mergedSkills);
      setUserSkillsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch user skills:', err);
      setUserSkillsLoaded(true);
    }
  };

  const refreshRecommendations = async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = force ? { refresh: true } : undefined;
      const response = await api.get('/skills/recommendations', { params });
      const recommendations = response?.data?.recommendations || [];
      mergeRecommendations(recommendations);
    } catch (err) {
      setError(err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const updateRecommendationStatus = async (skillName, status) => {
    try {
      await api.patch(`/skills/recommendations/${encodeURIComponent(skillName)}/status`, {
        status,
      });

      setSkills((prev) =>
        prev.map((skill) =>
          skill.name === skillName
            ? { ...skill, status: status === 'in_progress' ? 'active' : status }
            : skill
        )
      );
    } catch (err) {
      setError(err);
    }
  };

  // Fetch user's skill groupings - defined before useEffect that uses it
  const fetchSkillGroupings = useCallback(async () => {
    try {
      const response = await api.get('/skills/groupings');
      const categories = response.data?.categories || [];
      setSkillCategories(categories);
      return categories;
    } catch (err) {
      console.error('Failed to fetch skill groupings:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    // Only fetch user's saved skills - no auto-recommendations
    // Users should upload a resume to populate their skills
    fetchUserSkills();
    // Also fetch any saved skill groupings
    fetchSkillGroupings();
  }, [fetchSkillGroupings]);

  // Merge skills from saved roles when they're loaded
  useEffect(() => {
    if (savedRolesState.savedRoles.length > 0 && skills.length > 0) {
      mergeSavedRolesSkills();
    }
  }, [savedRolesState.savedRoles]);

  // Refresh all skills (user skills + recommendations)
  const refreshAllSkills = async () => {
    setSkills([]);
    setUserSkillsLoaded(false);
    await fetchUserSkills();
    await refreshRecommendations(true);
  };

  // Fetch skills with real progress tracking (modules)
  const fetchSkillsWithProgress = useCallback(async () => {
    try {
      const response = await getUserSkillsWithProgress();
      const skillsWithProgress = response.skills.map(skill => ({
        ...skill,
        source: 'tracked',
      }));
      setSkills(skillsWithProgress);
      setUserSkillsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch skills with progress:', error);
    }
  }, []);

  // Start tracking a skill
  const startSkillTracking = useCallback(async (skillName) => {
    try {
      await startSkillApi(skillName);
      await fetchSkillsWithProgress();
    } catch (error) {
      console.error('Failed to start skill:', error);
    }
  }, [fetchSkillsWithProgress]);

  // Generate AI skill groupings from skills
  // source: 'resume' for resume-extracted skills (start at proficiency 3)
  //         'manual' or other for manually added skills (start at proficiency 0)
  const generateSkillGroupings = useCallback(async (skillNames, careerContext = null, source = 'manual') => {
    setCategoriesLoading(true);
    try {
      const response = await api.post('/skills/group', {
        skills: skillNames,
        career_context: careerContext,
        source: source,
      });
      const categories = response.data?.categories || [];
      setSkillCategories(categories);
      return categories;
    } catch (err) {
      console.error('Failed to generate skill groupings:', err);
      return [];
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Enhance skill groupings with new skills from saved roles
  const enhanceSkillGroupings = useCallback(async (existingGroupings, newSkills) => {
    setCategoriesLoading(true);
    try {
      const response = await api.post('/skills/enhance', {
        existing_groupings: existingGroupings,
        new_skills: newSkills
      });
      const categories = response.data?.categories || [];
      setSkillCategories(categories);
      return categories;
    } catch (err) {
      console.error('Failed to enhance skill groupings:', err);
      return existingGroupings;
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Mark a skill as complete (updates local state immediately, then syncs)
  const markSkillComplete = useCallback(async (skillId, skillName) => {
    // Optimistic update - immediately show as completed
    setSkills((prev) =>
      prev.map((skill) =>
        skill.id === skillId || normalizeName(skill.name) === normalizeName(skillName)
          ? {
              ...skill,
              status: 'completed',
              proficiency: 100,
              progress: { ...skill.progress, current: skill.progress?.total || 4, percentage: 100 },
              completedDate: new Date().toISOString(),
            }
          : skill
      )
    );

    // Sync with backend
    try {
      await completeSkillApi(skillName);
      // After successful backend sync, fetch fresh data to ensure consistency
      // This ensures the skill is properly persisted and shows on refresh
      const progressResponse = await getUserSkillsWithProgress();
      const progressSkills = progressResponse?.skills || [];

      // Merge with current skills, progress data takes precedence
      setSkills((prev) => {
        const progressMap = new Map();
        progressSkills.forEach((skill) => {
          progressMap.set(normalizeName(skill.name), skill);
        });

        // Update existing skills with progress data, keep non-tracked skills
        const updatedSkills = prev.map((skill) => {
          const tracked = progressMap.get(normalizeName(skill.name));
          if (tracked) {
            progressMap.delete(normalizeName(skill.name)); // Mark as processed
            return tracked;
          }
          return skill;
        });

        // Add any new tracked skills not in current list
        progressMap.forEach((skill) => {
          updatedSkills.push(skill);
        });

        return updatedSkills;
      });
    } catch (error) {
      // If backend fails, still keep local state updated (optimistic update remains)
      console.warn('Could not sync skill completion to backend:', error);
    }
  }, []);

  return {
    skills,
    setSkills,
    selectedSkill,
    setSelectedSkill,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    addSkill,
    updateSkill,
    addSkills,
    clearSkills,
    fetchUserSkills,
    refreshRecommendations,
    refreshAllSkills,
    updateRecommendationStatus,
    fetchSkillsWithProgress,
    startSkillTracking,
    markSkillComplete,
    // AI skill grouping
    skillCategories,
    setSkillCategories,
    categoriesLoading,
    fetchSkillGroupings,
    generateSkillGroupings,
    enhanceSkillGroupings,
  };
}

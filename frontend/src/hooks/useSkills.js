// Custom hook for skills state management
// Centralizes skills data and operations

import { useEffect, useState } from 'react';
import api from '../services/api';
import { MOCK_SKILLS, SKILL_CATEGORIES } from '../mocks/mockSkills';

const normalizeName = (value) => value?.trim().toLowerCase();

const isKnownCategory = (categoryId) =>
  SKILL_CATEGORIES.some((category) => category.id === categoryId);

const getFallbackCategory = (skillName) => {
  const value = normalizeName(skillName);
  if (!value) return 'programming';
  if (value.includes('aws') || value.includes('azure') || value.includes('cloud')) return 'cloud_infrastructure';
  if (value.includes('lead') || value.includes('mentor') || value.includes('management')) return 'leadership_management';
  if (value.includes('data') || value.includes('sql') || value.includes('python') || value.includes('analytics')) return 'data_analytics';
  if (value.includes('client') || value.includes('stakeholder') || value.includes('consult')) return 'consulting_excellence';
  if (value.includes('security') || value.includes('owasp') || value.includes('risk')) return 'security';
  if (value.includes('business') || value.includes('agile') || value.includes('finance')) return 'business_acumen';
  return 'programming';
};

export function useSkills() {
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const mergeRecommendations = (recommendations) => {
    const existingNames = new Set(skills.map((skill) => normalizeName(skill.name)));

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
          progress: { current: 0, total: 4, unit: 'modules' },
          notes: rec.source ? `Source: ${rec.source}` : undefined,
          relatedRoles: rec.related_roles || [],
          priority: rec.priority,
        };
      })
      .filter((rec) => !existingNames.has(normalizeName(rec.name)));

    if (normalizedRecommendations.length > 0) {
      setSkills((prev) => [...prev, ...normalizedRecommendations]);
    }
  };

  const refreshRecommendations = async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = force ? { refresh: true } : undefined;
      const response = await api.get('/skills/recommendations', { params });
      const recommendations = response?.data?.recommendations || [];
      if (recommendations.length > 0) {
        mergeRecommendations(recommendations);
      }
    } catch (err) {
      setError(err);
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

  useEffect(() => {
    refreshRecommendations(false);
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
    refreshRecommendations,
    updateRecommendationStatus,
  };
}

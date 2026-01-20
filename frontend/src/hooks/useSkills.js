// Custom hook for skills state management
// Centralizes skills data and operations

import { useState, useMemo } from 'react';
import { MOCK_SKILLS } from '../mocks/mockSkills';

export function useSkills() {
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  return {
    skills,
    setSkills,
    selectedSkill,
    setSelectedSkill,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    addSkill,
    updateSkill,
    addSkills,
  };
}

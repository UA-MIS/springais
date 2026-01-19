import type { Node, Edge } from 'reactflow'
import { MarkerType } from 'reactflow'

export type SkillNodeData = {
  label: string
  kind: 'role' | 'path' | 'skill'
  emphasis?: 'goal'
}

export type SkillTree = {
  nodes: Array<Node<SkillNodeData>>
  edges: Array<Edge>
}

function e(source: string, target: string): Edge {
  return {
    id: `${source}__${target}`,
    source,
    target,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    style: { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 3 },
  }
}

function eAccent(source: string, target: string): Edge {
  return {
    ...e(source, target),
    style: { stroke: 'rgba(255,230,0,0.70)', strokeWidth: 3.5 },
  }
}

/**
 * Mock “routes to become X” trees.
 * Shape is already React Flow compatible; we layout with Dagre in the component.
 */
export const mockRoleSkillTrees: Record<string, SkillTree> = {
  'senior-analyst': {
    nodes: [
      { id: 'role', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Senior Analyst', kind: 'role', emphasis: 'goal' } },

      { id: 'tech', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Technical', kind: 'path' } },
      { id: 'lead', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Leadership', kind: 'path' } },
      { id: 'ment', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Mentoring', kind: 'path' } },

      { id: 'tech-1', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Advanced Excel / Sheets', kind: 'skill' } },
      { id: 'tech-2', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'SQL (joins, windows)', kind: 'skill' } },
      { id: 'tech-3', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Analysis story + viz', kind: 'skill' } },
      { id: 'tech-4', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Domain playbooks', kind: 'skill' } },

      { id: 'lead-1', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Own small workstream', kind: 'skill' } },
      { id: 'lead-2', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Stakeholder updates', kind: 'skill' } },
      { id: 'lead-3', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Risk/issue management', kind: 'skill' } },

      { id: 'ment-1', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Review + feedback loops', kind: 'skill' } },
      { id: 'ment-2', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Onboarding playbook', kind: 'skill' } },
      { id: 'ment-3', type: 'skillNode', position: { x: 0, y: 0 }, data: { label: 'Coach on delivery', kind: 'skill' } },
    ],
    edges: [
      eAccent('role', 'tech'),
      eAccent('role', 'lead'),
      eAccent('role', 'ment'),

      e('tech', 'tech-1'),
      e('tech', 'tech-2'),
      e('tech', 'tech-3'),
      e('tech', 'tech-4'),

      e('lead', 'lead-1'),
      e('lead', 'lead-2'),
      e('lead', 'lead-3'),

      e('ment', 'ment-1'),
      e('ment', 'ment-2'),
      e('ment', 'ment-3'),
    ],
  },
}


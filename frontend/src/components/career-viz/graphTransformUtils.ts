import type { Edge, Node } from 'reactflow'
import { MarkerType } from 'reactflow'
import type { CareerGraphData, CareerTransition } from '@/data/mockCareerGraphData'
import { layoutGraph } from './graphLayoutUtils'

export type RoleNodeData = {
  label: string
  department: string
  employeeCount: number
  avgYearsInRole?: number
  isCurrentRole: boolean
  isPossibleNext: boolean
  isSelected?: boolean
  isGoal?: boolean
}

export type TransitionEdgeData = {
  successRate: number
  avgTimeYears: number
  sampleSize: number
  commonSkills: string[]
  isHighlighted?: boolean
  isDimmed?: boolean
}

export function transformCareerGraphToReactFlow(
  graph: CareerGraphData,
  employeeCurrentRoleIdOverride?: string,
): {
  nodes: Array<Node<RoleNodeData>>
  edges: Array<Edge<TransitionEdgeData>>
  transitionsBySource: Map<string, CareerTransition[]>
} {
  const employeeCurrentRoleId = employeeCurrentRoleIdOverride ?? graph.employeeCurrentRole

  const edges: Array<Edge<TransitionEdgeData>> = graph.transitions.map((t) => ({
    id: `${t.source}__${t.target}`,
    source: t.source,
    target: t.target,
    type: 'transitionEdge',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
    },
    data: {
      successRate: t.successRate,
      avgTimeYears: t.avgTimeYears,
      sampleSize: t.sampleSize,
      commonSkills: t.commonSkills,
    },
  }))

  const possibleNextRoleIds = new Set(
    edges.filter((e) => e.source === employeeCurrentRoleId).map((e) => e.target),
  )

  const nodes: Array<Node<RoleNodeData>> = graph.roles.map((role) => ({
    id: role.id,
    type: 'roleNode',
    position: { x: 0, y: 0 },
    data: {
      label: role.label,
      department: role.department,
      employeeCount: role.employeeCount,
      avgYearsInRole: role.avgYearsInRole,
      isCurrentRole: role.id === employeeCurrentRoleId,
      isPossibleNext: possibleNextRoleIds.has(role.id),
    },
  }))

  const transitionsBySource = new Map<string, CareerTransition[]>()
  for (const t of graph.transitions) {
    const list = transitionsBySource.get(t.source) ?? []
    list.push(t)
    transitionsBySource.set(t.source, list)
  }

  const layoutedNodes = layoutGraph(nodes, edges, { direction: 'TB' })
  return { nodes: layoutedNodes, edges, transitionsBySource }
}


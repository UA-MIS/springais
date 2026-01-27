import { useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import type { Edge, Node } from 'reactflow'

import type { CareerGraphData, CareerTransition } from '@/data/mockCareerGraphData'
import { fetchCareerGraph } from '@/services/patternService'
import { GraphControls } from './GraphControls'
import type { GraphControlsState } from './GraphControls'
import { RoleNode } from './RoleNode'
import { TransitionEdge } from './TransitionEdge'
import { transformCareerGraphToReactFlow } from './graphTransformUtils'
import type { RoleNodeData, TransitionEdgeData } from './graphTransformUtils'
import { useNavigate } from 'react-router-dom'
import { useTheme, themeColors } from '../../context/ThemeContext'

const nodeTypes = { roleNode: RoleNode }
const edgeTypes = { transitionEdge: TransitionEdge }

type Props = {
  employeeCurrentRoleId?: string
}

function buildDepartments(graph: CareerGraphData) {
  return Array.from(new Set(graph.roles.map((r) => r.department))).sort()
}

function computeSearchVisibleRoleIds(
  graph: CareerGraphData,
  query: string,
  baseRoleIds: Set<string>,
): Set<string> {
  const q = query.trim().toLowerCase()
  if (!q) return new Set(baseRoleIds)

  const seed = new Set<string>()
  for (const r of graph.roles) {
    if (r.label.toLowerCase().includes(q)) seed.add(r.id)
  }

  // Expand by 1 hop (neighbors) to keep the “tree” navigable.
  const out = new Set(seed)
  for (const t of graph.transitions) {
    if (seed.has(t.source) || seed.has(t.target)) {
      out.add(t.source)
      out.add(t.target)
    }
  }

  // If nothing matched, return empty (so the UI clearly says “nothing”).
  if (out.size === 0) return new Set()

  // Ensure we never return ids outside the base department filter.
  return new Set(Array.from(out).filter((id) => baseRoleIds.has(id)))
}

export function CareerVisualization({ employeeCurrentRoleId }: Props) {
  const navigate = useNavigate()
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]

  const [graph, setGraph] = useState<CareerGraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [goalRoleId, setGoalRoleId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<GraphControlsState>({
    search: '',
    department: 'all',
    minSuccessRate: 0,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchCareerGraph({ employeeCurrentRoleId })
        if (cancelled) return
        setGraph(data)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load graph')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [employeeCurrentRoleId])

  const departments = useMemo(() => (graph ? buildDepartments(graph) : []), [graph])

  const base = useMemo(() => {
    if (!graph) {
      return {
        baseNodes: [] as Array<Node<RoleNodeData>>,
        baseEdges: [] as Array<Edge<TransitionEdgeData>>,
        transitionsBySource: new Map<string, CareerTransition[]>(),
      }
    }

    const { nodes, edges, transitionsBySource } = transformCareerGraphToReactFlow(graph, employeeCurrentRoleId)
    return { baseNodes: nodes, baseEdges: edges, transitionsBySource }
  }, [graph, employeeCurrentRoleId])

  const currentRoleId = employeeCurrentRoleId ?? graph?.employeeCurrentRole ?? null

  function computeReachableFromCurrent(g: CareerGraphData, rootId: string): Set<string> {
    const reachable = new Set<string>()
    const q: string[] = [rootId]
    reachable.add(rootId)
    while (q.length) {
      const cur = q.shift()!
      for (const t of g.transitions) {
        if (t.source !== cur) continue
        if (!reachable.has(t.target)) {
          reachable.add(t.target)
          q.push(t.target)
        }
      }
    }
    return reachable
  }

  function computeShortestPathEdges(g: CareerGraphData, rootId: string, targetId: string): Set<string> {
    // BFS parent pointers over transitions
    const parent = new Map<string, string>() // node -> parent node
    const edgeParent = new Map<string, string>() // node -> edgeId
    const q: string[] = [rootId]
    const seen = new Set<string>([rootId])

    while (q.length) {
      const cur = q.shift()!
      if (cur === targetId) break
      for (const t of g.transitions) {
        if (t.source !== cur) continue
        if (seen.has(t.target)) continue
        seen.add(t.target)
        parent.set(t.target, cur)
        edgeParent.set(t.target, `${t.source}__${t.target}`)
        q.push(t.target)
      }
    }

    const pathEdges = new Set<string>()
    if (!seen.has(targetId)) return pathEdges
    let cur: string | undefined = targetId
    while (cur && cur !== rootId) {
      const eId = edgeParent.get(cur)
      if (eId) pathEdges.add(eId)
      cur = parent.get(cur)
    }
    return pathEdges
  }

  const filtered = useMemo(() => {
    const baseNodes = base.baseNodes
    const baseEdges = base.baseEdges
    const transitionsBySource = base.transitionsBySource

    if (!graph) {
      return {
        nodes: [] as Array<Node<RoleNodeData>>,
        edges: [] as Array<Edge<TransitionEdgeData>>,
        selectedNode: null as Node<RoleNodeData> | null,
        outgoingTransitions: [] as CareerTransition[],
      }
    }

    const rootId = currentRoleId ?? graph.employeeCurrentRole
    const reachable = computeReachableFromCurrent(graph, rootId)

    // Department filter is applied inside the reachable subgraph.
    const allowedByDepartment = new Set(
      baseNodes
        .filter((n) => reachable.has(n.id))
        .filter((n) => (filters.department === 'all' ? true : n.data.department === filters.department))
        .map((n) => n.id),
    )

    const visibleRoleIds = computeSearchVisibleRoleIds(graph, filters.search, allowedByDepartment)

    const selectedNode = selectedRoleId ? baseNodes.find((n) => n.id === selectedRoleId) ?? null : null
    const outgoingTransitions = selectedRoleId ? transitionsBySource.get(selectedRoleId) ?? [] : []

    const goalId = goalRoleId
    const pathEdges = goalId && rootId ? computeShortestPathEdges(graph, rootId, goalId) : new Set<string>()

    const edges = baseEdges.map((e) => {
      const meetsSuccess = (e.data?.successRate ?? 0) >= filters.minSuccessRate
      const visible =
        visibleRoleIds.has(e.source) && visibleRoleIds.has(e.target) && meetsSuccess && reachable.has(e.source) && reachable.has(e.target)

      const isOnGoalPath = pathEdges.has(e.id)

      return {
        ...e,
        hidden: !visible,
        data: {
          ...e.data,
          isHighlighted: isOnGoalPath,
          isDimmed: goalId ? !isOnGoalPath : false,
        },
      }
    })

    const nodes = baseNodes.map((n) => ({
      ...n,
      hidden: !visibleRoleIds.has(n.id) || !reachable.has(n.id),
      data: {
        ...n.data,
        isSelected: selectedRoleId ? n.id === selectedRoleId : false,
        // goal is “working towards”; persists even if panel closes
        isPossibleNext: n.data.isPossibleNext, // keep
        isGoal: goalId ? n.id === goalId : false,
      },
    }))

    return { nodes, edges, selectedNode, outgoingTransitions }
  }, [base, filters, graph, selectedRoleId, goalRoleId, currentRoleId])

  function resetFilters() {
    setFilters({ search: '', department: 'all', minSuccessRate: 0 })
  }

  const containerStyle = {
    backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
    border: `1px solid ${colors.cardBorder}`,
  }

  if (loading) {
    return (
      <div
        className="flex h-[720px] w-full items-center justify-center rounded-xl"
        style={containerStyle}
      >
        <div className="text-sm font-semibold" style={{ color: colors.textMuted }}>Loading career paths…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex h-[720px] w-full items-center justify-center rounded-xl"
        style={containerStyle}
      >
        <div className="max-w-lg p-6 text-center">
          <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Failed to load graph</div>
          <div className="mt-2 text-sm" style={{ color: colors.textMuted }}>{error}</div>
          <button
            type="button"
            onClick={() => {
              setGraph(null)
              setSelectedRoleId(null)
              setLoading(true)
              setError(null)
              window.location.reload()
            }}
            className="mt-4 rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
              color: colors.textPrimary,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!graph || graph.roles.length === 0) {
    return (
      <div
        className="flex h-[720px] w-full items-center justify-center rounded-xl"
        style={containerStyle}
      >
        <div className="text-sm font-semibold" style={{ color: colors.textMuted }}>No career path data.</div>
      </div>
    )
  }

  return (
    <div
      className="relative h-[720px] w-full overflow-hidden rounded-xl"
      style={{
        backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <GraphControls
        state={filters}
        departments={departments}
        onChange={setFilters}
        onReset={resetFilters}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
      />

      <ReactFlow
        nodes={filtered.nodes}
        edges={filtered.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node: Node<RoleNodeData>) => {
          setGoalRoleId(node.id)
          navigate(`/career-paths/${node.id}`)
        }}
        onPaneClick={() => setSelectedRoleId(null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background color={(isDark || isGame) ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} gap={18} size={1} />
      </ReactFlow>
    </div>
  )
}


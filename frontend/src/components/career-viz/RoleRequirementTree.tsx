import { useMemo, useState, useEffect } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import type { Edge, Node } from 'reactflow'

import { SkillNode, SkillNodeData } from './SkillNode'
import { useTheme, themeColors } from '../../context/ThemeContext'
import api from '../../services/api'

const nodeTypes = { skillNode: SkillNode }

type Props = {
  roleId: string  // This is now the job_id from the match
  jobId?: string  // Explicit job ID if available
}

// Radial layout: places nodes in concentric circles around the root
function radialLayout(
  nodes: Array<Node<SkillNodeData>>,
  edges: Array<Edge>,
  centerX: number,
  centerY: number
): Array<Node<SkillNodeData>> {
  // Build adjacency from edges (parent -> children)
  const children = new Map<string, string[]>()
  for (const edge of edges) {
    if (!children.has(edge.source)) children.set(edge.source, [])
    children.get(edge.source)!.push(edge.target)
  }

  // Find root (node with no incoming edges)
  const hasParent = new Set(edges.map((e) => e.target))
  const root = nodes.find((n) => !hasParent.has(n.id))
  if (!root) return nodes

  const positioned = new Map<string, { x: number; y: number }>()

  // BFS to get levels
  const levels: string[][] = []
  const visited = new Set<string>()
  let queue = [root.id]
  visited.add(root.id)

  while (queue.length > 0) {
    levels.push([...queue])
    const nextQueue: string[] = []
    for (const nodeId of queue) {
      const nodeChildren = children.get(nodeId) || []
      for (const childId of nodeChildren) {
        if (!visited.has(childId)) {
          visited.add(childId)
          nextQueue.push(childId)
        }
      }
    }
    queue = nextQueue
  }

  // Position nodes in concentric circles
  const nodeWidth = 160
  const nodeHeight = 50
  const levelRadius = [0, 140, 300] // Distance from center for each level

  for (let level = 0; level < levels.length; level++) {
    const nodesAtLevel = levels[level]
    const radius = levelRadius[Math.min(level, levelRadius.length - 1)]

    if (level === 0) {
      // Root at center
      positioned.set(nodesAtLevel[0], { x: centerX - nodeWidth / 2, y: centerY - nodeHeight / 2 })
    } else {
      // Distribute around the circle
      const angleStep = (2 * Math.PI) / nodesAtLevel.length
      const startAngle = -Math.PI / 2 // Start from top

      nodesAtLevel.forEach((nodeId, index) => {
        const angle = startAngle + index * angleStep
        const x = centerX + radius * Math.cos(angle) - nodeWidth / 2
        const y = centerY + radius * Math.sin(angle) - nodeHeight / 2
        positioned.set(nodeId, { x, y })
      })
    }
  }

  return nodes.map((n) => ({
    ...n,
    position: positioned.get(n.id) || n.position,
  }))
}

export function RoleRequirementTree({ roleId, jobId }: Props) {
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]
  const [treeData, setTreeData] = useState<{ nodes: Node<SkillNodeData>[]; edges: Edge[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planGenerated, setPlanGenerated] = useState(false)

  // The effective job ID to use
  const effectiveJobId = jobId || roleId

  const generatePlan = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post(`/skills/plan/${effectiveJobId}`)
      const data = response.data

      // Convert API response to React Flow format
      const nodes: Node<SkillNodeData>[] = data.nodes.map((n: any) => ({
        id: n.id,
        type: 'skillNode',
        position: n.position || { x: 0, y: 0 },
        data: n.data,
      }))

      const edges: Edge[] = data.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        markerEnd: e.markerEnd || { type: 'arrowclosed', width: 16, height: 16 },
        style: e.style || { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 3 },
      }))

      setTreeData({ nodes, edges })
      setPlanGenerated(true)
    } catch (err: any) {
      console.error('Failed to generate skill plan:', err)
      setError(err.response?.data?.detail || 'Failed to generate skill plan')
    } finally {
      setLoading(false)
    }
  }

  const { nodes, edges } = useMemo(() => {
    if (!treeData) return { nodes: [] as Array<Node<SkillNodeData>>, edges: [] as Array<Edge> }

    // Use radial layout centered in the container
    const layoutedNodes = radialLayout(treeData.nodes, treeData.edges, 400, 300)

    // Apply theme-aware edge styles
    const themedEdges = treeData.edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        stroke: edge.style?.stroke?.includes('255,230,0') || edge.style?.stroke?.includes('34, 197, 94')
          ? edge.style.stroke // Keep accent colors (yellow for paths, green for skills user has)
          : (isDark || isGame) ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)',
      },
      markerEnd: {
        ...edge.markerEnd,
        color: edge.style?.stroke?.includes('255,230,0')
          ? 'rgba(255,230,0,0.70)'
          : (isDark || isGame) ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)',
      },
    }))

    return { nodes: layoutedNodes, edges: themedEdges }
  }, [treeData, isDark])

  // Show generate button if plan not yet generated
  if (!planGenerated) {
    return (
      <div
        className="mt-4 rounded-lg p-8 text-center"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <p className="mb-4" style={{ color: colors.textMuted }}>
          Generate a personalized skill development plan based on your current skills and this role's requirements.
        </p>
        <button
          onClick={generatePlan}
          disabled={loading}
          className="px-6 py-3 rounded-md font-semibold transition-colors"
          style={{
            backgroundColor: loading ? colors.textMuted : colors.accent,
            color: '#2E2E38',
          }}
        >
          {loading ? 'Generating Plan...' : 'Generate Skill Plan'}
        </button>
        {error && (
          <p className="mt-4 text-red-500">{error}</p>
        )}
      </div>
    )
  }

  if (!treeData || nodes.length === 0) {
    return (
      <div
        className="mt-4 rounded-lg p-4 text-sm"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          color: colors.textMuted,
        }}
      >
        No skills found for this role. The job posting may not have skill requirements defined.
      </div>
    )
  }

  return (
    <div
      className="h-full overflow-hidden rounded-xl"
      style={{
        backgroundColor: (isDark || isGame) ? 'rgba(0, 0, 0, 0.2)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        zoomOnDoubleClick={false}
        style={{ background: (isDark || isGame) ? 'rgba(0, 0, 0, 0.2)' : colors.cardBg }}
      >
        <Controls />
        <Background color={(isDark || isGame) ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'} gap={22} size={1} />
      </ReactFlow>
    </div>
  )
}


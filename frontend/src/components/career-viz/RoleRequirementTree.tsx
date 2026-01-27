import { useMemo, useState, useEffect, useCallback } from 'react'
import ReactFlow, { Background, Controls, Position } from 'reactflow'
import type { Edge, Node, NodeChange } from 'reactflow'

import { SkillNode, SkillNodeData } from './SkillNode'
import { SkillPlanEdge } from './SkillPlanEdge'
import { useTheme, themeColors } from '../../context/ThemeContext'
import api from '../../services/api'

const nodeTypes = { skillNode: SkillNode }
const edgeTypes = { skillPlanEdge: SkillPlanEdge }

type Props = {
  roleId: string  // This is now the job_id from the match
  jobId?: string  // Explicit job ID if available
  onPlanGenerated?: (summary: any) => void  // Callback with plan summary
  onNodesReceived?: (nodes: Node<SkillNodeData>[], edges: Edge[]) => void  // Callback with nodes and edges for path extraction
  onNodeClick?: (nodeId: string, nodeData: SkillNodeData) => void  // Callback for node clicks
  selectedPath?: string | null  // Filter by path/category
  isCustomizing?: boolean
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

  // Position nodes in concentric circles with better spacing
  const nodeWidth = 160
  const nodeHeight = 50
  const levelRadius = [0, 180, 350, 500] // Distance from center for each level - increased spacing

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

export function RoleRequirementTree({ roleId, jobId, onPlanGenerated, onNodesReceived, onNodeClick, selectedPath, isCustomizing }: Props) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light
  const [treeData, setTreeData] = useState<{ nodes: Node<SkillNodeData>[]; edges: Edge[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planGenerated, setPlanGenerated] = useState(false)
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({})

  // The effective job ID to use
  const effectiveJobId = jobId || roleId
  const layoutStorageKey = `springais-skill-plan-layout:${effectiveJobId}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(layoutStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as Record<string, { x: number; y: number }>
      setCustomPositions(parsed)
    } catch {
      // Ignore malformed stored layouts
    }
  }, [layoutStorageKey])

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
        type: 'skillPlanEdge',
        markerEnd: e.markerEnd || { type: 'arrowclosed', width: 14, height: 14 },
        style: e.style || { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 2 },
      }))

      setTreeData({ nodes, edges })
      setPlanGenerated(true)
      
      // Notify parent of plan generation with summary
      if (onPlanGenerated && data.summary) {
        onPlanGenerated(data.summary)
      }
      
      // Notify parent of nodes and edges for path extraction
      if (onNodesReceived) {
        onNodesReceived(nodes, edges)
      }
    } catch (err: any) {
      console.error('Failed to generate skill plan:', err)
      setError(err.response?.data?.detail || 'Failed to generate skill plan')
    } finally {
      setLoading(false)
    }
  }

  const { nodes, edges } = useMemo(() => {
    if (!treeData) return { nodes: [] as Array<Node<SkillNodeData>>, edges: [] as Array<Edge> }

    // Filter nodes/edges by selected path if provided
    let filteredNodes = treeData.nodes
    let filteredEdges = treeData.edges

    if (selectedPath) {
      // Filter to show only nodes connected to the selected path category
      const pathNodeId = filteredNodes.find(n => n.data.kind === 'path' && n.data.label === selectedPath)?.id
      if (pathNodeId) {
        const connectedNodeIds = new Set<string>([pathNodeId])
        // Add all skills connected to this path
        filteredEdges.forEach(edge => {
          if (edge.source === pathNodeId || connectedNodeIds.has(edge.source)) {
            connectedNodeIds.add(edge.target)
          }
        })
        // Include the role node
        const roleNode = filteredNodes.find(n => n.data.kind === 'role')
        if (roleNode) connectedNodeIds.add(roleNode.id)
        
        filteredNodes = filteredNodes.filter(n => connectedNodeIds.has(n.id))
        filteredEdges = filteredEdges.filter(e => connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target))
      }
    }

    // Use radial layout centered in the container - adjust center for better view
    const centerX = 500
    const centerY = 400
    const bundleStrength = 0.55
    const layoutedNodes = radialLayout(filteredNodes, filteredEdges, centerX, centerY).map((node) => {
      const override = customPositions[node.id]
      if (!override) return node
      return {
        ...node,
        position: override,
      }
    })
    const rootNodeId = layoutedNodes.find((n) => n.data.kind === 'role')?.id ?? 'role'

    const nodeSizeForKind = (kind?: SkillNodeData['kind']) => {
      if (kind === 'role') return { width: 100, height: 100 }
      if (kind === 'path') return { width: 90, height: 90 }
      return { width: 50, height: 50 }
    }

    const getNodeRadius = (nodeId: string) => {
      const node = layoutedNodes.find((n) => n.id === nodeId)
      if (!node) return 20
      const { width } = nodeSizeForKind(node.data.kind)
      return width / 2
    }

    const getNodeCenter = (nodeId: string) => {
      const node = layoutedNodes.find((n) => n.id === nodeId)
      if (!node) return { x: 0, y: 0 }
      const { width, height } = nodeSizeForKind(node.data.kind)
      return {
        x: node.position.x + width / 2,
        y: node.position.y + height / 2,
      }
    }

    const getClosestPosition = (fromId: string, toId: string) => {
      const from = getNodeCenter(fromId)
      const to = getNodeCenter(toId)
      const dx = to.x - from.x
      const dy = to.y - from.y
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? Position.Right : Position.Left
      }
      return dy > 0 ? Position.Bottom : Position.Top
    }

    // Apply theme-aware edge styles with better opacity and stroke width
    const themedEdges = filteredEdges.map((edge) => {
      const isAccent = edge.style?.stroke?.includes('255,230,0') || edge.style?.stroke?.includes('34, 197, 94')
      const isYellow = edge.style?.stroke?.includes('255,230,0')
      const isGreen = edge.style?.stroke?.includes('34, 197, 94')
      const isBackground = !isAccent
      const bundleGroup = edge.source || 'role'
      const sourceNode = layoutedNodes.find((n) => n.id === edge.source)
      const targetNode = layoutedNodes.find((n) => n.id === edge.target)
      const isRootEdge = edge.source === rootNodeId
      const isSkillEdge = sourceNode?.data.kind === 'skill' || targetNode?.data.kind === 'skill'
      const isPathEdge = sourceNode?.data.kind === 'path' || targetNode?.data.kind === 'path'
      const isDirectEdge = isRootEdge || isPathEdge
      const sourcePosition = getClosestPosition(edge.source, edge.target)
      const targetPosition = getClosestPosition(edge.target, edge.source)
      const sourceCenter = getNodeCenter(edge.source)
      const targetCenter = getNodeCenter(edge.target)
      const sourceRadius = getNodeRadius(edge.source)
      const targetRadius = getNodeRadius(edge.target)

      const dx = targetCenter.x - sourceCenter.x
      const dy = targetCenter.y - sourceCenter.y
      const dist = Math.hypot(dx, dy) || 1
      const ux = dx / dist
      const uy = dy / dist

      const customSource = {
        x: sourceCenter.x + ux * sourceRadius,
        y: sourceCenter.y + uy * sourceRadius,
      }
      const customTarget = {
        x: targetCenter.x - ux * targetRadius,
        y: targetCenter.y - uy * targetRadius,
      }
      
      const rootCenter = getNodeCenter(rootNodeId)

      return {
        ...edge,
        sourcePosition,
        targetPosition,
        data: {
          ...edge.data,
          bundle: isBackground && !isDirectEdge,
          bundleGroup,
          bundleHub: rootCenter,
          bundleStrength,
          isRootEdge,
          isDirectEdge,
          customSource: isDirectEdge || isSkillEdge ? customSource : undefined,
          customTarget: isDirectEdge || isSkillEdge ? customTarget : undefined,
        },
        style: {
          ...edge.style,
          stroke: isAccent
            ? edge.style.stroke // Keep accent colors (yellow for paths, green for skills user has)
            : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
          strokeWidth: isAccent ? 2.5 : 1.75,
          opacity: selectedPath 
            ? (isYellow ? 1 : (isGreen ? 0.6 : 0.2))
            : (isAccent ? 1 : 0.45),
        },
        markerEnd: isBackground
          ? undefined
          : {
              ...edge.markerEnd,
              color: isYellow
                ? 'rgba(255,230,0,0.80)'
                : isGreen
                  ? 'rgba(34, 197, 94, 0.80)'
                  : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
            },
      }
    })

    const themedNodes = layoutedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isCustomizing: isCustomizing ?? false,
      },
    }))

    return { nodes: themedNodes, edges: themedEdges }
  }, [treeData, isDark, selectedPath, isCustomizing, customPositions])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!isCustomizing) return
      setCustomPositions((prev) => {
        const next = { ...prev }
        for (const change of changes) {
          if (change.type === 'position' && change.position) {
            next[change.id] = change.position
          }
        }
        try {
          localStorage.setItem(layoutStorageKey, JSON.stringify(next))
        } catch {
          // Ignore storage failures (quota or disabled)
        }
        return next
      })
    },
    [isCustomizing, layoutStorageKey],
  )

  // Show generate button if plan not yet generated
  if (!planGenerated) {
    return (
      <div
        className="mt-4 rounded-lg p-8 text-center"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
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
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
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
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : colors.cardBg,
        border: 'none',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => {
          if (onNodeClick) {
            onNodeClick(node.id, node.data)
          }
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={isCustomizing === true}
        nodesConnectable={false}
        elementsSelectable
        zoomOnDoubleClick={false}
        onNodesChange={handleNodesChange}
        style={{ background: 'transparent' }}
        defaultEdgeOptions={{
          type: 'skillPlanEdge',
        }}
      >
        <Controls />
        <Background 
          color={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} 
          gap={18} 
          size={1} 
        />
      </ReactFlow>
    </div>
  )
}


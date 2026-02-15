import React, { useMemo, useState, useEffect, useCallback } from 'react'
import ReactFlow, { Background, Controls, Position } from 'reactflow'
import type { Edge, Node, NodeChange } from 'reactflow'

import { SkillNode } from './SkillNode'
import type { SkillNodeData } from './SkillNode'
import { SkillPlanEdge } from './SkillPlanEdge'
import api from '../../services/api'
import { useTheme, themeColors } from '../../context/ThemeContext'

const nodeTypes = { skillNode: SkillNode }
const edgeTypes = { skillPlanEdge: SkillPlanEdge }

// Category color mapping for edges
const CATEGORY_EDGE_COLORS: Record<string, string> = {
  Technical: '#06b6d4',
  Leadership: '#eab308',
  Domain: '#c026d3',
  Tools: '#22c55e',
}

type Props = {
  roleId: string
  jobId?: string
  onPlanGenerated?: (summary: any) => void
  onNodesReceived?: (nodes: Node<SkillNodeData>[], edges: Edge[]) => void
  onNodeClick?: (nodeId: string, nodeData: SkillNodeData) => void
  selectedPath?: string | null
  isCustomizing?: boolean
  matchedSkills?: string[]
  transferableSkills?: string[]
}

// Normalize skill name for comparison
function normalizeSkill(s: string): string {
  return s.toLowerCase().trim()
}

// Parse transferable skill name, stripping the "(via ...)" suffix
// Backend returns strings like "Project Management (via Project Management Life Cycle (PMLC))"
function parseTransferableSkillName(s: string): string {
  const viaIndex = s.indexOf(' (via ')
  return viaIndex >= 0 ? s.substring(0, viaIndex) : s
}

// Polygon forking-tree layout: category hubs at polygon vertices, skills fan outward
function radialLayout(
  nodes: Array<Node<SkillNodeData>>,
  edges: Array<Edge>,
  centerX: number,
  centerY: number
): Array<Node<SkillNodeData>> {
  const children = new Map<string, string[]>()
  for (const edge of edges) {
    if (!children.has(edge.source)) children.set(edge.source, [])
    children.get(edge.source)!.push(edge.target)
  }

  const hasParent = new Set(edges.map((e) => e.target))
  const root = nodes.find((n) => !hasParent.has(n.id))
  if (!root) return nodes

  const positioned = new Map<string, { x: number; y: number }>()

  const nodeMap = new Map<string, Node<SkillNodeData>>()
  for (const n of nodes) {
    nodeMap.set(n.id, n)
  }

  const nodeWidth = 80
  const nodeHeight = 80

  // Place root (YOU) at center
  positioned.set(root.id, { x: centerX - nodeWidth / 2, y: centerY - nodeHeight / 2 })

  // Place target node slightly above center if present
  const targetNode = nodes.find((n) => n.data.kind === 'target')
  if (targetNode) {
    positioned.set(targetNode.id, { x: centerX - nodeWidth / 2, y: centerY - 60 - nodeHeight / 2 })
  }

  // Identify category hubs (level 1 children of root)
  const categoryHubIds = children.get(root.id) || []
  // Filter out target node from category hubs
  const hubs = categoryHubIds.filter((id) => {
    const n = nodeMap.get(id)
    return n && n.data.kind !== 'target'
  })

  const N = hubs.length
  if (N === 0) {
    return nodes.map((n) => ({
      ...n,
      position: positioned.get(n.id) || n.position,
    }))
  }

  // Polygon parameters
  const hubRadius = 450
  const startAngle = -Math.PI / 2 // first hub at top
  const angleStep = (2 * Math.PI) / N
  const rowSpacing = 120
  const nodeSpacing = 90

  // Collect all skill descendants for each hub (BFS from hub, excluding root)
  function collectDescendants(hubId: string): string[] {
    const result: string[] = []
    const queue = [hubId]
    const visited = new Set<string>([hubId])
    while (queue.length > 0) {
      const current = queue.shift()!
      const kids = children.get(current) || []
      for (const kid of kids) {
        if (!visited.has(kid)) {
          visited.add(kid)
          result.push(kid)
          queue.push(kid)
        }
      }
    }
    return result
  }

  hubs.forEach((hubId, index) => {
    const angle = startAngle + index * angleStep
    const hx = centerX + hubRadius * Math.cos(angle)
    const hy = centerY + hubRadius * Math.sin(angle)

    // Position the hub
    positioned.set(hubId, { x: hx - nodeWidth / 2, y: hy - nodeHeight / 2 })

    // Outward unit vector (from center to hub)
    const dist = Math.hypot(hx - centerX, hy - centerY) || 1
    const outX = (hx - centerX) / dist
    const outY = (hy - centerY) / dist

    // Perpendicular vector (90-degree rotation for side-to-side spread)
    const perpX = -outY
    const perpY = outX

    // Gather all skill descendants of this hub
    const skills = collectDescendants(hubId)
    if (skills.length === 0) return

    // Arrange skills into expanding rows: row k has (k + 2) nodes capacity
    const rows: string[][] = []
    let remaining = [...skills]
    let rowIndex = 0
    while (remaining.length > 0) {
      const rowCapacity = rowIndex + 2
      const rowNodes = remaining.splice(0, rowCapacity)
      rows.push(rowNodes)
      rowIndex++
    }

    // Position each row
    rows.forEach((rowNodes, k) => {
      const M = rowNodes.length
      // Base position: hub + (k+1) * rowSpacing along outward direction
      const baseX = hx + (k + 1) * rowSpacing * outX
      const baseY = hy + (k + 1) * rowSpacing * outY

      rowNodes.forEach((nodeId, j) => {
        // Offset along perpendicular to spread nodes in the row
        const offset = (j - (M - 1) / 2) * nodeSpacing
        const x = baseX + offset * perpX
        const y = baseY + offset * perpY
        positioned.set(nodeId, { x: x - nodeWidth / 2, y: y - nodeHeight / 2 })
      })
    })
  })

  return nodes.map((n) => ({
    ...n,
    position: positioned.get(n.id) || n.position,
  }))
}

export function RoleRequirementTree({ roleId, jobId, onPlanGenerated, onNodesReceived, onNodeClick, selectedPath, isCustomizing, matchedSkills, transferableSkills }: Props) {
  const { theme, isDark } = useTheme()
  const colors = themeColors[theme]
  const [treeData, setTreeData] = useState<{ nodes: Node<SkillNodeData>[]; edges: Edge[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planGenerated, setPlanGenerated] = useState(false)
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({})

  const effectiveJobId = jobId || roleId
  const layoutStorageKey = `springais-skill-plan-layout-v2:${effectiveJobId}`

  // Build match sets for cross-referencing (Issue 4)
  const matchedSet = useMemo(() => new Set((matchedSkills || []).map(normalizeSkill)), [matchedSkills])
  const transferableSet = useMemo(() => new Set((transferableSkills || []).map(s => normalizeSkill(parseTransferableSkillName(s)))), [transferableSkills])

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

      const nodes: Node<SkillNodeData>[] = data.nodes.map((n: any) => {
        const nodeData: SkillNodeData = {
          ...n.data,
          category: n.data.category || (n.data.kind === 'path' ? n.data.label : undefined),
        }
        // Cross-reference with match data (Issue 4)
        if (nodeData.kind === 'skill') {
          const label = normalizeSkill(nodeData.label)
          if (matchedSet.has(label)) {
            nodeData.has = true
          } else if (transferableSet.has(label)) {
            nodeData.has = true
            nodeData.transferable = true
          }
        }
        return {
          id: n.id,
          type: 'skillNode',
          position: n.position || { x: 0, y: 0 },
          data: nodeData,
        }
      })

      const edges: Edge[] = data.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'skillPlanEdge',
        markerEnd: e.markerEnd || { type: 'arrowclosed', width: 14, height: 14 },
        style: e.style || { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 2 },
      }))

      // Infer category from parent edges for skill nodes missing category
      const categoryFromEdge = new Map<string, string>()
      for (const edge of edges) {
        const sourceNode = nodes.find(n => n.id === edge.source)
        if (sourceNode && sourceNode.data.kind === 'path') {
          categoryFromEdge.set(edge.target, sourceNode.data.label)
        }
      }
      for (const node of nodes) {
        if (node.data.kind === 'skill' && !node.data.category) {
          node.data.category = categoryFromEdge.get(node.id) as SkillNodeData['category']
        }
      }

      setTreeData({ nodes, edges })
      setPlanGenerated(true)

      if (onPlanGenerated && data.summary) {
        onPlanGenerated(data.summary)
      }
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

  // Build a lookup of nodeId -> category for edge coloring
  const nodeCategoryMap = useMemo(() => {
    if (!treeData) return new Map<string, string>()
    const map = new Map<string, string>()
    for (const node of treeData.nodes) {
      if (node.data.category) {
        map.set(node.id, node.data.category)
      }
    }
    return map
  }, [treeData])

  // Build a lookup of nodeId -> has skill
  const nodeHasMap = useMemo(() => {
    if (!treeData) return new Map<string, boolean>()
    const map = new Map<string, boolean>()
    for (const node of treeData.nodes) {
      map.set(node.id, node.data.has === true || node.data.kind === 'role')
    }
    return map
  }, [treeData])

  const { nodes, edges } = useMemo(() => {
    if (!treeData) return { nodes: [] as Array<Node<SkillNodeData>>, edges: [] as Array<Edge> }

    let filteredNodes = treeData.nodes
    let filteredEdges = treeData.edges

    if (selectedPath) {
      const pathNodeId = filteredNodes.find(n => n.data.kind === 'path' && n.data.label === selectedPath)?.id
      if (pathNodeId) {
        const connectedNodeIds = new Set<string>([pathNodeId])
        filteredEdges.forEach(edge => {
          if (edge.source === pathNodeId || connectedNodeIds.has(edge.source)) {
            connectedNodeIds.add(edge.target)
          }
        })
        const roleNode = filteredNodes.find(n => n.data.kind === 'role')
        if (roleNode) connectedNodeIds.add(roleNode.id)
        const targetNode = filteredNodes.find(n => n.data.kind === 'target')
        if (targetNode) connectedNodeIds.add(targetNode.id)

        filteredNodes = filteredNodes.filter(n => connectedNodeIds.has(n.id))
        filteredEdges = filteredEdges.filter(e => connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target))
      }
    }

    // Responsive center: scale with node count to give more space for larger graphs
    const nodeCount = filteredNodes.length
    const centerX = 500
    const centerY = 500
    const bundleStrength = 0.55
    const layoutedNodes = radialLayout(filteredNodes, filteredEdges, centerX, centerY).map((node) => {
      const override = customPositions[node.id]
      if (!override) return node
      return { ...node, position: override }
    })

    const rootNodeId = layoutedNodes.find((n) => n.data.kind === 'role')?.id ?? 'role'

    const nodeSizeForKind = (kind?: SkillNodeData['kind']) => {
      if (kind === 'role') return { width: 90, height: 90 }
      if (kind === 'target') return { width: 80, height: 80 }
      if (kind === 'path') return { width: 70, height: 70 }
      return { width: 48, height: 48 }
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
      return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
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

    const rootCenter = getNodeCenter(rootNodeId)

    const themedEdges = filteredEdges.map((edge) => {
      const sourceNode = layoutedNodes.find((n) => n.id === edge.source)
      const targetNode = layoutedNodes.find((n) => n.id === edge.target)
      const isRootEdge = edge.source === rootNodeId
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

      const customSource = { x: sourceCenter.x + ux * sourceRadius, y: sourceCenter.y + uy * sourceRadius }
      const customTarget = { x: targetCenter.x - ux * targetRadius, y: targetCenter.y - uy * targetRadius }

      // Determine category color for this edge
      const sourceCat = nodeCategoryMap.get(edge.source)
      const targetCat = nodeCategoryMap.get(edge.target)
      const edgeCat = sourceCat || targetCat || ''
      const categoryColor = CATEGORY_EDGE_COLORS[edgeCat] || 'rgba(255, 255, 255, 0.2)'

      const sourceHas = nodeHasMap.get(edge.source) ?? false
      const targetHas = nodeHasMap.get(edge.target) ?? false

      return {
        ...edge,
        sourcePosition,
        targetPosition,
        data: {
          ...edge.data,
          bundle: !isDirectEdge,
          bundleHub: rootCenter,
          bundleStrength,
          isRootEdge,
          isDirectEdge,
          customSource: isDirectEdge ? customSource : undefined,
          customTarget: isDirectEdge ? customTarget : undefined,
          mastered: sourceHas && targetHas,
          sourceHas,
          targetHas,
          categoryColor,
          animated: true,
        },
        style: {
          ...edge.style,
          stroke: categoryColor,
          strokeWidth: 1.5,
          opacity: 0.3,
        },
        markerEnd: undefined, // Clean look without arrows
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
  }, [treeData, selectedPath, isCustomizing, customPositions, nodeCategoryMap, nodeHasMap])

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
          // Ignore storage failures
        }
        return next
      })
    },
    [isCustomizing, layoutStorageKey],
  )

  // Auto-generate plan on mount
  useEffect(() => {
    if (!planGenerated && !loading) {
      generatePlan()
    }
  }, [effectiveJobId])

  // Theme-aware colors for loading/error states
  const loadingSpinnerBorder = isDark ? 'rgba(255, 230, 0, 0.2)' : theme === 'game' ? 'rgba(139, 90, 43, 0.3)' : 'rgba(255, 230, 0, 0.2)'
  const loadingSpinnerTop = '#FFE600'
  const loadingText = colors.textMuted
  const bgDotColor = isDark
    ? 'rgba(255, 255, 255, 0.03)'
    : theme === 'game'
      ? 'rgba(139, 90, 43, 0.06)'
      : 'rgba(0, 0, 0, 0.04)'
  const controlsBg = isDark
    ? 'rgba(10, 10, 15, 0.8)'
    : theme === 'game'
      ? 'rgba(40, 35, 30, 0.9)'
      : 'rgba(255, 255, 255, 0.9)'
  const controlsBorder = isDark
    ? '1px solid rgba(255, 255, 255, 0.1)'
    : theme === 'game'
      ? `1px solid ${colors.border}`
      : `1px solid ${colors.border}`

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100%', minHeight: 400 }}>
        <div className="text-center">
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: `3px solid ${loadingSpinnerBorder}`,
            borderTopColor: loadingSpinnerTop,
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: loadingText, fontSize: '14px' }}>
            Generating skill constellation...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100%', minHeight: 400 }}>
        <div className="text-center">
          <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
          <button
            onClick={generatePlan}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              background: '#FFE600',
              color: '#1A1A24',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!treeData || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100%', minHeight: 400 }}>
        <p style={{ color: colors.textMuted, fontSize: '14px' }}>
          No skill data available for this role.
        </p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_: React.MouseEvent, node: Node<SkillNodeData>) => {
          if (onNodeClick) {
            onNodeClick(node.id, node.data)
          }
        }}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={isCustomizing === true}
        nodesConnectable={false}
        elementsSelectable
        zoomOnDoubleClick={false}
        onNodesChange={handleNodesChange}
        style={{ background: 'transparent' }}
        defaultEdgeOptions={{ type: 'skillPlanEdge' }}
      >
        <Controls
          style={{
            background: controlsBg,
            border: controlsBorder,
            borderRadius: '8px',
          }}
        />
        <Background
          color={bgDotColor}
          gap={30}
          size={1}
        />
      </ReactFlow>
    </div>
  )
}

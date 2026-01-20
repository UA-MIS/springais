import { useMemo } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import type { Edge, Node } from 'reactflow'

import { mockRoleSkillTrees } from '@/data/mockRoleSkillTrees'
import type { SkillNodeData } from '@/data/mockRoleSkillTrees'
import { SkillNode } from './SkillNode'
import { useTheme, themeColors } from '../../context/ThemeContext'

const nodeTypes = { skillNode: SkillNode }

type Props = {
  roleId: string
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

export function RoleRequirementTree({ roleId }: Props) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light
  const tree = mockRoleSkillTrees[roleId]

  const { nodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [] as Array<Node<SkillNodeData>>, edges: [] as Array<Edge> }

    // Use radial layout centered in the container
    const layoutedNodes = radialLayout(tree.nodes, tree.edges, 400, 300)

    // Apply theme-aware edge styles
    const themedEdges = tree.edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        stroke: edge.style?.stroke?.includes('255,230,0')
          ? 'rgba(255,230,0,0.70)' // Keep accent yellow
          : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)',
      },
      markerEnd: {
        ...edge.markerEnd,
        color: edge.style?.stroke?.includes('255,230,0')
          ? 'rgba(255,230,0,0.70)'
          : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)',
      },
    }))

    return { nodes: layoutedNodes, edges: themedEdges }
  }, [tree, isDark])

  if (!tree) {
    return (
      <div
        className="mt-4 rounded-lg p-4 text-sm"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          color: colors.textMuted,
        }}
      >
        No "routes to become this role" tree yet (mock data). Add it in `mockRoleSkillTrees`.
      </div>
    )
  }

  return (
    <div
      className="h-full overflow-hidden rounded-xl"
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : colors.cardBg,
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
        style={{ background: isDark ? 'rgba(0, 0, 0, 0.2)' : colors.cardBg }}
      >
        <Controls />
        <Background color={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'} gap={22} size={1} />
      </ReactFlow>
    </div>
  )
}


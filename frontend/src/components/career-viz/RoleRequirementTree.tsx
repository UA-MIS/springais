import { useMemo } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import type { Edge, Node } from 'reactflow'
import { Position } from 'reactflow'

import { mockRoleSkillTrees } from '@/data/mockRoleSkillTrees'
import type { SkillNodeData } from '@/data/mockRoleSkillTrees'
import { layoutGraph } from './graphLayoutUtils'
import { SkillNode } from './SkillNode'

const nodeTypes = { skillNode: SkillNode }

type Props = {
  roleId: string
}

export function RoleRequirementTree({ roleId }: Props) {
  const tree = mockRoleSkillTrees[roleId]

  const { nodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [] as Array<Node<SkillNodeData>>, edges: [] as Array<Edge> }
    const layoutedNodes = layoutGraph(tree.nodes, tree.edges, {
      direction: 'TB',
      nodeWidth: 380,
      nodeHeight: 120,
      rankSep: 90,
      nodeSep: 56,
    })

    // Ensure edges connect in a clean top→bottom way.
    const positionedNodes = layoutedNodes.map((n) => ({
      ...n,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    }))

    return { nodes: positionedNodes, edges: tree.edges }
  }, [tree])

  if (!tree) {
    return (
      <div className="mt-4 rounded-lg border border-white/15 bg-white/5 p-4 text-sm text-white/60">
        No “routes to become this role” tree yet (mock data). Add it in `mockRoleSkillTrees`.
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden rounded-xl border border-white/15 bg-black/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.06 }}
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        zoomOnDoubleClick={false}
      >
        <Controls />
        <Background color="rgba(255,255,255,0.12)" gap={22} size={1} />
      </ReactFlow>
    </div>
  )
}


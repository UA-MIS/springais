import dagre from 'dagre'
import type { Edge, Node } from 'reactflow'

export type LayoutOptions = {
  direction?: 'TB' | 'BT' | 'LR' | 'RL'
  rankSep?: number
  nodeSep?: number
  nodeWidth?: number
  nodeHeight?: number
}

const DEFAULTS: Required<LayoutOptions> = {
  direction: 'TB',
  rankSep: 90,
  nodeSep: 110,
  nodeWidth: 220,
  nodeHeight: 84,
}

export function layoutGraph<TNodeData = unknown, TEdgeData = unknown>(
  nodes: Array<Node<TNodeData>>,
  edges: Array<Edge<TEdgeData>>,
  options: LayoutOptions = {},
): Array<Node<TNodeData>> {
  const opts = { ...DEFAULTS, ...options }

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
  })

  for (const node of nodes) {
    g.setNode(node.id, { width: opts.nodeWidth, height: opts.nodeHeight })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const p = g.node(node.id) as { x: number; y: number } | undefined
    if (!p) return node

    // Dagre returns node center, React Flow expects top-left.
    return {
      ...node,
      position: {
        x: p.x - opts.nodeWidth / 2,
        y: p.y - opts.nodeHeight / 2,
      },
    }
  })
}


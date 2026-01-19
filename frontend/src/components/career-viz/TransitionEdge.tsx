import type { EdgeProps } from 'reactflow'
import { EdgeLabelRenderer, getBezierPath } from 'reactflow'
import type { TransitionEdgeData } from './graphTransformUtils'

function strokeForSuccessRate(successRate: number) {
  if (successRate > 0.7) return '#22c55e'
  if (successRate > 0.5) return '#f59e0b'
  return '#9ca3af'
}

export function TransitionEdge(props: EdgeProps<TransitionEdgeData>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd } = props

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const successRate = data?.successRate ?? 0
  const label = `${Math.round(successRate * 100)}%`
  const stroke = strokeForSuccessRate(successRate)

  const dimmed = data?.isDimmed === true
  const highlighted = data?.isHighlighted === true

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={stroke}
        strokeWidth={highlighted ? 3.25 : 2.25}
        strokeOpacity={dimmed ? 0.22 : 0.95}
        fill="none"
        markerEnd={markerEnd}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={[
            'nodrag nopan rounded border border-white/15 bg-black/50 px-2 py-1 text-xs font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md',
            dimmed ? 'opacity-40' : 'opacity-100',
          ].join(' ')}
          title={
            data
              ? [
                  `Success: ${label}`,
                  `Avg time: ${data.avgTimeYears.toFixed(1)}y`,
                  `Sample: ${data.sampleSize}`,
                  `Skills: ${data.commonSkills.join(', ')}`,
                ].join('\n')
              : undefined
          }
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}


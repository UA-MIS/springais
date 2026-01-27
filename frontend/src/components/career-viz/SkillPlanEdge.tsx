import type { EdgeProps } from 'reactflow'
import { getBezierPath, getStraightPath } from 'reactflow'

export function SkillPlanEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const bundleHub = data?.bundleHub as { x: number; y: number } | undefined
  const isBundled = data?.bundle === true && bundleHub
  const isRootEdge = data?.isRootEdge === true
  const isDirectEdge = data?.isDirectEdge === true
  const bundleStrength = typeof data?.bundleStrength === 'number' ? data.bundleStrength : 0.55
  const customSource = data?.customSource as { x: number; y: number } | undefined
  const customTarget = data?.customTarget as { x: number; y: number } | undefined

  const effectiveSourceX = customSource?.x ?? sourceX
  const effectiveSourceY = customSource?.y ?? sourceY
  const effectiveTargetX = customTarget?.x ?? targetX
  const effectiveTargetY = customTarget?.y ?? targetY

  const [edgePath] = getBezierPath({
    sourceX: effectiveSourceX,
    sourceY: effectiveSourceY,
    sourcePosition,
    targetX: effectiveTargetX,
    targetY: effectiveTargetY,
    targetPosition,
  })

  const straightPath = (() => {
    if (customSource && customTarget) {
      return `M ${customSource.x},${customSource.y} L ${customTarget.x},${customTarget.y}`
    }
    const [path] = getStraightPath({
      sourceX: effectiveSourceX,
      sourceY: effectiveSourceY,
      targetX: effectiveTargetX,
      targetY: effectiveTargetY,
    })
    return path
  })()

  const bundledPath = (() => {
    if (!isBundled || !bundleHub || isRootEdge) return edgePath
    const { x: hubX, y: hubY } = bundleHub
    const c1x = effectiveSourceX + (hubX - effectiveSourceX) * bundleStrength
    const c1y = effectiveSourceY + (hubY - effectiveSourceY) * bundleStrength
    const c2x = effectiveTargetX + (hubX - effectiveTargetX) * bundleStrength
    const c2y = effectiveTargetY + (hubY - effectiveTargetY) * bundleStrength
    return `M ${effectiveSourceX},${effectiveSourceY} Q ${c1x},${c1y} ${hubX},${hubY} Q ${c2x},${c2y} ${effectiveTargetX},${effectiveTargetY}`
  })()

  const strokeOpacity = isBundled
    ? Math.min((style.opacity as number | undefined) ?? 1, 0.5)
    : (style.opacity as number | undefined) ?? 1

  const pathToRender = isDirectEdge ? straightPath : bundledPath

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={pathToRender}
      fill="none"
      stroke={style.stroke || 'rgba(255,255,255,0.55)'}
      strokeWidth={style.strokeWidth || 2}
      strokeOpacity={strokeOpacity}
      markerEnd={isBundled ? undefined : markerEnd}
      style={{
        transition: 'stroke-opacity 0.2s, stroke-width 0.2s',
      }}
    />
  )
}


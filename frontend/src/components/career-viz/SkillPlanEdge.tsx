import { memo } from 'react'
import type { EdgeProps } from 'reactflow'
import { getBezierPath, getStraightPath } from 'reactflow'
import { useTheme } from '../../context/ThemeContext'

export const SkillPlanEdge = memo(function SkillPlanEdge({
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
  const { isDark, isGame } = useTheme()
  const bundleHub = data?.bundleHub as { x: number; y: number } | undefined
  const isBundled = data?.bundle === true && bundleHub
  const isRootEdge = data?.isRootEdge === true
  const isDirectEdge = data?.isDirectEdge === true
  const bundleStrength = typeof data?.bundleStrength === 'number' ? data.bundleStrength : 0.55
  const customSource = data?.customSource as { x: number; y: number } | undefined
  const customTarget = data?.customTarget as { x: number; y: number } | undefined
  const sourceHas = data?.sourceHas === true
  const targetHas = data?.targetHas === true
  const categoryColor = (data?.categoryColor as string) || (isDark || isGame ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)')
  const animated = data?.animated !== false

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

  const pathToRender = isDirectEdge ? straightPath : bundledPath

  // Determine edge visual style based on node states
  const bothMastered = sourceHas && targetHas
  const oneMastered = sourceHas || targetHas

  const defaultStroke = isDark || isGame ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'

  const strokeColor = bothMastered
    ? categoryColor
    : oneMastered
      ? categoryColor
      : (style.stroke as string) || defaultStroke

  const strokeOpacity = bothMastered
    ? 0.7
    : oneMastered
      ? 0.35
      : (style.opacity as number) ?? 0.12

  const strokeWidth = bothMastered
    ? 2.5
    : oneMastered
      ? 1.8
      : (style.strokeWidth as number) || 1

  // Unique gradient ID for this edge
  const gradientId = `edge-gradient-${id}`

  return (
    <g>
      {/* Gradient definition for mastered edges */}
      {oneMastered && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={categoryColor} stopOpacity={sourceHas ? 0.8 : 0.1} />
            <stop offset="100%" stopColor={categoryColor} stopOpacity={targetHas ? 0.8 : 0.1} />
          </linearGradient>
        </defs>
      )}

      {/* Glow layer for mastered connections */}
      {bothMastered && (
        <path
          d={pathToRender}
          fill="none"
          stroke={categoryColor}
          strokeWidth={strokeWidth + 4}
          strokeOpacity={0.12}
          style={{ filter: 'blur(3px)' }}
        />
      )}

      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={pathToRender}
        fill="none"
        stroke={oneMastered ? `url(#${gradientId})` : strokeColor}
        strokeWidth={strokeWidth}
        strokeOpacity={oneMastered ? 1 : strokeOpacity}
        markerEnd={isBundled ? undefined : markerEnd}
        style={{
          transition: 'stroke-opacity 0.3s, stroke-width 0.3s',
        }}
      />

      {/* Animated pulse along mastered edges */}
      {bothMastered && animated && (
        <circle r="2" fill={categoryColor} opacity="0.6">
          <animateMotion dur="3s" repeatCount="indefinite" path={pathToRender} />
        </circle>
      )}
    </g>
  )
})

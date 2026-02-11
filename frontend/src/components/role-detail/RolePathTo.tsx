import { useState, useMemo, useCallback } from 'react'
import type { Node, Edge } from 'reactflow'
import { Match } from '../../services/mockMatchData'
import { RoleRequirementTree } from '../career-viz/RoleRequirementTree'
import { NetworkSidebar } from './NetworkSidebar'
import type { SkillNodeData } from '../career-viz/SkillNode'
import { useTheme, themeColors } from '../../context/ThemeContext'

interface RolePathToProps {
  match: Match
}

// Normalize skill name for comparison (lowercase, trimmed)
function normalizeSkill(s: string): string {
  return s.toLowerCase().trim()
}

// Parse transferable skill name, stripping the "(via ...)" suffix
// Backend returns strings like "Project Management (via Project Management Life Cycle (PMLC))"
function parseTransferableSkillName(s: string): string {
  const viaIndex = s.indexOf(' (via ')
  return viaIndex >= 0 ? s.substring(0, viaIndex) : s
}

export default function RolePathTo({ match }: RolePathToProps) {
  const { theme, isDark } = useTheme()
  const colors = themeColors[theme]
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: SkillNodeData } | null>(null)
  const [treeNodes, setTreeNodes] = useState<Node<SkillNodeData>[]>([])
  const [isCustomizing, setIsCustomizing] = useState(false)

  // Build sets for match cross-referencing
  const matchedSet = useMemo(() => new Set(match.matched_skills.map(normalizeSkill)), [match.matched_skills])
  const transferableSet = useMemo(() => new Set((match.transferable_skills || []).map(s => normalizeSkill(parseTransferableSkillName(s)))), [match.transferable_skills])

  // Cross-reference tree nodes with match data to fix skill counts (Issue 4)
  const correctedNodes = useMemo(() => {
    return treeNodes.map(node => {
      if (node.data.kind !== 'skill') return node
      const label = normalizeSkill(node.data.label)
      const isMatched = matchedSet.has(label)
      const isTransferable = transferableSet.has(label)
      if (isMatched || isTransferable) {
        return {
          ...node,
          data: {
            ...node.data,
            has: true,
            transferable: isTransferable && !isMatched,
          },
        }
      }
      return node
    })
  }, [treeNodes, matchedSet, transferableSet])

  // Extract paths/categories from the corrected tree nodes
  const paths = useMemo(() => {
    const pathNodes = correctedNodes.filter(n => n.data.kind === 'path')
    return pathNodes.map(node => {
      const categorySkills = correctedNodes.filter(n =>
        n.data.kind === 'skill' && n.data.category === node.data.label
      )
      const masteredCount = categorySkills.filter(n => n.data.has).length
      const totalCount = categorySkills.length
      const progress = totalCount > 0 ? (masteredCount / totalCount) * 100 : 0

      const emojiMap: Record<string, string> = {
        Technical: '',
        Leadership: '',
        Domain: '',
        Tools: '',
      }

      return {
        name: node.data.label,
        emoji: emojiMap[node.data.label] || '',
        progress,
        type: `${masteredCount}/${totalCount} skills`,
        nodeId: node.id,
      }
    })
  }, [correctedNodes])

  // Overall progress from corrected nodes
  const { masteredCount, gapCount, transferableCount, totalCount } = useMemo(() => {
    const skills = correctedNodes.filter(n => n.data.kind === 'skill')
    const mastered = skills.filter(n => n.data.has && !n.data.transferable).length
    const transferable = skills.filter(n => n.data.transferable).length
    return {
      masteredCount: mastered,
      transferableCount: transferable,
      gapCount: skills.length - mastered - transferable,
      totalCount: skills.length,
    }
  }, [correctedNodes])

  const handleNodeClick = useCallback((nodeId: string, nodeData: SkillNodeData) => {
    setSelectedNode({ id: nodeId, data: nodeData })
  }, [])

  const handleNodesReceived = useCallback((nodes: Node<SkillNodeData>[], _edges: Edge[]) => {
    setTreeNodes(nodes)
  }, [])

  const handlePlanGenerated = useCallback((_summary: any) => {
    // Plan summary available if needed for future features
  }, [])

  const matchPercent = Math.round(match.overall_score * 100)

  // Theme-aware colors
  const wrapperBg = isDark
    ? 'radial-gradient(ellipse at 30% 20%, rgba(6, 182, 212, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(192, 38, 211, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(10, 10, 15, 1) 0%, rgba(5, 5, 10, 1) 100%)'
    : theme === 'game'
      ? 'radial-gradient(ellipse at 30% 20%, rgba(139, 90, 43, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(64, 156, 155, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #1a1510 0%, #15120d 100%)'
      : `linear-gradient(135deg, ${colors.cardBg} 0%, ${colors.pageBg} 100%)`
  const wrapperBorder = isDark
    ? '1px solid rgba(255, 255, 255, 0.06)'
    : theme === 'game'
      ? `1px solid ${colors.cardBorder}`
      : `1px solid ${colors.border}`
  const headerBg = isDark
    ? 'rgba(0, 0, 0, 0.3)'
    : theme === 'game'
      ? 'rgba(0, 0, 0, 0.3)'
      : 'rgba(0, 0, 0, 0.03)'
  const headerBorder = isDark
    ? '1px solid rgba(255, 255, 255, 0.06)'
    : theme === 'game'
      ? `1px solid ${colors.border}`
      : `1px solid ${colors.border}`
  const textMain = colors.textPrimary
  const textSub = colors.textMuted
  const overlayBg = isDark
    ? 'rgba(5, 5, 10, 0.85)'
    : theme === 'game'
      ? 'rgba(26, 21, 16, 0.9)'
      : 'rgba(255, 255, 255, 0.9)'
  const overlayBorder = isDark
    ? '1px solid rgba(255, 255, 255, 0.08)'
    : theme === 'game'
      ? `1px solid ${colors.border}`
      : `1px solid ${colors.border}`
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : theme === 'game' ? colors.border : colors.border
  const statLabelColor = isDark ? 'rgba(255, 255, 255, 0.35)' : colors.textMuted
  const treeCenterBg = isDark
    ? 'radial-gradient(circle at 50% 50%, rgba(255, 230, 0, 0.02) 0%, transparent 60%)'
    : theme === 'game'
      ? 'radial-gradient(circle at 50% 50%, rgba(255, 230, 0, 0.02) 0%, transparent 60%)'
      : 'radial-gradient(circle at 50% 50%, rgba(255, 230, 0, 0.04) 0%, transparent 60%)'
  const bottomBg = isDark
    ? 'rgba(0, 0, 0, 0.2)'
    : theme === 'game'
      ? 'rgba(0, 0, 0, 0.2)'
      : 'rgba(0, 0, 0, 0.02)'
  const bottomBorder = headerBorder
  const tagMatchedColor = '#22c55e'
  const tagGapColor = '#f59e0b'
  const tagTransferableColor = '#a78bfa'

  return (
    <div className="space-y-0" style={{ margin: '-24px -24px 0 -24px' }}>
      <div style={{
        background: wrapperBg,
        borderRadius: '12px',
        overflow: 'hidden',
        border: wrapperBorder,
      }}>
        {/* Header bar */}
        <div style={{
          padding: '20px 24px',
          borderBottom: headerBorder,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: headerBg,
        }}>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: textMain,
              margin: 0,
              letterSpacing: '-0.3px',
            }}>
              Path to {match.job_title}
            </h3>
            <p style={{
              fontSize: '12px',
              color: textSub,
              margin: '4px 0 0 0',
            }}>
              Interactive skill constellation - click nodes to explore
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Match badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(255, 230, 0, 0.08)',
              border: '1px solid rgba(255, 230, 0, 0.2)',
              borderRadius: '20px',
            }}>
              <span style={{ fontSize: '12px', color: textSub }}>Match</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFE600' }}>{matchPercent}%</span>
            </div>

            {/* Customize layout toggle */}
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              style={{
                padding: '6px 14px',
                background: isCustomizing ? 'rgba(255, 230, 0, 0.15)' : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'),
                border: `1px solid ${isCustomizing ? 'rgba(255, 230, 0, 0.3)' : (isDark || theme === 'game' ? 'rgba(255, 255, 255, 0.1)' : colors.border)}`,
                borderRadius: '6px',
                color: isCustomizing ? '#FFE600' : textSub,
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {isCustomizing ? 'Done' : 'Customize'}
            </button>
          </div>
        </div>

        {/* Main content: sidebar + tree */}
        <div style={{
          display: 'flex',
          height: '650px',
        }}>
          {/* Sidebar */}
          <div style={{
            width: '260px',
            flexShrink: 0,
          }}>
            <NetworkSidebar
              paths={paths}
              selectedPath={selectedPath}
              onPathSelect={setSelectedPath}
              selectedNode={selectedNode}
              onNodeDeselect={() => setSelectedNode(null)}
              masteredCount={masteredCount + transferableCount}
              totalCount={totalCount}
            />
          </div>

          {/* Skill Tree */}
          <div style={{
            flex: 1,
            position: 'relative',
            background: treeCenterBg,
          }}>
            <RoleRequirementTree
              roleId={match.job_id}
              jobId={match.job_id}
              onPlanGenerated={handlePlanGenerated}
              onNodesReceived={handleNodesReceived}
              onNodeClick={handleNodeClick}
              selectedPath={selectedPath}
              isCustomizing={isCustomizing}
              matchedSkills={match.matched_skills}
              transferableSkills={match.transferable_skills}
            />

            {/* Skill gap summary overlay (bottom) */}
            {totalCount > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '12px',
                padding: '8px 16px',
                background: overlayBg,
                border: overlayBorder,
                borderRadius: '20px',
                backdropFilter: 'blur(8px)',
              }}>
                <Stat label="Mastered" value={masteredCount} color="#22c55e" labelColor={statLabelColor} />
                <div style={{ width: '1px', background: dividerColor }} />
                {transferableCount > 0 && (
                  <>
                    <Stat label="Transferable" value={transferableCount} color="#a78bfa" labelColor={statLabelColor} />
                    <div style={{ width: '1px', background: dividerColor }} />
                  </>
                )}
                <Stat label="Gaps" value={gapCount} color="#f59e0b" labelColor={statLabelColor} />
                <div style={{ width: '1px', background: dividerColor }} />
                <Stat label="Total" value={totalCount} color={textSub} labelColor={statLabelColor} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom section: Skill gap quick view */}
        <div style={{
          padding: '20px 24px',
          borderTop: bottomBorder,
          background: bottomBg,
        }}>
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
          }}>
            {/* Matched skills */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: statLabelColor,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px',
              }}>
                Your Skills ({match.matched_skills.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {match.matched_skills.map(skill => (
                  <span key={skill} style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: tagMatchedColor,
                    background: `${tagMatchedColor}14`,
                    border: `1px solid ${tagMatchedColor}33`,
                    borderRadius: '4px',
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Skill gaps */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: statLabelColor,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px',
              }}>
                Skill Gaps ({match.skill_gaps.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {match.skill_gaps.map(skill => (
                  <span key={skill} style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: tagGapColor,
                    background: `${tagGapColor}14`,
                    border: `1px solid ${tagGapColor}33`,
                    borderRadius: '4px',
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Transferable skills if available */}
            {match.transferable_skills && match.transferable_skills.length > 0 && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: statLabelColor,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '10px',
                }}>
                  Transferable ({match.transferable_skills.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {match.transferable_skills.map(skill => (
                    <span key={skill} style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: tagTransferableColor,
                      background: `${tagTransferableColor}14`,
                      border: `1px solid ${tagTransferableColor}33`,
                      borderRadius: '4px',
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Small stat display for the bottom overlay
function Stat({ label, value, color, labelColor }: { label: string; value: number; color: string; labelColor: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '9px', color: labelColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  )
}

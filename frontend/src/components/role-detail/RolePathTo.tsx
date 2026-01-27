import { useState, useEffect, useMemo } from 'react'
import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'
import { RoleRequirementTree } from '../career-viz/RoleRequirementTree'
import { NetworkSidebar } from './NetworkSidebar'
import api from '../../services/api'
import type { SkillNodeData } from '../career-viz/SkillNode'

interface RolePathToProps {
  match: Match
}

interface RoleStats {
  avgTimeToPromotion: number | null
  commonPath: string | null
  successRate: number | null
}

interface SkillPlanSummary {
  total_skills: number
  skills_have: number
  skills_need: number
  match_percent: number
  skills_have_list: string[]
  skills_need_list: string[]
}

export default function RolePathTo({ match }: RolePathToProps) {
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]
  const [roleStats, setRoleStats] = useState<RoleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [planSummary, setPlanSummary] = useState<SkillPlanSummary | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: SkillNodeData } | null>(null)
  const [planNodes, setPlanNodes] = useState<any[]>([])
  const [planEdges, setPlanEdges] = useState<any[]>([])
  const [customizeMode, setCustomizeMode] = useState(false)

  // Use the job ID from the match for the skill plan
  const jobId = match.job_id || match.id

  // Fetch real statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try to get transition data for this role
        const response = await api.get(`/patterns/role/${encodeURIComponent(match.job_title)}`)
        const transitions = response.data?.transitions || []

        if (transitions.length > 0) {
          // Calculate average time and success rate from transitions
          const avgTime = transitions.reduce((sum: number, t: any) => sum + (t.avg_time_to_promotion_years || 0), 0) / transitions.length
          const avgSuccess = transitions.reduce((sum: number, t: any) => sum + (t.success_rate || 0), 0) / transitions.length

          setRoleStats({
            avgTimeToPromotion: avgTime,
            successRate: avgSuccess * 100,
            commonPath: transitions[0]?.target_role || null
          })
        }
      } catch (error) {
        console.error('Failed to fetch role stats:', error)
        // Use fallback values if API fails
        setRoleStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [match.job_title])

  // Extract paths from plan nodes and calculate progress using edges
  const paths = useMemo(() => {
    if (!planNodes.length || !planEdges.length) return []
    
    return planNodes
      .filter((node: any) => node.data?.kind === 'path')
      .map((node: any) => {
        const pathName = node.data?.label || ''
        const pathNodeId = node.id
        
        // Find all skills connected to this path via edges
        const pathSkillIds = new Set<string>()
        planEdges.forEach((edge: any) => {
          if (edge.source === pathNodeId) {
            pathSkillIds.add(edge.target)
          }
        })
        
        // Get the actual skill nodes
        const pathSkills = planNodes.filter((n: any) => 
          n.data?.kind === 'skill' && pathSkillIds.has(n.id)
        )
        
        const totalSkills = pathSkills.length
        const skillsHave = pathSkills.filter((n: any) => n.data?.has).length
        const progress = totalSkills > 0 ? (skillsHave / totalSkills) * 100 : 0

        // Map category names to emojis
        const emojiMap: Record<string, string> = {
          'Technical': '☁️',
          'Leadership': '👥',
          'Domain': '💼',
          'Tools': '🛠️',
        }

        return {
          name: pathName,
          emoji: emojiMap[pathName] || '📚',
          progress: Math.round(progress),
          type: pathName === 'Technical' ? 'Technical' : pathName === 'Leadership' ? 'Soft Skills' : 'Core',
          nodeId: pathNodeId,
        }
      })
  }, [planNodes, planEdges])

  // Network stats calculation
  const networkStats = useMemo(() => {
    if (!planSummary) {
      return {
        completed: 0,
        inProgress: 0,
        available: 0,
        match: match.overall_score ? Math.round(match.overall_score * 100) : 0,
      }
    }

    return {
      completed: planSummary.skills_have,
      inProgress: 0, // Will be enhanced later with progress API
      available: planSummary.skills_need,
      match: planSummary.match_percent,
    }
  }, [planSummary, match.overall_score])

  const handlePlanGenerated = (summary: SkillPlanSummary) => {
    setPlanSummary(summary)
  }

  const handleNodeClick = (nodeId: string, nodeData: SkillNodeData) => {
    setSelectedNode({ id: nodeId, data: nodeData })
  }

  const handleNodeDeselect = () => {
    setSelectedNode(null)
  }

  // Fetch plan nodes and edges for path extraction
  const handlePlanNodesReceived = (nodes: any[], edges: any[]) => {
    setPlanNodes(nodes)
    setPlanEdges(edges)
  }

  return (
    <div
      className="network-container"
      style={{
        background: isDark ? '#1A1A24' : colors.cardBg,
        borderRadius: '16px',
        minHeight: '700px',
        position: 'relative',
        overflow: 'hidden',
        border: isDark ? 'none' : `1px solid ${colors.cardBorder}`,
      }}
    >
      {/* Network Header */}
      <div
        className="network-header"
        style={{
          padding: '32px 40px',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: colors.textPrimary,
            }}
          >
            Skill Development Network
          </h2>
          <button
            onClick={() => setCustomizeMode((v) => !v)}
            className="px-3 py-2 rounded-md text-xs font-semibold transition-colors"
            style={{
              backgroundColor: customizeMode ? colors.accent : 'transparent',
              color: customizeMode ? '#1A1A24' : colors.textSecondary,
              border: `1px solid ${customizeMode ? colors.accent : colors.cardBorder}`,
            }}
          >
            {customizeMode ? 'Done' : 'Customize'}
          </button>
        </div>
        <div
          className="network-stats"
          style={{
            display: 'flex',
            gap: '32px',
          }}
        >
          <div className="network-stat" style={{ textAlign: 'center' }}>
            <div
              className="network-stat-value"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: colors.accent,
              }}
            >
              {networkStats.completed}
            </div>
            <div
              className="network-stat-label"
              style={{
                fontSize: '11px',
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Completed
            </div>
          </div>
          <div className="network-stat" style={{ textAlign: 'center' }}>
            <div
              className="network-stat-value"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: colors.accent,
              }}
            >
              {networkStats.inProgress}
            </div>
            <div
              className="network-stat-label"
              style={{
                fontSize: '11px',
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              In Progress
            </div>
          </div>
          <div className="network-stat" style={{ textAlign: 'center' }}>
            <div
              className="network-stat-value"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: colors.accent,
              }}
            >
              {networkStats.available}
            </div>
            <div
              className="network-stat-label"
              style={{
                fontSize: '11px',
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Available
            </div>
          </div>
          <div className="network-stat" style={{ textAlign: 'center' }}>
            <div
              className="network-stat-value"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: colors.accent,
              }}
            >
              {networkStats.match}%
            </div>
            <div
              className="network-stat-label"
              style={{
                fontSize: '11px',
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Match
            </div>
          </div>
        </div>
      </div>

      {/* Network Body */}
      <div
        className="network-body"
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
        }}
      >
        {/* Sidebar */}
        <NetworkSidebar
          paths={paths}
          selectedPath={selectedPath}
          onPathSelect={setSelectedPath}
          selectedNode={selectedNode}
          onNodeDeselect={handleNodeDeselect}
        />

        {/* Canvas */}
        <div
          className="network-canvas"
          style={{
            position: 'relative',
            padding: '40px',
          }}
        >
          <div style={{ height: '500px' }}>
            <style>
              {`
                @keyframes nodeWiggle {
                  0% { transform: rotate(-1.2deg); }
                  50% { transform: rotate(1.2deg); }
                  100% { transform: rotate(-1.2deg); }
                }
              `}
            </style>
            <RoleRequirementTree
              roleId={match.job_title}
              jobId={jobId}
              onPlanGenerated={handlePlanGenerated}
              onNodesReceived={handlePlanNodesReceived}
              onNodeClick={handleNodeClick}
              selectedPath={selectedPath}
              isCustomizing={customizeMode}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

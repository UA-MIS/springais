import { useState, useEffect, useMemo } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'
import api from '../../services/api'
import {
  SuccessPatternsData,
  SuccessPatternMetrics,
  TransitionData,
  StageData,
  SkillFrequency,
  DepartmentData,
} from '../../services/successPatternService'
import MetricCards from '../successPatterns/MetricCards'
import SuccessRateChart from '../successPatterns/SuccessRateChart'
import TimeToPromotionChart from '../successPatterns/TimeToPromotionChart'
import SkillFrequencyChart from '../successPatterns/SkillFrequencyChart'
import DepartmentDistributionChart from '../successPatterns/DepartmentDistributionChart'
import SortableWidget from '../successPatterns/SortableWidget'

interface RoleSuccessPatternsProps {
  match: Match
}

// Backend API response (snake_case)
interface ApiSkillBasedPatterns {
  metrics: {
    avg_time_to_promotion: number
    overall_success_rate: number
    total_sample_size: number
    top_skills: string[]
  }
  success_rate_by_transition: Array<{
    transition: string
    success_rate: number
    sample_size: number
    color?: string
  }>
  time_to_promotion: Record<string, Array<{
    stage: string
    avg_years: number
  }>>
  skill_frequency: Array<{
    skill: string
    frequency: number
  }>
  department_distribution: Array<{
    name: string
    value: number
    color?: string
  }>
  matched_employee_count: number
}

// Transform API response to frontend format
function transformApiResponse(apiData: ApiSkillBasedPatterns): SuccessPatternsData {
  return {
    metrics: {
      avgTimeToPromotion: apiData.metrics.avg_time_to_promotion,
      overallSuccessRate: apiData.metrics.overall_success_rate,
      totalSampleSize: apiData.metrics.total_sample_size,
      topSkills: apiData.metrics.top_skills,
    },
    successRateByTransition: apiData.success_rate_by_transition.map(t => ({
      transition: t.transition,
      successRate: t.success_rate,
      sampleSize: t.sample_size,
      color: t.color,
    })),
    timeToPromotion: Object.fromEntries(
      Object.entries(apiData.time_to_promotion).map(([dept, stages]) => [
        dept,
        stages.map(s => ({ stage: s.stage, avgYears: s.avg_years })),
      ])
    ),
    skillFrequency: apiData.skill_frequency,
    departmentDistribution: apiData.department_distribution,
  }
}

const LAYOUT_KEY = 'springais.roleSuccessPatterns.layout.v1'
const DEFAULT_WIDGET_ORDER = ['successRate', 'timeToPromotion', 'skillFrequency', 'departmentDistribution'] as const
type WidgetId = (typeof DEFAULT_WIDGET_ORDER)[number]

interface PatternState {
  data: SuccessPatternsData | null
  matchedCount: number
  loading: boolean
  error: string | null
}

export default function RoleSuccessPatterns({ match }: RoleSuccessPatternsProps) {
  const { theme, isDark } = useTheme()
  const colors = themeColors[theme]

  const [state, setState] = useState<PatternState>({
    data: null,
    matchedCount: 0,
    loading: true,
    error: null,
  })

  const [isEditingLayout, setIsEditingLayout] = useState(false)
  const [savedOrder, setSavedOrder] = useState<WidgetId[]>([...DEFAULT_WIDGET_ORDER])
  const [draftOrder, setDraftOrder] = useState<WidgetId[]>([...DEFAULT_WIDGET_ORDER])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // Load saved layout from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const ids = parsed.filter((x): x is WidgetId => typeof x === 'string') as WidgetId[]
      const unique = Array.from(new Set(ids))
      const valid = unique.filter((id) => (DEFAULT_WIDGET_ORDER as readonly string[]).includes(id))
      if (valid.length !== DEFAULT_WIDGET_ORDER.length) return
      setSavedOrder(valid)
      setDraftOrder(valid)
    } catch {
      // ignore bad localStorage
    }
  }, [])

  // Fetch patterns from API
  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        // Collect all skills from the job
        const jobSkills = [
          ...(match.required_skills || []),
          ...(match.matched_skills || []),
          ...(match.skill_gaps || []),
          ...(match.preferred_skills || []),
        ].filter((s, i, arr) => s && arr.indexOf(s) === i) // unique, non-empty

        if (jobSkills.length === 0) {
          setState({
            data: null,
            matchedCount: 0,
            loading: false,
            error: 'No skills available for this role',
          })
          return
        }

        // Call the skill-based patterns endpoint
        const response = await api.post<ApiSkillBasedPatterns>('/patterns/role-skills', jobSkills, {
          params: {
            service_line: match.service_line || undefined,
            min_employees: 5,
          },
        })

        const transformed = transformApiResponse(response.data)

        setState({
          data: transformed,
          matchedCount: response.data.matched_employee_count,
          loading: false,
          error: null,
        })
      } catch (err: any) {
        console.error('Failed to fetch patterns:', err)
        setState({
          data: null,
          matchedCount: 0,
          loading: false,
          error: err.response?.data?.detail || 'Failed to load success patterns',
        })
      }
    }

    fetchPatterns()
  }, [match])

  const activeOrder = isEditingLayout ? draftOrder : savedOrder

  const widgets = useMemo(() => {
    if (!state.data) return {} as Record<WidgetId, JSX.Element>
    return {
      successRate: <SuccessRateChart data={state.data.successRateByTransition} />,
      timeToPromotion: <TimeToPromotionChart data={state.data.timeToPromotion} />,
      skillFrequency: <SkillFrequencyChart data={state.data.skillFrequency} />,
      departmentDistribution: <DepartmentDistributionChart data={state.data.departmentDistribution} />,
    } satisfies Record<WidgetId, JSX.Element>
  }, [state.data])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDraftOrder((items) => {
      const oldIndex = items.indexOf(active.id as WidgetId)
      const newIndex = items.indexOf(over.id as WidgetId)
      if (oldIndex === -1 || newIndex === -1) return items
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const startEditing = () => {
    setDraftOrder(savedOrder)
    setIsEditingLayout(true)
  }

  const cancelEditing = () => {
    setDraftOrder(savedOrder)
    setIsEditingLayout(false)
  }

  const confirmEditing = () => {
    setSavedOrder(draftOrder)
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(draftOrder))
    setIsEditingLayout(false)
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFE600] mb-4"></div>
          <p style={{ color: colors.textMuted }}>Loading success pattern data...</p>
        </div>
      </div>
    )
  }

  const { data, matchedCount, error } = state

  if (error || !data || matchedCount === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
            Success Patterns for {match.job_title}
          </h3>
          <p style={{ color: colors.textMuted }}>
            Career insights based on 0 employees with similar skills.
          </p>
        </div>

        <div
          className="p-6 rounded-lg text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            color: colors.textMuted,
          }}
        >
          <p className="mb-2">{error || 'No matching employees found'}</p>
          <p className="text-sm">
            Success patterns are calculated from employees with similar skill sets.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Rearrange Button */}
      <div className="flex items-start justify-between gap-6">
        <div
          className="flex-1 p-6 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
            Success Patterns for {match.job_title}
          </h3>
          <p style={{ color: colors.textMuted }}>
            Career insights based on {matchedCount} employees with similar skills.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-6">
          {isEditingLayout ? (
            <>
              <button
                type="button"
                onClick={confirmEditing}
                className="px-4 py-2 bg-[#FFE600] text-[#2E2E38] font-semibold rounded-sm hover:bg-[#FFD700] transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="px-4 py-2 bg-white/10 text-white/85 font-semibold rounded-sm hover:bg-white/15 transition-colors border border-white/10"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="px-4 py-2 bg-white/10 text-white/85 font-semibold rounded-sm hover:bg-white/15 transition-colors border border-white/10"
            >
              Rearrange
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <MetricCards
        metrics={data.metrics}
        transitionCount={data.successRateByTransition.length}
        employeeCount={matchedCount}
      />

      {/* Charts Grid with Drag and Drop */}
      {isEditingLayout ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={activeOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeOrder.map((id) => (
                <SortableWidget key={id} id={id} enabled={true}>
                  {widgets[id]}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeOrder.map((id) => (
            <SortableWidget key={id} id={id} enabled={false}>
              {widgets[id]}
            </SortableWidget>
          ))}
        </div>
      )}

      {/* Skills Required for This Role */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h4 className="text-md font-semibold mb-4" style={{ color: colors.textPrimary }}>
          Skills Required for This Role
        </h4>
        <div className="flex flex-wrap gap-2">
          {(match.required_skills || [...(match.matched_skills || []), ...(match.skill_gaps || [])])
            .slice(0, 15)
            .map((skill, idx) => {
              const hasSkill = match.matched_skills?.includes(skill)
              return (
                <span
                  key={idx}
                  className="px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: hasSkill
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'rgba(245, 158, 11, 0.12)',
                    color: hasSkill ? '#22c55e' : '#f59e0b',
                    border: `1px solid ${hasSkill ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  }}
                >
                  {hasSkill && '✓ '}{skill}
                </span>
              )
            })}
        </div>
      </div>
    </div>
  )
}

import { useMemo, useState, useEffect } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { getSuccessPatterns, SuccessPatternsData, FilterOptions } from '../../services/successPatternService';
import MetricCards from './MetricCards';
import SuccessRateChart from './SuccessRateChart';
import TimeToPromotionChart from './TimeToPromotionChart';
import SkillFrequencyChart from './SkillFrequencyChart';
import DepartmentDistributionChart from './DepartmentDistributionChart';
import FilterControls, { FilterOptions as FilterControlsOptions } from './FilterControls';
import SortableWidget from './SortableWidget';

const SUCCESS_PATTERNS_LAYOUT_KEY = 'springais.successPatterns.layout.v1';
const DEFAULT_WIDGET_ORDER = ['successRate', 'timeToPromotion', 'skillFrequency', 'departmentDistribution'] as const;
type WidgetId = (typeof DEFAULT_WIDGET_ORDER)[number];

export default function SuccessPatternPage() {
  const [data, setData] = useState<SuccessPatternsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [savedOrder, setSavedOrder] = useState<WidgetId[]>([...DEFAULT_WIDGET_ORDER]);
  const [draftOrder, setDraftOrder] = useState<WidgetId[]>([...DEFAULT_WIDGET_ORDER]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SUCCESS_PATTERNS_LAYOUT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const ids = parsed.filter((x): x is WidgetId => typeof x === 'string') as WidgetId[];
      const unique = Array.from(new Set(ids));
      const valid = unique.filter((id) => (DEFAULT_WIDGET_ORDER as readonly string[]).includes(id));
      if (valid.length !== DEFAULT_WIDGET_ORDER.length) return;
      setSavedOrder(valid);
      setDraftOrder(valid);
    } catch {
      // ignore bad localStorage
    }
  }, []);

  const fetchData = async (filterOptions: FilterOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSuccessPatterns(filterOptions);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load success pattern data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (filterControls: FilterControlsOptions) => {
    const filterOptions: FilterOptions = {
      department: filterControls.department !== 'All' ? filterControls.department : undefined,
      roleLevel: filterControls.roleLevel !== 'All' ? filterControls.roleLevel : undefined,
      timePeriod: filterControls.timePeriod !== 'All time' ? filterControls.timePeriod : undefined,
    };
    setFilters(filterOptions);
    fetchData(filterOptions);
  };

  const handleDepartmentClick = (department: string) => {
    // When department is clicked in pie chart, apply that filter
    handleFilterChange({
      department,
      roleLevel: 'All',
      timePeriod: 'All time',
    });
  };

  const activeOrder = isEditingLayout ? draftOrder : savedOrder;

  const widgets = useMemo(() => {
    if (!data) return {} as Record<WidgetId, JSX.Element>;
    return {
      successRate: <SuccessRateChart data={data.successRateByTransition} />,
      timeToPromotion: <TimeToPromotionChart data={data.timeToPromotion} />,
      skillFrequency: <SkillFrequencyChart data={data.skillFrequency} />,
      departmentDistribution: (
        <DepartmentDistributionChart data={data.departmentDistribution} onDepartmentClick={handleDepartmentClick} />
      ),
    } satisfies Record<WidgetId, JSX.Element>;
  }, [data, handleDepartmentClick]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraftOrder((items) => {
      const oldIndex = items.indexOf(active.id as WidgetId);
      const newIndex = items.indexOf(over.id as WidgetId);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const startEditing = () => {
    setDraftOrder(savedOrder);
    setIsEditingLayout(true);
  };

  const cancelEditing = () => {
    setDraftOrder(savedOrder);
    setIsEditingLayout(false);
  };

  const confirmEditing = () => {
    setSavedOrder(draftOrder);
    localStorage.setItem(SUCCESS_PATTERNS_LAYOUT_KEY, JSON.stringify(draftOrder));
    setIsEditingLayout(false);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-center min-h-[420px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFE600] mb-4"></div>
            <p className="text-white/60">Loading success pattern data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-sm border border-white/15 bg-white/7 p-6 text-center shadow-2xl backdrop-blur-md">
          <p className="text-white font-semibold mb-2">Error loading data</p>
          <p className="text-white/60 mb-5">{error}</p>
          <button
            onClick={() => fetchData(filters)}
            className="px-6 py-2 bg-[#FFE600] text-[#2E2E38] font-semibold rounded-lg hover:bg-[#FFD700] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-sm border border-white/15 bg-white/7 p-6 text-center shadow-2xl backdrop-blur-md">
          <p className="text-white/60">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Success Patterns & Career Insights</h1>
          <p className="text-lg text-white/60">Data-driven insights from successful career transitions at EY</p>
        </div>

        <div className="flex items-center gap-3">
          {isEditingLayout ? (
            <>
              <button
                type="button"
                onClick={confirmEditing}
                className="px-4 py-2 bg-[#FFE600] text-[#2E2E38] font-semibold rounded-sm hover:bg-[#FFD700] transition-colors"
              >
                Confirm changes
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

      {/* Filter Controls */}
      <FilterControls onFilterChange={handleFilterChange} />

      {/* Metric Cards */}
      <MetricCards metrics={data.metrics} />

      {/* Charts Grid */}
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
    </div>
  );
}

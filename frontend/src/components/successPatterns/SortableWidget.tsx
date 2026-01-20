import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';

interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  border: string;
  accent: string;
}

interface SortableWidgetProps {
  id: string;
  enabled: boolean;
  children: ReactNode;
  isDark?: boolean;
  colors?: ThemeColors;
}

export default function SortableWidget({ id, enabled, children, isDark = true, colors }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !enabled,
  });

  // Default colors for backwards compatibility
  const themeColors = colors || {
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    cardBg: '#ffffff',
    cardBorder: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.15)',
    accent: '#FFE600',
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {enabled && (
        <button
          type="button"
          aria-label="Drag to reorder"
          className="absolute right-3 top-3 z-20 inline-flex items-center justify-center rounded-sm px-2 py-1 text-xs font-semibold transition-colors"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : themeColors.cardBg,
            color: themeColors.textSecondary,
            border: `1px solid ${themeColors.border}`,
          }}
          {...attributes}
          {...listeners}
        >
          Drag
        </button>
      )}
      {children}
    </div>
  );
}


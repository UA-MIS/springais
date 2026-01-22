import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';

interface SortableWidgetProps {
  id: string;
  enabled: boolean;
  children: ReactNode;
}

export default function SortableWidget({ id, enabled, children }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !enabled,
  });

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
          className="absolute right-3 top-3 z-20 inline-flex items-center justify-center rounded-sm border border-white/10 bg-white/10 px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/15"
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


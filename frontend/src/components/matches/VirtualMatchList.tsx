/**
 * VirtualMatchList - Virtualized match list for efficient rendering of large lists.
 *
 * Uses @tanstack/react-virtual for windowed rendering, which only renders
 * visible items plus a small overscan buffer. This dramatically improves
 * performance when displaying hundreds of matches.
 *
 * Benefits:
 * - Renders only visible items (typically 5-10 instead of 500+)
 * - Smooth scrolling even with thousands of items
 * - Reduces memory usage and DOM node count
 * - Maintains scroll position during filter changes
 */

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Match } from '../../services/mockMatchData';
import MatchCard from './MatchCard';
import { useTheme, themeColors } from '../../context/ThemeContext';

interface VirtualMatchListProps {
  matches: Match[];
  onViewDetails: (matchId: string) => void;
  onSave: (matchId: string) => void;
  height?: string;
  estimatedItemHeight?: number;
}

export default function VirtualMatchList({
  matches,
  onViewDetails,
  onSave,
  height = 'calc(100vh - 300px)',
  estimatedItemHeight = 200,
}: VirtualMatchListProps) {
  const { isDark, isGame, theme } = useTheme();
  const colors = themeColors[theme];
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan: 5, // Render 5 extra items above/below viewport for smooth scrolling
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Memoized handlers
  const handleViewDetails = useCallback((matchId: string) => {
    onViewDetails(matchId);
  }, [onViewDetails]);

  const handleSave = useCallback((matchId: string) => {
    onSave(matchId);
  }, [onSave]);

  if (matches.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{
        height,
        // Custom scrollbar styling for dark mode
        scrollbarWidth: 'thin',
        scrollbarColor: isDark || isGame
          ? `${colors.border} transparent`
          : `${colors.textMuted} transparent`,
      }}
    >
      {/* This div holds the total height to enable proper scrollbar sizing */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Render only visible items */}
        {virtualItems.map((virtualRow) => {
          const match = matches[virtualRow.index];
          return (
            <div
              key={match.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                // Add some padding between cards
                paddingBottom: '16px',
              }}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
            >
              <MatchCard
                match={match}
                onViewDetails={handleViewDetails}
                onSave={handleSave}
              />
            </div>
          );
        })}
      </div>

      {/* Scroll indicator for large lists */}
      {matches.length > 50 && (
        <div
          className="sticky bottom-0 py-2 text-center text-sm"
          style={{
            backgroundColor: isDark || isGame
              ? 'rgba(0, 0, 0, 0.8)'
              : 'rgba(255, 255, 255, 0.9)',
            color: colors.textMuted,
            backdropFilter: 'blur(4px)',
          }}
        >
          Showing {Math.min(virtualItems.length, matches.length)} of {matches.length} matches
        </div>
      )}
    </div>
  );
}

/**
 * Hook to get virtual list stats for debugging/monitoring
 */
export function useVirtualListStats(matches: Match[]) {
  return {
    totalItems: matches.length,
    estimatedMemorySavings: matches.length > 20
      ? `~${Math.round((1 - 20 / matches.length) * 100)}% fewer DOM nodes`
      : 'N/A (list is small enough)',
    recommendVirtualization: matches.length > 50,
  };
}

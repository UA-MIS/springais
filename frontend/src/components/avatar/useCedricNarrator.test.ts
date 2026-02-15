import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCedricNarrator, type NarratorPhase } from './useCedricNarrator';

// Track isFetching value for mock
let mockIsFetching = 0;
vi.mock('@tanstack/react-query', () => ({
  useIsFetching: () => mockIsFetching,
}));

// Mock AdventureModeContext
vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: { enabled: true },
  }),
}));

const testPhases: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: 5000,
    dialogue: { medieval: 'Phase 1 medieval', modern: 'Phase 1 modern' },
    avatarState: 'reading' as NarratorPhase['avatarState'],
    tip: { medieval: 'Tip 1 medieval', modern: 'Tip 1 modern' },
  },
  {
    minTime: 5000,
    maxTime: 10000,
    dialogue: { medieval: 'Phase 2 medieval', modern: 'Phase 2 modern' },
    avatarState: 'thinking' as NarratorPhase['avatarState'],
    tip: { medieval: 'Tip 2 medieval', modern: 'Tip 2 modern' },
  },
  {
    minTime: 10000,
    maxTime: Infinity,
    dialogue: { medieval: 'Phase 3 medieval', modern: 'Phase 3 modern' },
    avatarState: 'excited' as NarratorPhase['avatarState'],
  },
];

describe('useCedricNarrator (Story 5.1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsFetching = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns isLoading=false when query is not loading', () => {
    mockIsFetching = 0;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentPhase).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it('returns isLoading=true when query is loading', () => {
    mockIsFetching = 1;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    // Need to wait for the effect to fire
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('selects phase 1 initially (elapsed < 5s)', () => {
    mockIsFetching = 1;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.currentPhase?.avatarState).toBe('reading');
  });

  it('transitions to phase 2 after 5s', () => {
    mockIsFetching = 1;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    expect(result.current.currentPhase?.avatarState).toBe('thinking');
  });

  it('transitions to phase 3 after 10s', () => {
    mockIsFetching = 1;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    act(() => {
      vi.advanceTimersByTime(10100);
    });

    expect(result.current.currentPhase?.avatarState).toBe('excited');
  });

  it('tracks elapsed time', () => {
    mockIsFetching = 1;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Elapsed time should be approximately 3000ms (could have slight drift with Date.now)
    expect(result.current.elapsedTime).toBeGreaterThanOrEqual(2900);
    expect(result.current.elapsedTime).toBeLessThanOrEqual(3200);
  });

  it('calculates progress as percentage capped at 99%', () => {
    mockIsFetching = 1;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    // At 5s, we're 50% through the finite phase timeline (10s)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // progress = (5000 / 10000) * 99 = 49.5 -> 50
    expect(result.current.progress).toBeGreaterThanOrEqual(45);
    expect(result.current.progress).toBeLessThanOrEqual(55);

    // Past 10s, should cap at 99
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.progress).toBe(99);
  });

  it('returns tip text for phases with tips (medieval mode)', () => {
    mockIsFetching = 1;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.tip).toBe('Tip 1 medieval');
  });

  it('returns null tip for phases without tips', () => {
    mockIsFetching = 1;
    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    act(() => {
      vi.advanceTimersByTime(10100);
    });

    expect(result.current.tip).toBeNull();
  });

  it('resets on completion and fires onComplete', () => {
    const onComplete = vi.fn();
    mockIsFetching = 1;

    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'], onComplete })
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isLoading).toBe(true);

    // Stop loading
    mockIsFetching = 0;
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.isLoading).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resets elapsed time after completion', () => {
    mockIsFetching = 1;

    const { result } = renderHook(() =>
      useCedricNarrator({ phases: testPhases, queryKey: ['test'] })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedTime).toBeGreaterThan(0);

    mockIsFetching = 0;
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.elapsedTime).toBe(0);
  });
});

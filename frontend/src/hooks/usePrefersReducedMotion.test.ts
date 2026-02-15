import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

describe('usePrefersReducedMotion (Story 8.3)', () => {
  let listeners: Record<string, EventListener>;
  let mockMatches: boolean;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    listeners = {};
    mockMatches = false;

    // Define matchMedia mock (jsdom doesn't have it)
    window.matchMedia = vi.fn((query: string) => ({
      matches: mockMatches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (event: string, handler: EventListener) => {
        listeners[event] = handler;
      },
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns false when no preference set', () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion: reduce is set', () => {
    mockMatches = true;
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      if (listeners['change']) {
        listeners['change']({ matches: true } as unknown as Event);
      }
    });

    expect(result.current).toBe(true);
  });

  it('calls matchMedia with correct query', () => {
    renderHook(() => usePrefersReducedMotion());
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});

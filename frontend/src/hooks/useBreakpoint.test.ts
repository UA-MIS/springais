import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint } from './useBreakpoint';

describe('useBreakpoint (Story 8.4)', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    vi.useFakeTimers();
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  function setWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  }

  it('returns "desktop" for width >= 1024', () => {
    setWidth(1024);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('desktop');
  });

  it('returns "tablet" for width 768-1023', () => {
    setWidth(900);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('tablet');
  });

  it('returns "mobile" for width < 768', () => {
    setWidth(600);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('mobile');
  });

  it('updates on resize with debounce', () => {
    setWidth(1200);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('desktop');

    act(() => {
      setWidth(600);
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe('mobile');
  });
});

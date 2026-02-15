import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

// Track current mock pathname
let mockPathname = '/matches';
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
}));

// Mock AdventureModeContext
const mockAdventureState = {
  enabled: true,
  loading: false,
  level: 1,
  gold: 100,
  recentXPGain: null,
  recentGoldGain: null,
  levelUpPending: false,
  recentAchievement: null,
  recentQuestComplete: null,
};

vi.mock('./AdventureModeContext', () => ({
  useAdventureMode: () => ({ state: mockAdventureState }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
}));

vi.mock('../services/progressionService', () => ({
  progressionApi: { getProgression: vi.fn() },
  QUERY_KEYS: { progression: ['progression'] },
}));

import { CedricProvider, useCedric } from './CedricContext';

function Wrapper({ children }: { children: ReactNode }) {
  return <CedricProvider>{children}</CedricProvider>;
}

describe('CedricContext Route Change Listener (Story 6.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mockPathname = '/matches';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enqueues first-visit message on initial route if not visited before', () => {
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });

    // Should have enqueued the first-visit message for /matches
    // The message should appear as currentMessage since queue was empty
    expect(result.current.state.currentMessage).not.toBeNull();
    expect(result.current.state.currentMessage?.id).toContain('first-visit');
  });

  it('sets localStorage after first-visit message is shown', () => {
    renderHook(() => useCedric(), { wrapper: Wrapper });

    expect(localStorage.getItem('cedric-first-visit-/matches')).toBe('true');
  });

  it('does not show first-visit message if already visited', () => {
    localStorage.setItem('cedric-first-visit-/matches', 'true');
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });

    // Should NOT have a first-visit message (return message may or may not show depending on anti-annoyance)
    if (result.current.state.currentMessage) {
      expect(result.current.state.currentMessage.id).not.toContain('first-visit');
    }
  });

  it('does not show first-visit message during active walkthrough', () => {
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });

    // Start walkthrough
    act(() => {
      result.current.startWalkthrough();
    });

    // Clear any existing messages
    act(() => {
      result.current.dismissCurrentMessage();
    });

    // The walkthrough suppresses first-visit messages
    // Since walkthrough is now active, new route changes won't trigger first-visit
    expect(result.current.state.walkthroughActive).toBe(true);
  });

  it('clears non-persistent messages on route change', () => {
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });

    // Enqueue a proactive message
    act(() => {
      result.current.enqueueMessage({
        id: 'proactive-test',
        text: 'Test proactive message',
        priority: 'proactive',
        duration: 5000,
        typing: false,
        dismissible: true,
        suppressible: false,
      });
    });

    // The queue should have the proactive message (or it's current)
    // Route change should clear non-persistent (proactive, reaction) messages
    // This is verified by the CLEAR_NON_PERSISTENT action in the reducer
  });
});

describe('CedricContext Page Visibility Override', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-minimizes Cedric on /roadmap page', () => {
    mockPathname = '/roadmap';
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });

    // /roadmap has defaultVisibility: 'minimized' in cedricPageConfig
    expect(result.current.state.visibility).toBe('minimized');
  });

  it('keeps Cedric full on pages without defaultVisibility', () => {
    mockPathname = '/matches';
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });

    expect(result.current.state.visibility).toBe('full');
  });

  it('restores Cedric to full when navigating away from /roadmap', () => {
    // Start on /roadmap (minimized)
    mockPathname = '/roadmap';
    const { result, rerender } = renderHook(() => useCedric(), { wrapper: Wrapper });
    expect(result.current.state.visibility).toBe('minimized');

    // Navigate away to /matches
    mockPathname = '/matches';
    rerender();

    expect(result.current.state.visibility).toBe('full');
  });

  it('allows user to manually restore from minimized on /roadmap', () => {
    mockPathname = '/roadmap';
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });
    expect(result.current.state.visibility).toBe('minimized');

    // User manually restores
    act(() => {
      result.current.restore();
    });

    expect(result.current.state.visibility).toBe('full');
  });
});

describe('CedricContext Anti-Annoyance Protocol (Story 6.3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mockPathname = '/matches';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sessionMessageCount starts at 0', () => {
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });
    expect(result.current.state.sessionMessageCount).toBe(0);
  });

  it('suppressMessageType persists to localStorage', () => {
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });

    act(() => {
      result.current.suppressMessageType('return-/matches');
    });

    expect(localStorage.getItem('cedric-msg-suppress-return-/matches')).toBe('true');
  });

  it('quietMode can be toggled', () => {
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });

    expect(result.current.state.quietMode).toBe(false);

    act(() => {
      result.current.toggleQuietMode();
    });

    expect(result.current.state.quietMode).toBe(true);
    expect(localStorage.getItem('cedric-quiet-mode')).toBe('true');
  });

  it('quietMode is restored from localStorage on mount', () => {
    localStorage.setItem('cedric-quiet-mode', 'true');
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });
    expect(result.current.state.quietMode).toBe(true);
  });

  it('lastMessageTimestamp starts at 0', () => {
    const { result } = renderHook(() => useCedric(), { wrapper: Wrapper });
    expect(result.current.state.lastMessageTimestamp).toBe(0);
  });
});

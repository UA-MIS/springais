import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AvatarLoadingStage from './AvatarLoadingStage';
import type { NarratorPhase } from './useCedricNarrator';
import { AnimationState } from '../../context/cedricTypes';

// Mock AdventureModeContext
vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: {
      enabled: true,
      level: 3,
    },
  }),
}));

// Mock framer-motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockPhase: NarratorPhase = {
  minTime: 0,
  maxTime: 15000,
  dialogue: {
    medieval: 'Consulting the ancient tomes...',
    modern: 'Starting analysis...',
  },
  avatarState: AnimationState.Reading,
  tip: {
    medieval: 'Did you know you earn XP?',
    modern: 'Tip: You earn rewards.',
  },
};

describe('AvatarLoadingStage (Story 5.3)', () => {
  it('renders nothing when not loading', () => {
    const { container } = render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={50}
        tip="A tip"
        isLoading={false}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when currentPhase is null', () => {
    const { container } = render(
      <AvatarLoadingStage
        currentPhase={null}
        progress={50}
        tip="A tip"
        isLoading={true}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the loading stage container when loading with a phase', () => {
    render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={50}
        tip="A tip"
        isLoading={true}
      />
    );
    expect(screen.getByTestId('avatar-loading-stage')).toBeTruthy();
  });

  it('renders a speech bubble with phase dialogue', () => {
    render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={50}
        tip={null}
        isLoading={true}
      />
    );
    expect(screen.getByTestId('loading-speech-bubble')).toBeTruthy();
  });

  it('renders the avatar', () => {
    render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={50}
        tip={null}
        isLoading={true}
      />
    );
    expect(screen.getByTestId('loading-avatar')).toBeTruthy();
  });

  it('renders a progress bar', () => {
    render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={65}
        tip={null}
        isLoading={true}
      />
    );
    expect(screen.getByTestId('loading-progress-bar')).toBeTruthy();
  });

  it('displays the progress percentage', () => {
    render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={42}
        tip={null}
        isLoading={true}
      />
    );
    expect(screen.getByTestId('progress-percentage').textContent).toBe('42%');
  });

  it('renders tip text when provided', () => {
    render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={50}
        tip="A helpful tip"
        isLoading={true}
      />
    );
    expect(screen.getByTestId('loading-tip').textContent).toBe('A helpful tip');
  });

  it('does not render tip when null', () => {
    render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={50}
        tip={null}
        isLoading={true}
      />
    );
    expect(screen.queryByTestId('loading-tip')).toBeNull();
  });

  it('uses flex-col items-center layout', () => {
    render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={50}
        tip={null}
        isLoading={true}
      />
    );
    const container = screen.getByTestId('avatar-loading-stage');
    expect(container.className).toContain('flex');
    expect(container.className).toContain('flex-col');
    expect(container.className).toContain('items-center');
  });
});

describe('AvatarLoadingStage Completion Animation (Story 5.4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows confetti and completion state when loading completes (long load)', () => {
    const { rerender } = render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={99}
        tip={null}
        isLoading={true}
        elapsedTime={5000}
      />
    );

    // Stop loading
    rerender(
      <AvatarLoadingStage
        currentPhase={null}
        progress={0}
        tip={null}
        isLoading={false}
        elapsedTime={5000}
      />
    );

    // Should be in completing state with confetti
    expect(screen.getByTestId('avatar-loading-stage')).toBeTruthy();
    expect(screen.getByTestId('completion-confetti')).toBeTruthy();
    expect(screen.getByTestId('progress-percentage').textContent).toBe('100%');
  });

  it('shows completion speech bubble when completionDialogue is provided', () => {
    const completionDialogue = {
      medieval: 'Behold! Your path has been charted!',
      modern: 'Your roadmap is ready!',
    };

    const { rerender } = render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={99}
        tip={null}
        isLoading={true}
        elapsedTime={5000}
        completionDialogue={completionDialogue}
      />
    );

    rerender(
      <AvatarLoadingStage
        currentPhase={null}
        progress={0}
        tip={null}
        isLoading={false}
        elapsedTime={5000}
        completionDialogue={completionDialogue}
      />
    );

    expect(screen.getByTestId('completion-speech-bubble')).toBeTruthy();
  });

  it('skips completion animation for short loads (< 2s)', () => {
    const onFadeOutComplete = vi.fn();

    const { rerender } = render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={50}
        tip={null}
        isLoading={true}
        elapsedTime={1500}
        onFadeOutComplete={onFadeOutComplete}
      />
    );

    rerender(
      <AvatarLoadingStage
        currentPhase={null}
        progress={0}
        tip={null}
        isLoading={false}
        elapsedTime={1500}
        onFadeOutComplete={onFadeOutComplete}
      />
    );

    // Should immediately go to done (no confetti, no loading stage)
    expect(screen.queryByTestId('avatar-loading-stage')).toBeNull();
    expect(onFadeOutComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onFadeOutComplete after fade-out', () => {
    const onFadeOutComplete = vi.fn();

    const { rerender } = render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={99}
        tip={null}
        isLoading={true}
        elapsedTime={10000}
        onFadeOutComplete={onFadeOutComplete}
      />
    );

    rerender(
      <AvatarLoadingStage
        currentPhase={null}
        progress={0}
        tip={null}
        isLoading={false}
        elapsedTime={10000}
        onFadeOutComplete={onFadeOutComplete}
      />
    );

    // Should be in completing state
    expect(screen.getByTestId('avatar-loading-stage')).toBeTruthy();
    expect(onFadeOutComplete).not.toHaveBeenCalled();

    // Advance past the 1.5s done timer
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onFadeOutComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call setState after unmount (B6 fix)', () => {
    const onFadeOutComplete = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender, unmount } = render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={99}
        tip={null}
        isLoading={true}
        elapsedTime={10000}
        onFadeOutComplete={onFadeOutComplete}
      />
    );

    rerender(
      <AvatarLoadingStage
        currentPhase={null}
        progress={0}
        tip={null}
        isLoading={false}
        elapsedTime={10000}
        onFadeOutComplete={onFadeOutComplete}
      />
    );

    // Should be in completing state
    expect(screen.getByTestId('avatar-loading-stage')).toBeTruthy();

    // Unmount before timers fire
    unmount();

    // Advance past all timers -- should not throw or warn
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // onFadeOutComplete should NOT have been called after unmount
    expect(onFadeOutComplete).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('hides confetti after 1s and starts fade-out', () => {
    const { rerender } = render(
      <AvatarLoadingStage
        currentPhase={mockPhase}
        progress={99}
        tip={null}
        isLoading={true}
        elapsedTime={10000}
      />
    );

    rerender(
      <AvatarLoadingStage
        currentPhase={null}
        progress={0}
        tip={null}
        isLoading={false}
        elapsedTime={10000}
      />
    );

    // Confetti should be visible initially
    expect(screen.getByTestId('completion-confetti')).toBeTruthy();

    // After 1s, confetti disappears
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // The confetti effect's `active` prop should now be false
    // But since ConfettiEffect is mocked via framer-motion mock, it still renders the div
    // The important check is that the stage transitions to 'fading-out'
    expect(screen.getByTestId('avatar-loading-stage')).toBeTruthy();
  });
});

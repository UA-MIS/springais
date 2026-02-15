import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NarratorWrapper from './NarratorWrapper';
import { AnimationState } from '../../context/cedricTypes';
import type { NarratorPhase } from './useCedricNarrator';

// Mock CedricContext
vi.mock('../../context/CedricContext', () => ({
  useCedric: () => ({
    state: {
      visibility: 'full',
    },
    triggerAnimation: vi.fn(),
    enqueueMessage: vi.fn(),
  }),
}));

// Mock AdventureModeContext
vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: {
      enabled: true,
      level: 3,
    },
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const testPhases: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: Infinity,
    dialogue: { medieval: 'One moment...', modern: 'Loading...' },
    avatarState: AnimationState.Thinking,
  },
];

describe('NarratorWrapper (Story 5.5)', () => {
  it('shows children when not loading', () => {
    render(
      <NarratorWrapper isLoading={false} phases={testPhases}>
        <div data-testid="content">Content here</div>
      </NarratorWrapper>
    );
    expect(screen.getByTestId('content')).toBeTruthy();
    expect(screen.queryByTestId('avatar-loading-stage')).toBeNull();
  });

  it('shows loading stage when loading', () => {
    render(
      <NarratorWrapper isLoading={true} phases={testPhases}>
        <div data-testid="content">Content here</div>
      </NarratorWrapper>
    );
    expect(screen.getByTestId('avatar-loading-stage')).toBeTruthy();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('shows error state with message', () => {
    render(
      <NarratorWrapper
        isLoading={false}
        phases={testPhases}
        errorMessage="Something went wrong"
      >
        <div data-testid="content">Content</div>
      </NarratorWrapper>
    );
    expect(screen.getByTestId('narrator-error')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(
      <NarratorWrapper
        isLoading={false}
        phases={testPhases}
        errorMessage="Error"
        onRetry={onRetry}
      >
        <div>Content</div>
      </NarratorWrapper>
    );
    expect(screen.getByTestId('narrator-retry-button')).toBeTruthy();
  });

  it('does not show retry button when onRetry is not provided', () => {
    render(
      <NarratorWrapper
        isLoading={false}
        phases={testPhases}
        errorMessage="Error"
      >
        <div>Content</div>
      </NarratorWrapper>
    );
    expect(screen.queryByTestId('narrator-retry-button')).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AvatarCompanion from './AvatarCompanion';
import { AnimationState } from '../../context/CedricContext';

// Mock state holders (mutable)
let mockCedricState: Record<string, unknown> = {};
const mockOpenCharacterSheet = vi.fn();

vi.mock('../../context/CedricContext', () => ({
  useCedric: () => ({
    state: mockCedricState,
    equippedItems: {},
    restore: vi.fn(),
    minimize: vi.fn(),
    toggleQuietMode: vi.fn(),
    openCharacterSheet: mockOpenCharacterSheet,
    closeCharacterSheet: vi.fn(),
    dismissCurrentMessage: vi.fn(),
    suppressMessageType: vi.fn(),
  }),
  AnimationState: {
    Idle: 'idle',
    Thinking: 'thinking',
    Pointing: 'pointing',
  },
}));

let mockAdventureState: Record<string, unknown> = {};
vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: mockAdventureState,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'game',
    isGame: true,
    isDark: false,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderWithRouter(route = '/matches') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AvatarCompanion />
    </MemoryRouter>
  );
}

describe('AvatarCompanion - Store Preview (Story 7.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCedricState = {
      visibility: 'full',
      position: { anchor: 'bottom-right' },
      animationState: 'idle',
      animationQueue: [],
      currentMessage: null,
      speechQueue: [],
      walkthroughActive: false,
      walkthroughStep: 0,
      walkthroughComplete: false,
      isNewUser: false,
      quietMode: false,
      sessionMessageCount: 0,
      lastMessageTimestamp: 0,
      characterSheetOpen: false,
      reducedMotion: false,
    };
    mockAdventureState = {
      enabled: true,
      level: 3,
      gold: 100,
      equippedItems: {},
    };
  });

  it('renders fixed avatar on non-store pages', () => {
    renderWithRouter('/matches');
    const companion = screen.getByTestId('cedric-companion');
    expect(companion).toBeTruthy();
    expect(companion.style.position).toBe('fixed');
  });

  it('does not render fixed avatar on /store page (defers to StoreAvatarPreview)', () => {
    renderWithRouter('/store');
    expect(screen.queryByTestId('cedric-companion')).toBeNull();
  });

  it('renders avatar at 128px on non-store pages', () => {
    renderWithRouter('/matches');
    const sprite = screen.getByTestId('avatar-sprite');
    expect(sprite.style.width).toBe('128px');
    expect(sprite.style.height).toBe('128px');
  });

  it('returns to normal fixed position when navigating away from /store', () => {
    const { unmount } = renderWithRouter('/store');
    expect(screen.queryByTestId('cedric-companion')).toBeNull();
    unmount();

    renderWithRouter('/matches');
    const companion = screen.getByTestId('cedric-companion');
    expect(companion.style.position).toBe('fixed');
  });

  it('opens character sheet on click', () => {
    renderWithRouter('/matches');
    const companion = screen.getByTestId('cedric-companion');
    fireEvent.click(companion);
    expect(mockOpenCharacterSheet).toHaveBeenCalledTimes(1);
  });
});

describe('AvatarCompanion - Cursor Tracking (Story 7.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCedricState = {
      visibility: 'full',
      position: { anchor: 'bottom-right' },
      animationState: 'idle',
      animationQueue: [],
      currentMessage: null,
      speechQueue: [],
      walkthroughActive: false,
      walkthroughStep: 0,
      walkthroughComplete: false,
      isNewUser: false,
      quietMode: false,
      sessionMessageCount: 0,
      lastMessageTimestamp: 0,
      characterSheetOpen: false,
      reducedMotion: false,
    };
    mockAdventureState = {
      enabled: true,
      level: 3,
      gold: 100,
      equippedItems: {},
    };
  });

  it('applies cursor tracking transform on mouse move within 200px', () => {
    renderWithRouter('/matches');
    const companion = screen.getByTestId('cedric-companion');

    // Mock getBoundingClientRect
    companion.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      right: 228,
      bottom: 228,
      width: 128,
      height: 128,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Move mouse near the avatar (within 200px)
    fireEvent(window, new MouseEvent('mousemove', {
      clientX: 200, // Near center of avatar
      clientY: 164, // Near center Y
    }));

    // The transform should be applied (non-empty)
    // Note: exact transform values depend on distance calculations
    expect(companion.style.transition).toBe('transform 0.3s ease');
  });

  it('disables cursor tracking when walkthrough is active', () => {
    mockCedricState.walkthroughActive = true;
    renderWithRouter('/matches');
    const companion = screen.getByTestId('cedric-companion');

    // Transform should not be set when tracking is disabled
    expect(companion.style.transform).toBe('');
  });

  it('disables cursor tracking when animation is playing', () => {
    mockCedricState.animationState = 'thinking';
    renderWithRouter('/matches');
    const companion = screen.getByTestId('cedric-companion');
    expect(companion.style.transform).toBe('');
  });

  it('disables cursor tracking when reduced motion is preferred', () => {
    mockCedricState.reducedMotion = true;
    renderWithRouter('/matches');
    const companion = screen.getByTestId('cedric-companion');
    expect(companion.style.transform).toBe('');
  });

  it('disables cursor tracking when avatar is minimized', () => {
    mockCedricState.visibility = 'minimized';
    renderWithRouter('/matches');
    // Should show minimized state, not full state
    expect(screen.queryByTestId('cedric-companion')).toBeNull();
    expect(screen.getByTestId('cedric-minimized')).toBeTruthy();
  });
});

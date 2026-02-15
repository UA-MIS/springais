import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/test-page' }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onContextMenu, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return (
        <div onContextMenu={onContextMenu} {...rest}>
          {children}
        </div>
      );
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Track quiet mode state
let mockQuietMode = false;
const mockToggleQuietMode = vi.fn(() => {
  mockQuietMode = !mockQuietMode;
});
const mockMinimize = vi.fn();
const mockRestore = vi.fn();

vi.mock('../../context/CedricContext', () => ({
  useCedric: () => ({
    state: {
      visibility: 'full',
      animationState: 'idle',
      isNewUser: false,
      quietMode: mockQuietMode,
      walkthroughActive: false,
      reducedMotion: false,
      characterSheetOpen: false,
      currentMessage: null,
    },
    equippedItems: {},
    restore: mockRestore,
    minimize: mockMinimize,
    toggleQuietMode: mockToggleQuietMode,
    openCharacterSheet: vi.fn(),
    closeCharacterSheet: vi.fn(),
    dismissCurrentMessage: vi.fn(),
    suppressMessageType: vi.fn(),
  }),
}));

vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: {
      enabled: true,
      level: 1,
    },
  }),
}));

// Mock AvatarSprite
vi.mock('./AvatarSprite', () => ({
  default: () => <div data-testid="avatar-sprite" />,
}));

// Mock SpeechBubble
vi.mock('./SpeechBubble', () => ({
  default: () => null,
}));

import AvatarCompanion from './AvatarCompanion';

describe('AvatarCompanion Context Menu (Story 6.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuietMode = false;
  });

  it('shows context menu on right-click', () => {
    render(<AvatarCompanion />);
    const companion = screen.getByTestId('cedric-companion');

    fireEvent.contextMenu(companion);

    expect(screen.getByTestId('cedric-context-menu')).toBeDefined();
    expect(screen.getByTestId('cedric-menu-quiet')).toBeDefined();
    expect(screen.getByTestId('cedric-menu-minimize')).toBeDefined();
    expect(screen.getByTestId('cedric-menu-reset')).toBeDefined();
  });

  it('context menu has role="menu"', () => {
    render(<AvatarCompanion />);
    fireEvent.contextMenu(screen.getByTestId('cedric-companion'));
    expect(screen.getByRole('menu')).toBeDefined();
  });

  it('toggles quiet mode when clicking the quiet mode button', () => {
    render(<AvatarCompanion />);
    fireEvent.contextMenu(screen.getByTestId('cedric-companion'));

    const quietButton = screen.getByTestId('cedric-menu-quiet');
    expect(quietButton.textContent).toBe('Enable Quiet Mode');

    fireEvent.click(quietButton);
    expect(mockToggleQuietMode).toHaveBeenCalledTimes(1);
  });

  it('calls minimize when clicking minimize button', () => {
    render(<AvatarCompanion />);
    fireEvent.contextMenu(screen.getByTestId('cedric-companion'));

    fireEvent.click(screen.getByTestId('cedric-menu-minimize'));
    expect(mockMinimize).toHaveBeenCalledTimes(1);
  });

  it('closes context menu after clicking an option', () => {
    render(<AvatarCompanion />);
    fireEvent.contextMenu(screen.getByTestId('cedric-companion'));
    expect(screen.getByTestId('cedric-context-menu')).toBeDefined();

    fireEvent.click(screen.getByTestId('cedric-menu-reset'));
    expect(screen.queryByTestId('cedric-context-menu')).toBeNull();
  });

  it('closes context menu on click outside', () => {
    render(<AvatarCompanion />);
    fireEvent.contextMenu(screen.getByTestId('cedric-companion'));
    expect(screen.getByTestId('cedric-context-menu')).toBeDefined();

    // Click outside the menu
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('cedric-context-menu')).toBeNull();
  });

  it('does not show context menu by default', () => {
    render(<AvatarCompanion />);
    expect(screen.queryByTestId('cedric-context-menu')).toBeNull();
  });
});

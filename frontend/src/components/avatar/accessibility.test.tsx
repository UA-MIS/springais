import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onKeyDown, ...props }: any) => {
      const {
        initial, animate, exit, transition, whileHover, whileTap, variants,
        ...rest
      } = props;
      return (
        <div onKeyDown={onKeyDown} {...rest}>
          {children}
        </div>
      );
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/test-page' }),
}));

const mockOpenCharacterSheet = vi.fn();
vi.mock('../../context/CedricContext', () => ({
  useCedric: () => ({
    state: {
      visibility: 'full',
      animationState: 'idle',
      isNewUser: false,
      quietMode: false,
      currentMessage: null,
      walkthroughActive: false,
      reducedMotion: false,
      characterSheetOpen: false,
    },
    equippedItems: {},
    restore: vi.fn(),
    minimize: vi.fn(),
    toggleQuietMode: vi.fn(),
    openCharacterSheet: mockOpenCharacterSheet,
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

vi.mock('./AvatarSprite', () => ({
  default: () => <div data-testid="avatar-sprite" />,
}));

import AvatarCompanion from './AvatarCompanion';
import SpeechBubble from './SpeechBubble';
import type { SpeechMessage } from '../../context/CedricContext';

describe('Accessibility (Story 8.5)', () => {
  describe('AvatarCompanion', () => {
    it('has role="complementary"', () => {
      render(<AvatarCompanion />);
      const companion = screen.getByTestId('cedric-companion');
      expect(companion.getAttribute('role')).toBe('complementary');
    });

    it('has aria-label "Cedric companion guide"', () => {
      render(<AvatarCompanion />);
      const companion = screen.getByTestId('cedric-companion');
      expect(companion.getAttribute('aria-label')).toBe('Cedric companion guide');
    });

    it('has tabIndex={0} for keyboard focus', () => {
      render(<AvatarCompanion />);
      const companion = screen.getByTestId('cedric-companion');
      expect(companion.getAttribute('tabindex')).toBe('0');
    });

    it('opens character sheet on Enter key', () => {
      render(<AvatarCompanion />);
      const companion = screen.getByTestId('cedric-companion');
      fireEvent.keyDown(companion, { key: 'Enter' });
      expect(mockOpenCharacterSheet).toHaveBeenCalledTimes(1);
    });
  });

  describe('SpeechBubble', () => {
    const testMessage: SpeechMessage = {
      id: 'test-msg',
      text: 'Hello adventurer!',
      priority: 'reaction',
      duration: 5000,
      typing: false,
      dismissible: true,
      suppressible: true,
      messageType: 'test',
    };

    it('has role="alert"', () => {
      render(
        <SpeechBubble
          message={testMessage}
          theme="game"
          onDismiss={vi.fn()}
          position="above"
        />
      );
      const bubble = screen.getByTestId('speech-bubble');
      expect(bubble.getAttribute('role')).toBe('alert');
    });

    it('has aria-live="polite"', () => {
      render(
        <SpeechBubble
          message={testMessage}
          theme="game"
          onDismiss={vi.fn()}
          position="above"
        />
      );
      const bubble = screen.getByTestId('speech-bubble');
      expect(bubble.getAttribute('aria-live')).toBe('polite');
    });

    it('dismiss button has aria-label "Dismiss message"', () => {
      render(
        <SpeechBubble
          message={testMessage}
          theme="game"
          onDismiss={vi.fn()}
          position="above"
        />
      );
      const dismiss = screen.getByTestId('dismiss-button');
      expect(dismiss.getAttribute('aria-label')).toBe('Dismiss message');
    });

    it('suppress button has aria-label "Stop showing this type of message"', () => {
      render(
        <SpeechBubble
          message={testMessage}
          theme="game"
          onDismiss={vi.fn()}
          position="above"
        />
      );
      const suppress = screen.getByTestId('suppress-button');
      expect(suppress.getAttribute('aria-label')).toBe('Stop showing this type of message');
    });
  });
});

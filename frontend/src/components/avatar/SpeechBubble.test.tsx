import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SpeechBubble from './SpeechBubble';
import type { SpeechMessage } from '../../context/CedricContext';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const {
        whileHover, whileTap, initial, animate, exit,
        transition, variants, ...rest
      } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock matchMedia for reduced motion detection
const mockMatchMedia = vi.fn().mockReturnValue({ matches: false });
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

function makeMessage(overrides: Partial<SpeechMessage> = {}): SpeechMessage {
  return {
    id: 'test-msg',
    text: 'Hello adventurer!',
    priority: 'reaction',
    duration: 8000,
    typing: false,
    dismissible: true,
    suppressible: false,
    ...overrides,
  };
}

describe('SpeechBubble', () => {
  const onDismiss = vi.fn();
  const onAction = vi.fn();
  const onSuppress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockMatchMedia.mockReturnValue({ matches: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Story 3.1: Theme Variants & Basic Rendering
  // -----------------------------------------------------------------------

  describe('Story 3.1: Theme Variants', () => {
    it('renders null when message is null', () => {
      const { container } = render(
        <SpeechBubble
          message={null}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(container.innerHTML).toBe('');
    });

    it('renders bubble with game theme styles', () => {
      render(
        <SpeechBubble
          message={makeMessage()}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      const bubble = screen.getByTestId('speech-bubble');
      expect(bubble).toBeDefined();
      // Game theme shows "Cedric:" label
      expect(screen.getByTestId('cedric-label')).toBeDefined();
      expect(screen.getByTestId('cedric-label').textContent).toBe('Cedric:');
    });

    it('renders bubble with light theme (no Cedric label)', () => {
      render(
        <SpeechBubble
          message={makeMessage()}
          theme="light"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.queryByTestId('cedric-label')).toBeNull();
    });

    it('renders bubble with dark theme (no Cedric label)', () => {
      render(
        <SpeechBubble
          message={makeMessage()}
          theme="dark"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.queryByTestId('cedric-label')).toBeNull();
    });

    it('max-width is 280px', () => {
      render(
        <SpeechBubble
          message={makeMessage()}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      const bubble = screen.getByTestId('speech-bubble');
      expect(bubble.style.maxWidth).toBe('280px');
    });

    it('shows dismiss button when message.dismissible is true', () => {
      render(
        <SpeechBubble
          message={makeMessage({ dismissible: true })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.getByTestId('dismiss-button')).toBeDefined();
    });

    it('hides dismiss button when message.dismissible is false', () => {
      render(
        <SpeechBubble
          message={makeMessage({ dismissible: false })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.queryByTestId('dismiss-button')).toBeNull();
    });

    it('calls onDismiss when dismiss button clicked', () => {
      render(
        <SpeechBubble
          message={makeMessage({ dismissible: true })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      fireEvent.click(screen.getByTestId('dismiss-button'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('B7 fix: does NOT call message.onDismiss directly (CedricContext handles it)', () => {
      const msgOnDismiss = vi.fn();
      render(
        <SpeechBubble
          message={makeMessage({ dismissible: true, onDismiss: msgOnDismiss })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      fireEvent.click(screen.getByTestId('dismiss-button'));
      // SpeechBubble only calls the onDismiss prop; CedricContext.dismissCurrentMessage
      // is responsible for calling message.onDismiss to avoid double-firing.
      expect(msgOnDismiss).not.toHaveBeenCalled();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('renders pointer pointing down when position is "above"', () => {
      render(
        <SpeechBubble
          message={makeMessage()}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.getByTestId('pointer-down')).toBeDefined();
      expect(screen.queryByTestId('pointer-up')).toBeNull();
    });

    it('renders pointer pointing up when position is "below"', () => {
      render(
        <SpeechBubble
          message={makeMessage()}
          theme="game"
          onDismiss={onDismiss}
          position="below"
        />,
      );
      expect(screen.getByTestId('pointer-up')).toBeDefined();
      expect(screen.queryByTestId('pointer-down')).toBeNull();
    });

    it('renders action buttons with primary and ghost variants', () => {
      const actions = [
        { id: 'start', label: 'Begin Quest', variant: 'primary' as const, onClick: vi.fn() },
        { id: 'skip', label: 'Maybe Later', variant: 'ghost' as const, onClick: vi.fn() },
      ];
      render(
        <SpeechBubble
          message={makeMessage({ actions })}
          theme="game"
          onDismiss={onDismiss}
          onAction={onAction}
          position="above"
        />,
      );
      expect(screen.getByTestId('action-start')).toBeDefined();
      expect(screen.getByTestId('action-skip')).toBeDefined();
      expect(screen.getByText('Begin Quest')).toBeDefined();
      expect(screen.getByText('Maybe Later')).toBeDefined();
    });

    it('limits to max 2 action buttons', () => {
      const actions = [
        { id: 'a1', label: 'One', variant: 'primary' as const, onClick: vi.fn() },
        { id: 'a2', label: 'Two', variant: 'ghost' as const, onClick: vi.fn() },
        { id: 'a3', label: 'Three', variant: 'ghost' as const, onClick: vi.fn() },
      ];
      render(
        <SpeechBubble
          message={makeMessage({ actions })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.getByText('One')).toBeDefined();
      expect(screen.getByText('Two')).toBeDefined();
      expect(screen.queryByText('Three')).toBeNull();
    });

    it('clicking action button calls onClick and onAction', () => {
      const actionClick = vi.fn();
      const actions = [
        { id: 'act', label: 'Do It', variant: 'primary' as const, onClick: actionClick },
      ];
      render(
        <SpeechBubble
          message={makeMessage({ actions })}
          theme="game"
          onDismiss={onDismiss}
          onAction={onAction}
          position="above"
        />,
      );
      fireEvent.click(screen.getByTestId('action-act'));
      expect(actionClick).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledWith('act');
    });

    it('shows "Don\'t show again" link when suppressible is true', () => {
      render(
        <SpeechBubble
          message={makeMessage({ suppressible: true, messageType: 'tip-matches' })}
          theme="game"
          onDismiss={onDismiss}
          onSuppress={onSuppress}
          position="above"
        />,
      );
      expect(screen.getByTestId('suppress-button')).toBeDefined();
    });

    it('hides "Don\'t show again" when suppressible is false', () => {
      render(
        <SpeechBubble
          message={makeMessage({ suppressible: false })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.queryByTestId('suppress-button')).toBeNull();
    });

    it('clicking suppress calls onSuppress with messageType and dismisses', () => {
      render(
        <SpeechBubble
          message={makeMessage({ suppressible: true, messageType: 'tip-matches' })}
          theme="game"
          onDismiss={onDismiss}
          onSuppress={onSuppress}
          position="above"
        />,
      );
      fireEvent.click(screen.getByTestId('suppress-button'));
      expect(onSuppress).toHaveBeenCalledWith('tip-matches');
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // Story 3.2: Typing Animation
  // -----------------------------------------------------------------------

  describe('Story 3.2: Typing Animation', () => {
    it('shows full text immediately when typing is false', () => {
      render(
        <SpeechBubble
          message={makeMessage({ typing: false, text: 'Full text here' })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.getByTestId('speech-text').textContent).toContain('Full text here');
    });

    it('types text character by character at 25ms default', () => {
      render(
        <SpeechBubble
          message={makeMessage({ typing: true, text: 'ABC' })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      const textEl = screen.getByTestId('speech-text');
      // Initially empty (no characters typed yet)
      expect(textEl.textContent).not.toContain('ABC');

      // After 1 tick (25ms) -> 'A'
      act(() => { vi.advanceTimersByTime(25); });
      expect(textEl.textContent).toContain('A');

      // After 2 ticks -> 'AB'
      act(() => { vi.advanceTimersByTime(25); });
      expect(textEl.textContent).toContain('AB');

      // After 3 ticks -> 'ABC'
      act(() => { vi.advanceTimersByTime(25); });
      expect(textEl.textContent).toContain('ABC');
    });

    it('shows blinking cursor during typing', () => {
      render(
        <SpeechBubble
          message={makeMessage({ typing: true, text: 'Hello' })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.getByTestId('typing-cursor')).toBeDefined();
    });

    it('removes cursor after typing completes', () => {
      render(
        <SpeechBubble
          message={makeMessage({ typing: true, text: 'Hi' })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      // Advance past all characters (2 chars at 25ms each)
      act(() => { vi.advanceTimersByTime(100); });
      expect(screen.queryByTestId('typing-cursor')).toBeNull();
    });

    it('action buttons fade in after typing completes', () => {
      const actions = [
        { id: 'go', label: 'Go', variant: 'primary' as const, onClick: vi.fn() },
      ];
      render(
        <SpeechBubble
          message={makeMessage({ typing: true, text: 'Hi', actions })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );

      const buttonsContainer = screen.getByTestId('action-buttons');
      // During typing, opacity should be 0
      expect(buttonsContainer.style.opacity).toBe('0');

      // After typing completes
      act(() => { vi.advanceTimersByTime(100); });
      expect(buttonsContainer.style.opacity).toBe('1');
    });

    it('click-to-skip typing shows full text', () => {
      render(
        <SpeechBubble
          message={makeMessage({ typing: true, text: 'Long message here' })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      // Partially typed
      act(() => { vi.advanceTimersByTime(50); });
      expect(screen.getByTestId('speech-text').textContent).not.toContain('Long message here');

      // Click to skip
      fireEvent.click(screen.getByTestId('speech-text'));
      expect(screen.getByTestId('speech-text').textContent).toContain('Long message here');
      expect(screen.queryByTestId('typing-cursor')).toBeNull();
    });

    it('respects custom typingSpeed', () => {
      render(
        <SpeechBubble
          message={makeMessage({ typing: true, text: 'AB', typingSpeed: 100 })}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      // At 50ms, nothing yet (100ms speed)
      act(() => { vi.advanceTimersByTime(50); });
      expect(screen.getByTestId('speech-text').textContent).not.toContain('A');

      // At 100ms, first char
      act(() => { vi.advanceTimersByTime(50); });
      expect(screen.getByTestId('speech-text').textContent).toContain('A');
    });
  });

  // -----------------------------------------------------------------------
  // Story 3.3: Framer Motion Animations (mocked)
  // -----------------------------------------------------------------------

  describe('Story 3.3: Framer Motion', () => {
    it('renders with animation wrapper data-testid', () => {
      render(
        <SpeechBubble
          message={makeMessage()}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.getByTestId('speech-bubble')).toBeDefined();
    });

    it('does not render when message transitions to null', () => {
      const { rerender, container } = render(
        <SpeechBubble
          message={makeMessage()}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(screen.getByTestId('speech-bubble')).toBeDefined();

      rerender(
        <SpeechBubble
          message={null}
          theme="game"
          onDismiss={onDismiss}
          position="above"
        />,
      );
      expect(container.innerHTML).toBe('');
    });
  });
});

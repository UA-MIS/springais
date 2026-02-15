import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpeechMessage } from '../../context/CedricContext';

// Re-export SpeechMessage for consumers
export type { SpeechMessage };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SpeechBubbleProps {
  message: SpeechMessage | null;
  theme: 'game' | 'light' | 'dark';
  onDismiss: () => void;
  onAction?: (actionId: string) => void;
  onSuppress?: (messageType: string) => void;
  position: 'above' | 'below';
}

// ---------------------------------------------------------------------------
// Theme styles (architecture Section 5)
// ---------------------------------------------------------------------------

const THEME_STYLES = {
  game: {
    background: 'linear-gradient(180deg, #F5E6C8 0%, #E8D5A8 100%)',
    border: '2px solid #8B6914',
    borderRadius: '8px',
    color: '#3D2B1F',
    shadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    pointerColor: '#E8D5A8',
    pointerBorderColor: '#8B6914',
  },
  light: {
    background: '#FFFFFF',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    color: '#1e293b',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    pointerColor: '#FFFFFF',
    pointerBorderColor: '#E0E0E0',
  },
  dark: {
    background: '#2D2D3D',
    border: '1px solid #404050',
    borderRadius: '12px',
    color: '#e8dcc4',
    shadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
    pointerColor: '#2D2D3D',
    pointerBorderColor: '#404050',
  },
} as const;

// ---------------------------------------------------------------------------
// Framer Motion variants (Story 3.3)
// ---------------------------------------------------------------------------

const bubbleVariants = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// ---------------------------------------------------------------------------
// Typing animation hook (Story 3.2)
// ---------------------------------------------------------------------------

function useTypingAnimation(
  text: string,
  enabled: boolean,
  speed: number,
  messageId: string,
) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const skipTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText(text);
    setIsTyping(false);
    setIsComplete(true);
  }, [text]);

  useEffect(() => {
    // Reset on message change
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled || !text) {
      setDisplayedText(text || '');
      setIsTyping(false);
      setIsComplete(true);
      return;
    }

    setIsTyping(true);

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        setIsComplete(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, enabled, speed, messageId]);

  return { displayedText, isTyping, isComplete, skipTyping };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpeechBubble({
  message,
  theme,
  onDismiss,
  onAction,
  onSuppress,
  position,
}: SpeechBubbleProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const variants = prefersReducedMotion ? reducedMotionVariants : bubbleVariants;

  return (
    <AnimatePresence mode="wait">
      {message && (
        <SpeechBubbleInner
          key={message.id}
          message={message}
          theme={theme}
          onDismiss={onDismiss}
          onAction={onAction}
          onSuppress={onSuppress}
          position={position}
          variants={variants}
        />
      )}
    </AnimatePresence>
  );
}

interface SpeechBubbleInnerProps extends Omit<SpeechBubbleProps, 'message'> {
  message: SpeechMessage;
  variants: typeof bubbleVariants | typeof reducedMotionVariants;
}

function SpeechBubbleInner({
  message,
  theme,
  onDismiss,
  onAction,
  onSuppress,
  position,
  variants,
}: SpeechBubbleInnerProps) {
  const styles = THEME_STYLES[theme];
  const typingSpeed = message.typingSpeed ?? 25;

  const { displayedText, isTyping, isComplete, skipTyping } =
    useTypingAnimation(message.text, message.typing, typingSpeed, message.id);

  // B7 fix: only call onDismiss() -- CedricContext.dismissCurrentMessage already
  // invokes message.onDismiss, so calling it here would fire the callback twice.
  const handleDismiss = () => {
    onDismiss();
  };

  const handleAction = (action: { id: string; onClick: () => void }) => {
    action.onClick();
    onAction?.(action.id);
  };

  const handleSuppress = () => {
    if (message.messageType) {
      onSuppress?.(message.messageType);
    }
    handleDismiss();
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative"
      role="alert"
      aria-live="polite"
      style={{ maxWidth: 280 }}
      data-testid="speech-bubble"
    >
      {/* Bubble body */}
      <div
        style={{
          background: styles.background,
          border: styles.border,
          borderRadius: styles.borderRadius,
          color: styles.color,
          boxShadow: styles.shadow,
          padding: '12px 16px',
          position: 'relative',
        }}
      >
        {/* Dismiss button */}
        {message.dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss message"
            data-testid="dismiss-button"
            style={{
              position: 'absolute',
              top: 4,
              right: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              color: styles.color,
              opacity: 0.6,
              padding: '2px 4px',
            }}
          >
            &times;
          </button>
        )}

        {/* "Cedric:" label - game theme only */}
        {theme === 'game' && (
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 4,
              color: '#8B6914',
            }}
            data-testid="cedric-label"
          >
            Cedric:
          </div>
        )}

        {/* Message text with optional typing */}
        <div
          onClick={isTyping ? skipTyping : undefined}
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            cursor: isTyping ? 'pointer' : 'default',
            fontFamily: theme === 'game' ? "system-ui, sans-serif" : 'inherit',
            paddingRight: message.dismissible ? 16 : 0,
          }}
          data-testid="speech-text"
        >
          {displayedText}
          {isTyping && (
            <span
              data-testid="typing-cursor"
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                backgroundColor: styles.color,
                marginLeft: 1,
                verticalAlign: 'text-bottom',
                animation: 'cedric-blink 0.8s steps(2) infinite',
              }}
            />
          )}
        </div>

        {/* Action buttons - fade in after typing completes */}
        {message.actions && message.actions.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 10,
              opacity: isComplete ? 1 : 0,
              transition: 'opacity 150ms ease-in',
            }}
            data-testid="action-buttons"
          >
            {message.actions.slice(0, 2).map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                data-testid={`action-${action.id}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  ...(action.variant === 'primary'
                    ? {
                        background:
                          theme === 'game'
                            ? 'linear-gradient(135deg, #8B6914 0%, #A07A1E 100%)'
                            : '#3b82f6',
                        color: theme === 'game' ? '#F5E6C8' : '#ffffff',
                      }
                    : {
                        background: 'transparent',
                        color: styles.color,
                        opacity: 0.8,
                        textDecoration: 'underline',
                      }),
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* "Don't show again" link */}
        {message.suppressible && isComplete && (
          <button
            onClick={handleSuppress}
            data-testid="suppress-button"
            aria-label="Stop showing this type of message"
            style={{
              display: 'block',
              marginTop: 8,
              background: 'none',
              border: 'none',
              fontSize: 11,
              cursor: 'pointer',
              color: styles.color,
              opacity: 0.5,
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Don&apos;t show again
          </button>
        )}
      </div>

      {/* Pointer triangle */}
      <Pointer position={position} styles={styles} />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pointer triangle (CSS border trick, 10px wide x 8px tall)
// ---------------------------------------------------------------------------

function Pointer({
  position,
  styles,
}: {
  position: 'above' | 'below';
  styles: (typeof THEME_STYLES)[keyof typeof THEME_STYLES];
}) {
  if (position === 'above') {
    // Pointer points DOWN (bubble is above avatar)
    return (
      <div
        data-testid="pointer-down"
        style={{
          position: 'absolute',
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: `8px solid ${styles.pointerColor}`,
        }}
      />
    );
  }

  // Pointer points UP (bubble is below avatar)
  return (
    <div
      data-testid="pointer-up"
      style={{
        position: 'absolute',
        top: -8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderBottom: `8px solid ${styles.pointerColor}`,
      }}
    />
  );
}

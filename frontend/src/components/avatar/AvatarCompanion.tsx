import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCedric } from '../../context/CedricContext';
import { useAdventureMode } from '../../context/AdventureModeContext';
import AvatarSprite from './AvatarSprite';
import SpeechBubble from './SpeechBubble';

export default function AvatarCompanion() {
  const { state, equippedItems, restore, minimize, toggleQuietMode, openCharacterSheet, dismissCurrentMessage, suppressMessageType } = useCedric();
  const { state: adventureState } = useAdventureMode();
  const location = useLocation();
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const companionRef = useRef<HTMLDivElement>(null);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenuOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  const isStorePage = location.pathname === '/store';

  // Story 7.4: Cursor tracking state
  const [cursorShift, setCursorShift] = useState({ x: 0, rotateY: 0 });
  const cursorTrackingEnabled =
    state.visibility === 'full' &&
    !state.walkthroughActive &&
    state.animationState === 'idle' &&
    !state.reducedMotion;

  useEffect(() => {
    if (!cursorTrackingEnabled || !companionRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!companionRef.current) return;
      const rect = companionRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 200) {
        setCursorShift({ x: 0, rotateY: 0 });
        return;
      }

      const shiftX = Math.max(-2, Math.min(2, dx / 100));
      const rotateY = Math.max(-3, Math.min(3, dx / 67));
      setCursorShift({ x: shiftX, rotateY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorTrackingEnabled]);

  // Reset cursor shift when tracking is disabled
  useEffect(() => {
    if (!cursorTrackingEnabled) {
      setCursorShift({ x: 0, rotateY: 0 });
    }
  }, [cursorTrackingEnabled]);

  // Cedric only appears in adventure mode (or for new users during onboarding intro)
  if (!adventureState.enabled && !state.isNewUser) {
    return null;
  }

  // Hidden visibility state
  if (state.visibility === 'hidden') {
    return null;
  }

  // Story 7.1: On store page, AvatarCompanion does not render the fixed sprite
  // (StorePage renders the 192px preview avatar directly via StoreAvatarPreview)
  if (isStorePage && state.visibility === 'full') {
    return null;
  }

  // Minimized state: small circular icon
  if (state.visibility === 'minimized') {
    return (
      <AnimatePresence>
        <motion.button
          key="cedric-minimized"
          data-testid="cedric-minimized"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={restore}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 35,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: adventureState.enabled
              ? '2px solid rgba(139, 90, 43, 0.8)'
              : '2px solid rgba(100, 100, 120, 0.8)',
            background: adventureState.enabled
              ? 'linear-gradient(135deg, #3c3228 0%, #2a2520 100%)'
              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            overflow: 'hidden',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          aria-label="Show Cedric"
        >
          {adventureState.enabled ? (
            <img
              src="/assets/cedric/sprites/idle.png"
              alt="Cedric"
              style={{
                width: '28px',
                height: '28px',
                imageRendering: 'pixelated',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          ) : (
            <img
              src="/assets/cedric/modern/compass-icon.png"
              alt="Guide"
              style={{
                width: '24px',
                height: '24px',
              }}
            />
          )}
        </motion.button>
      </AnimatePresence>
    );
  }

  // Full visibility state -- equippedItems comes from CedricContext (B3 fix: proper typing)
  const displayEquippedItems = adventureState.enabled ? equippedItems : {};

  const cursorTransform = cursorTrackingEnabled && (cursorShift.x !== 0 || cursorShift.rotateY !== 0)
    ? `translateX(${cursorShift.x}px) rotateY(${cursorShift.rotateY}deg)`
    : undefined;

  // A4 fix: determine speech bubble theme based on adventure mode
  const speechTheme = adventureState.enabled ? 'game' : 'dark';

  return (
    <>
      {/* A4: Speech bubble positioned above the avatar */}
      <div
        style={{
          position: 'fixed',
          bottom: '310px',
          right: '24px',
          zIndex: 36,
          pointerEvents: 'auto',
        }}
        data-testid="cedric-speech-area"
      >
        <SpeechBubble
          message={state.currentMessage}
          theme={speechTheme}
          onDismiss={dismissCurrentMessage}
          onSuppress={suppressMessageType}
          position="above"
        />
      </div>

      <AnimatePresence>
        <motion.div
          ref={companionRef}
          key="cedric-full"
          data-testid="cedric-companion"
          role="complementary"
          aria-label="Cedric companion guide"
          tabIndex={0}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onContextMenu={handleContextMenu}
          onClick={openCharacterSheet}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              openCharacterSheet();
            }
          }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 35,
            pointerEvents: 'auto',
            outline: 'none',
            cursor: 'pointer',
            transform: cursorTransform,
            transition: 'transform 0.3s ease',
          }}
        >
          <AvatarSprite
            size={192}
            equippedItems={displayEquippedItems}
            animationState={state.animationState}
            colorPalette={null}
            level={adventureState.level}
            showPedestal={true}
            showNameplate={true}
          />
        </motion.div>
      </AnimatePresence>

      {contextMenuOpen && (
        <div
          ref={contextMenuRef}
          data-testid="cedric-context-menu"
          role="menu"
          style={{
            position: 'fixed',
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            zIndex: 100,
            background: '#1e1e2e',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '4px 0',
            minWidth: '160px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <button
            role="menuitem"
            data-testid="cedric-menu-quiet"
            onClick={() => {
              toggleQuietMode();
              setContextMenuOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {state.quietMode ? 'Disable Quiet Mode' : 'Enable Quiet Mode'}
          </button>
          <button
            role="menuitem"
            data-testid="cedric-menu-minimize"
            onClick={() => {
              minimize();
              setContextMenuOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Minimize
          </button>
          <button
            role="menuitem"
            data-testid="cedric-menu-reset"
            onClick={() => {
              setContextMenuOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Reset Position
          </button>
        </div>
      )}
    </>
  );
}

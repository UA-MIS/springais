/**
 * CharacterSheet -- Slide-in panel showing avatar, equipment grid, and stats (Story 7.3).
 *
 * Opens on click from AvatarCompanion or StoreAvatarPreview.
 * Slides in from the right with Framer Motion.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarSprite from './AvatarSprite';
import { useCedric, AnimationState } from '../../context/CedricContext';
import { useAdventureMode } from '../../context/AdventureModeContext';
import type { CosmeticBrief } from '../../services/progressionService';

const EQUIPMENT_SLOTS = [
  'banner',
  'pet',
  'pedestal',
  'aura',
  'hairstyle',
  'emblem',
  'color_palette',
] as const;

function formatSlotName(slot: string): string {
  return slot.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CharacterSheet() {
  const { state, equippedItems: contextEquippedItems, closeCharacterSheet } = useCedric();
  const { state: adventureState } = useAdventureMode();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // B3 fix: use typed equippedItems from CedricContext instead of unsafe cast
  const equippedItems: Record<string, CosmeticBrief | null> = adventureState.enabled
    ? contextEquippedItems
    : {};

  // Close on Escape key
  useEffect(() => {
    if (!state.characterSheetOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCharacterSheet();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [state.characterSheetOpen, closeCharacterSheet]);

  // Close on click outside
  useEffect(() => {
    if (!state.characterSheetOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeCharacterSheet();
      }
    };
    // Delay listener to avoid immediately closing from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [state.characterSheetOpen, closeCharacterSheet]);

  // XP progress calculation
  const currentXP = adventureState.currentXP ?? 0;
  const xpToNext = adventureState.xpToNextLevel ?? 200;
  const xpPercent = xpToNext > 0 ? Math.min(100, Math.round((currentXP / xpToNext) * 100)) : 0;

  return (
    <AnimatePresence>
      {state.characterSheetOpen && (
        <motion.div
          ref={panelRef}
          data-testid="character-sheet"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50,
            width: '320px',
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)',
            border: '1px solid rgba(139, 90, 43, 0.5)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Close Button */}
          <button
            data-testid="character-sheet-close"
            onClick={closeCharacterSheet}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
            aria-label="Close character sheet"
          >
            &times;
          </button>

          {/* Avatar Preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <AvatarSprite
              size={192}
              equippedItems={equippedItems}
              animationState={AnimationState.Idle}
              colorPalette={null}
              level={adventureState.level ?? 1}
              showPedestal={true}
              showNameplate={true}
            />
          </div>

          {/* Stats Section */}
          <div
            data-testid="character-sheet-stats"
            style={{
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#ccc', fontSize: '14px' }}>Level</span>
              <span style={{ color: '#FFE600', fontWeight: 'bold', fontSize: '14px' }}>
                {adventureState.level ?? 1}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#ccc', fontSize: '14px' }}>Title</span>
              <span style={{ color: '#FFE600', fontWeight: 'bold', fontSize: '14px' }}>
                {adventureState.title ?? 'Apprentice'}
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#ccc', fontSize: '13px' }}>XP</span>
                <span style={{ color: '#aaa', fontSize: '13px' }}>
                  {currentXP} / {xpToNext}
                </span>
              </div>
              <div
                data-testid="character-sheet-xp-bar"
                style={{
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${xpPercent}%`,
                    background: 'linear-gradient(90deg, #D97706, #F59E0B)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#ccc', fontSize: '14px' }}>Gold</span>
              <span style={{ color: '#FFE600', fontWeight: 'bold', fontSize: '14px' }}>
                {adventureState.gold ?? 0}
              </span>
            </div>
          </div>

          {/* Equipment Grid (2x4) */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ color: '#ddd', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              Equipment
            </h3>
            <div
              data-testid="character-sheet-equipment-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              {EQUIPMENT_SLOTS.map((slot) => {
                const item = equippedItems[slot];
                return (
                  <div
                    key={slot}
                    data-testid={`equipment-slot-${slot}`}
                    style={{
                      padding: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ color: '#999', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {formatSlotName(slot)}
                    </div>
                    <div style={{ color: item ? '#FFE600' : '#555', fontSize: '12px', fontWeight: item ? 600 : 400 }}>
                      {item ? item.name : 'Empty'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visit Armory Link */}
          <button
            data-testid="character-sheet-visit-store"
            onClick={() => {
              closeCharacterSheet();
              navigate('/store');
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              background: 'rgba(255, 230, 0, 0.1)',
              border: '1px solid rgba(255, 230, 0, 0.3)',
              borderRadius: '8px',
              color: '#FFE600',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Visit Armory
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

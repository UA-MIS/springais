/**
 * StoreAvatarPreview -- Renders a 192px avatar in the store page preview area.
 *
 * Stories 7.1 + 7.2: Manages hover-to-preview state locally (not in CedricContext)
 * and merges temporary overrides with actual equipped items.
 */

import { motion, AnimatePresence } from 'framer-motion';
import AvatarSprite from './AvatarSprite';
import { useCedric } from '../../context/CedricContext';
import { useAdventureMode } from '../../context/AdventureModeContext';
import type { CosmeticBrief } from '../../services/progressionService';

export interface StoreAvatarPreviewProps {
  /** Temporary equipment overrides from hovering over store items */
  previewOverrides?: Partial<Record<string, CosmeticBrief | null>>;
}

export default function StoreAvatarPreview({ previewOverrides }: StoreAvatarPreviewProps) {
  const { state, equippedItems: contextEquippedItems, openCharacterSheet } = useCedric();
  const { state: adventureState } = useAdventureMode();

  if (!adventureState.enabled || state.visibility !== 'full') {
    return null;
  }

  // B3 fix: use typed equippedItems from CedricContext instead of unsafe cast
  const equippedItems = contextEquippedItems;

  // Merge preview overrides with actual equipped items (Story 7.2)
  const displayItems = previewOverrides && Object.keys(previewOverrides).length > 0
    ? { ...equippedItems, ...previewOverrides }
    : equippedItems;

  return (
    <AnimatePresence>
      <motion.div
        data-testid="store-avatar-preview"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={openCharacterSheet}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AvatarSprite
          size={192}
          equippedItems={displayItems}
          animationState={state.animationState}
          colorPalette={null}
          level={adventureState.level}
          showPedestal={true}
          showNameplate={true}
        />
      </motion.div>
    </AnimatePresence>
  );
}

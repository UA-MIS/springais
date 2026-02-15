import { AnimationState } from '../../context/CedricContext';
import type { CosmeticBrief } from '../../services/progressionService';
import Pedestal from './Pedestal';
import NamePlate from './NamePlate';
import './cedricAnimations.css';

interface AvatarSpriteProps {
  size: 64 | 128 | 192;
  equippedItems: Record<string, CosmeticBrief | null>;
  animationState: AnimationState;
  colorPalette: string | null;
  level: number;
  showPedestal?: boolean;
  showNameplate?: boolean;
  className?: string;
}

// Equipment layer z-order (back to front)
const EQUIPMENT_LAYERS: { slot: string; zIndex: number }[] = [
  { slot: 'banner', zIndex: 0 },
  // base body is always at zIndex 1
  { slot: 'boots', zIndex: 2 },
  { slot: 'armor', zIndex: 3 },
  { slot: 'cape', zIndex: 4 },
  { slot: 'hairstyle', zIndex: 5 },
  { slot: 'jewelry', zIndex: 6 },
  { slot: 'emblem', zIndex: 7 },
];

export function getEquipmentAssetPath(category: string, itemName: string): string {
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `/assets/cedric/equipment/${category}/${slug}.png`;
}

const COLOR_PALETTE_MAP: Record<string, string> = {
  'Earth Tones': 'rgba(139, 115, 85, 0.15)',
  'Royal Purple': 'rgba(128, 0, 128, 0.12)',
  'Crimson & Gold': 'rgba(180, 50, 20, 0.10)',
};

export default function AvatarSprite({
  size,
  equippedItems,
  animationState,
  colorPalette,
  level,
  showPedestal = true,
  showNameplate = true,
  className = '',
}: AvatarSpriteProps) {
  const animClass = `cedric-sprite--${animationState}`;
  const paletteColor = colorPalette ? COLOR_PALETTE_MAP[colorPalette] ?? null : null;

  return (
    <div className={`avatar-sprite-container ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Sprite layers container */}
      <div
        className={`cedric-sprite ${animClass}`}
        data-testid="avatar-sprite"
        data-animation={animationState}
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          imageRendering: 'pixelated',
        }}
      >
        {/* Banner layer (behind base) */}
        {equippedItems.banner && (
          <img
            src={getEquipmentAssetPath('banner', equippedItems.banner.name)}
            alt="banner"
            data-testid="equipment-layer-banner"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              imageRendering: 'pixelated',
              zIndex: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Base body sprite - always rendered */}
        <img
          src={`/assets/cedric/sprites/${animationState}.png`}
          alt="Cedric"
          data-testid="base-sprite"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
            objectFit: 'contain',
            objectPosition: 'bottom center',
            zIndex: 1,
          }}
          onError={(e) => {
            // Fallback to idle sprite if animation-specific one is missing
            const img = e.target as HTMLImageElement;
            if (!img.src.endsWith('/idle.png')) {
              img.src = '/assets/cedric/sprites/idle.png';
            }
          }}
        />

        {/* Equipment layers (boots through emblem) */}
        {EQUIPMENT_LAYERS.filter((l) => l.slot !== 'banner').map(({ slot, zIndex }) => {
          const item = equippedItems[slot];
          if (!item) return null;
          return (
            <img
              key={slot}
              src={getEquipmentAssetPath(slot, item.name)}
              alt={item.name}
              data-testid={`equipment-layer-${slot}`}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
                zIndex,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          );
        })}

        {/* Color palette overlay */}
        {paletteColor && (
          <div
            data-testid="color-palette-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: paletteColor,
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
              zIndex: 9,
            }}
          />
        )}
      </div>

      {/* Pedestal */}
      {showPedestal && <Pedestal level={level} size={size} />}

      {/* NamePlate */}
      {showNameplate && <NamePlate level={level} size={size} />}
    </div>
  );
}

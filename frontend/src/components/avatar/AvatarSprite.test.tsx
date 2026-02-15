import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AvatarSprite, { getEquipmentAssetPath } from './AvatarSprite';
import { AnimationState } from '../../context/CedricContext';

// Mock AdventureModeContext (needed by NamePlate/Pedestal subcomponents)
vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: {
      enabled: true,
      title: 'Apprentice',
      level: 1,
    },
  }),
}));

// Mock ThemeContext
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'game',
    isGame: true,
    isDark: false,
  }),
  themeColors: {
    game: { textPrimary: '#e8dcc4', textMuted: '#7a7060' },
    dark: { textPrimary: '#fff', textMuted: '#aaa' },
    light: { textPrimary: '#000', textMuted: '#666' },
  },
}));

describe('AvatarSprite', () => {
  const defaultProps = {
    size: 128 as const,
    equippedItems: {},
    animationState: AnimationState.Idle,
    colorPalette: null,
    level: 1,
  };

  it('renders base sprite', () => {
    render(<AvatarSprite {...defaultProps} />);
    const base = screen.getByTestId('base-sprite');
    expect(base).toBeInTheDocument();
    expect(base).toHaveAttribute('src', '/assets/cedric/sprites/idle.png');
  });

  it('applies image-rendering: pixelated to sprite container', () => {
    render(<AvatarSprite {...defaultProps} />);
    const container = screen.getByTestId('avatar-sprite');
    expect(container.style.imageRendering).toBe('pixelated');
  });

  it('renders at correct size variants', () => {
    const { rerender } = render(<AvatarSprite {...defaultProps} size={64} />);
    let container = screen.getByTestId('avatar-sprite');
    expect(container.style.width).toBe('64px');
    expect(container.style.height).toBe('64px');

    rerender(<AvatarSprite {...defaultProps} size={128} />);
    container = screen.getByTestId('avatar-sprite');
    expect(container.style.width).toBe('128px');

    rerender(<AvatarSprite {...defaultProps} size={192} />);
    container = screen.getByTestId('avatar-sprite');
    expect(container.style.width).toBe('192px');
  });

  it('applies animation state CSS class', () => {
    render(<AvatarSprite {...defaultProps} animationState={AnimationState.Thinking} />);
    const container = screen.getByTestId('avatar-sprite');
    expect(container.className).toContain('cedric-sprite--thinking');
  });

  it('renders equipment layers with correct z-order', () => {
    const equippedItems = {
      boots: { id: '1', name: 'Leather Boots', category: 'boots', rarity: 'common' },
      armor: { id: '2', name: 'Bronze Armor', category: 'armor', rarity: 'common' },
      emblem: { id: '3', name: 'Novice Emblem', category: 'emblem', rarity: 'common' },
    };
    render(<AvatarSprite {...defaultProps} equippedItems={equippedItems} />);

    const bootsLayer = screen.getByTestId('equipment-layer-boots');
    const armorLayer = screen.getByTestId('equipment-layer-armor');
    const emblemLayer = screen.getByTestId('equipment-layer-emblem');

    expect(bootsLayer.style.zIndex).toBe('2');
    expect(armorLayer.style.zIndex).toBe('3');
    expect(emblemLayer.style.zIndex).toBe('7');
  });

  it('hides broken equipment images on error', () => {
    const equippedItems = {
      boots: { id: '1', name: 'Missing Boots', category: 'boots', rarity: 'common' },
    };
    render(<AvatarSprite {...defaultProps} equippedItems={equippedItems} />);
    const bootsLayer = screen.getByTestId('equipment-layer-boots');
    fireEvent.error(bootsLayer);
    expect(bootsLayer.style.display).toBe('none');
  });

  it('renders color palette overlay when provided', () => {
    render(<AvatarSprite {...defaultProps} colorPalette="Earth Tones" />);
    const overlay = screen.getByTestId('color-palette-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay.style.mixBlendMode).toBe('multiply');
    expect(overlay.style.zIndex).toBe('9');
  });

  it('does not render color palette overlay when null', () => {
    render(<AvatarSprite {...defaultProps} colorPalette={null} />);
    expect(screen.queryByTestId('color-palette-overlay')).not.toBeInTheDocument();
  });

  it('shows pedestal by default', () => {
    render(<AvatarSprite {...defaultProps} />);
    expect(screen.getByTestId('pedestal')).toBeInTheDocument();
  });

  it('hides pedestal when showPedestal=false', () => {
    render(<AvatarSprite {...defaultProps} showPedestal={false} />);
    expect(screen.queryByTestId('pedestal')).not.toBeInTheDocument();
  });

  it('shows nameplate by default', () => {
    render(<AvatarSprite {...defaultProps} />);
    expect(screen.getByTestId('nameplate')).toBeInTheDocument();
  });

  it('hides nameplate when showNameplate=false', () => {
    render(<AvatarSprite {...defaultProps} showNameplate={false} />);
    expect(screen.queryByTestId('nameplate')).not.toBeInTheDocument();
  });
});

describe('getEquipmentAssetPath', () => {
  it('generates correct path for equipment items', () => {
    expect(getEquipmentAssetPath('armor', 'Iron Chainmail')).toBe(
      '/assets/cedric/equipment/armor/iron-chainmail.png'
    );
  });

  it('handles special characters in item names', () => {
    expect(getEquipmentAssetPath('cape', "Phoenix's Cloak")).toBe(
      '/assets/cedric/equipment/cape/phoenix-s-cloak.png'
    );
  });
});

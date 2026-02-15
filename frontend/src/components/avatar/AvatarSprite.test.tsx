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

  it('renders overlay equipment layers with correct z-order', () => {
    const equippedItems = {
      aura: { id: '1', name: 'Fire Aura', category: 'aura', rarity: 'common' },
      hairstyle: { id: '2', name: 'Viking Helmet', category: 'hairstyle', rarity: 'common' },
      emblem: { id: '3', name: 'Novice Emblem', category: 'emblem', rarity: 'common' },
    };
    render(<AvatarSprite {...defaultProps} equippedItems={equippedItems} />);

    const auraLayer = screen.getByTestId('equipment-layer-aura');
    const hairstyleLayer = screen.getByTestId('equipment-layer-hairstyle');
    const emblemLayer = screen.getByTestId('equipment-layer-emblem');

    expect(auraLayer.style.zIndex).toBe('0');
    expect(hairstyleLayer.style.zIndex).toBe('5');
    expect(emblemLayer.style.zIndex).toBe('7');
  });

  it('hides broken equipment images on error', () => {
    const equippedItems = {
      aura: { id: '1', name: 'Missing Aura', category: 'aura', rarity: 'common' },
    };
    render(<AvatarSprite {...defaultProps} equippedItems={equippedItems} />);
    const auraLayer = screen.getByTestId('equipment-layer-aura');
    fireEvent.error(auraLayer);
    expect(auraLayer.style.display).toBe('none');
  });

  it('renders pet outside sprite container', () => {
    const equippedItems = {
      pet: { id: '1', name: 'Tabby Cat', category: 'pet', rarity: 'common' },
    };
    render(<AvatarSprite {...defaultProps} equippedItems={equippedItems} />);
    const petImg = screen.getByTestId('equipment-pet');
    expect(petImg).toBeInTheDocument();
    expect(petImg.getAttribute('src')).toContain('pet/tabby-cat.png');
  });

  it('renders equipped pedestal sprite instead of CSS pedestal', () => {
    const equippedItems = {
      pedestal: { id: '1', name: 'Crystal Pedestal', category: 'pedestal', rarity: 'uncommon' },
    };
    render(<AvatarSprite {...defaultProps} equippedItems={equippedItems} />);
    const pedestalImg = screen.getByTestId('equipment-pedestal');
    expect(pedestalImg).toBeInTheDocument();
    expect(pedestalImg.getAttribute('src')).toContain('pedestal/crystal-pedestal.png');
    // CSS pedestal should not render
    expect(screen.queryByTestId('pedestal')).not.toBeInTheDocument();
  });

  it('renders CSS pedestal when no pedestal item equipped', () => {
    render(<AvatarSprite {...defaultProps} />);
    expect(screen.getByTestId('pedestal')).toBeInTheDocument();
    expect(screen.queryByTestId('equipment-pedestal')).not.toBeInTheDocument();
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
    expect(getEquipmentAssetPath('pet', 'Tabby Cat')).toBe(
      '/assets/cedric/equipment/pet/tabby-cat.png'
    );
  });

  it('handles special characters in item names', () => {
    expect(getEquipmentAssetPath('aura', "Phoenix's Flame")).toBe(
      '/assets/cedric/equipment/aura/phoenix-s-flame.png'
    );
  });
});

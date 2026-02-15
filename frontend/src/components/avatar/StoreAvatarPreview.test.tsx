import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StoreAvatarPreview from './StoreAvatarPreview';

let mockCedricState: Record<string, unknown> = {};
let mockEquippedItems: Record<string, unknown> = {};
const mockOpenCharacterSheet = vi.fn();

vi.mock('../../context/CedricContext', () => ({
  useCedric: () => ({
    state: mockCedricState,
    equippedItems: mockEquippedItems,
    openCharacterSheet: mockOpenCharacterSheet,
  }),
  AnimationState: {
    Idle: 'idle',
  },
}));

let mockAdventureState: Record<string, unknown> = {};
vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: mockAdventureState,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'game',
    isGame: true,
    isDark: false,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('StoreAvatarPreview (Stories 7.1, 7.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCedricState = {
      visibility: 'full',
      animationState: 'idle',
    };
    mockEquippedItems = {
      armor: { id: 'a1', name: 'Iron Chainmail', category: 'armor', rarity: 'common' },
      boots: null,
    };
    mockAdventureState = {
      enabled: true,
      level: 5,
    };
  });

  it('renders avatar at 192px in the store preview area', () => {
    render(<StoreAvatarPreview />);
    const preview = screen.getByTestId('store-avatar-preview');
    expect(preview).toBeTruthy();
    const sprite = screen.getByTestId('avatar-sprite');
    expect(sprite.style.width).toBe('192px');
    expect(sprite.style.height).toBe('192px');
  });

  it('shows equipped items from progression state', () => {
    render(<StoreAvatarPreview />);
    expect(screen.getByTestId('equipment-layer-armor')).toBeTruthy();
  });

  it('shows pedestal and nameplate', () => {
    render(<StoreAvatarPreview />);
    expect(screen.getByTestId('pedestal')).toBeTruthy();
    expect(screen.getByTestId('nameplate')).toBeTruthy();
  });

  it('returns null when adventure mode is disabled', () => {
    mockAdventureState.enabled = false;
    const { container } = render(<StoreAvatarPreview />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when visibility is not full', () => {
    mockCedricState.visibility = 'minimized';
    const { container } = render(<StoreAvatarPreview />);
    expect(container.innerHTML).toBe('');
  });

  // Story 7.2: Hover-to-Preview
  it('temporarily swaps equipment layer when previewOverrides are provided', () => {
    render(
      <StoreAvatarPreview
        previewOverrides={{
          armor: { id: 'preview-1', name: 'Golden Armor', category: 'armor', rarity: 'legendary' },
        }}
      />
    );
    // The armor layer should show the preview item instead of Iron Chainmail
    const armorLayer = screen.getByTestId('equipment-layer-armor');
    expect(armorLayer.getAttribute('src')).toContain('golden-armor');
  });

  it('keeps other equipped items visible during preview', () => {
    mockEquippedItems = {
      armor: { id: 'a1', name: 'Iron Chainmail', category: 'armor', rarity: 'common' },
      cape: { id: 'c1', name: 'Silver Cloak', category: 'cape', rarity: 'rare' },
    };

    render(
      <StoreAvatarPreview
        previewOverrides={{
          armor: { id: 'preview-1', name: 'Golden Armor', category: 'armor', rarity: 'legendary' },
        }}
      />
    );

    // Cape should still be visible
    expect(screen.getByTestId('equipment-layer-cape')).toBeTruthy();
    // Armor should show preview
    const armorLayer = screen.getByTestId('equipment-layer-armor');
    expect(armorLayer.getAttribute('src')).toContain('golden-armor');
  });

  it('reverts to actual equipped items when previewOverrides are cleared', () => {
    const { rerender } = render(
      <StoreAvatarPreview
        previewOverrides={{
          armor: { id: 'preview-1', name: 'Golden Armor', category: 'armor', rarity: 'legendary' },
        }}
      />
    );

    // Preview active
    let armorLayer = screen.getByTestId('equipment-layer-armor');
    expect(armorLayer.getAttribute('src')).toContain('golden-armor');

    // Clear preview
    rerender(<StoreAvatarPreview previewOverrides={{}} />);
    armorLayer = screen.getByTestId('equipment-layer-armor');
    expect(armorLayer.getAttribute('src')).toContain('iron-chainmail');
  });

  it('handles missing asset gracefully (onError hides img)', () => {
    render(
      <StoreAvatarPreview
        previewOverrides={{
          boots: { id: 'missing-1', name: 'Nonexistent Boots', category: 'boots', rarity: 'common' },
        }}
      />
    );

    const bootsLayer = screen.getByTestId('equipment-layer-boots');
    // Simulate image load error
    bootsLayer.dispatchEvent(new Event('error'));
    expect((bootsLayer as HTMLImageElement).style.display).toBe('none');
  });
});

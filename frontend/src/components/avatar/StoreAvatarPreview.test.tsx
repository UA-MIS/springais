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
      aura: { id: 'a1', name: 'Fire Aura', category: 'aura', rarity: 'common' },
      pet: null,
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
    expect(screen.getByTestId('equipment-layer-aura')).toBeTruthy();
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
          aura: { id: 'preview-1', name: 'Shadow Aura', category: 'aura', rarity: 'uncommon' },
        }}
      />
    );
    // The aura layer should show the preview item instead of Fire Aura
    const auraLayer = screen.getByTestId('equipment-layer-aura');
    expect(auraLayer.getAttribute('src')).toContain('shadow-aura');
  });

  it('keeps other equipped items visible during preview', () => {
    mockEquippedItems = {
      aura: { id: 'a1', name: 'Fire Aura', category: 'aura', rarity: 'common' },
      hairstyle: { id: 'h1', name: 'Viking Helmet', category: 'hairstyle', rarity: 'common' },
    };

    render(
      <StoreAvatarPreview
        previewOverrides={{
          aura: { id: 'preview-1', name: 'Shadow Aura', category: 'aura', rarity: 'uncommon' },
        }}
      />
    );

    // Hairstyle should still be visible
    expect(screen.getByTestId('equipment-layer-hairstyle')).toBeTruthy();
    // Aura should show preview
    const auraLayer = screen.getByTestId('equipment-layer-aura');
    expect(auraLayer.getAttribute('src')).toContain('shadow-aura');
  });

  it('reverts to actual equipped items when previewOverrides are cleared', () => {
    const { rerender } = render(
      <StoreAvatarPreview
        previewOverrides={{
          aura: { id: 'preview-1', name: 'Shadow Aura', category: 'aura', rarity: 'uncommon' },
        }}
      />
    );

    // Preview active
    let auraLayer = screen.getByTestId('equipment-layer-aura');
    expect(auraLayer.getAttribute('src')).toContain('shadow-aura');

    // Clear preview
    rerender(<StoreAvatarPreview previewOverrides={{}} />);
    auraLayer = screen.getByTestId('equipment-layer-aura');
    expect(auraLayer.getAttribute('src')).toContain('fire-aura');
  });

  it('handles missing asset gracefully (onError hides img)', () => {
    render(
      <StoreAvatarPreview
        previewOverrides={{
          pet: { id: 'missing-1', name: 'Nonexistent Pet', category: 'pet', rarity: 'common' },
        }}
      />
    );

    const petElement = screen.getByTestId('equipment-pet');
    // Simulate image load error
    petElement.dispatchEvent(new Event('error'));
    expect((petElement as HTMLImageElement).style.display).toBe('none');
  });
});

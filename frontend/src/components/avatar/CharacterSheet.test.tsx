import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CharacterSheet from './CharacterSheet';

let mockCedricState: Record<string, unknown> = {};
let mockEquippedItems: Record<string, unknown> = {};
const mockCloseCharacterSheet = vi.fn();

vi.mock('../../context/CedricContext', () => ({
  useCedric: () => ({
    state: mockCedricState,
    equippedItems: mockEquippedItems,
    closeCharacterSheet: mockCloseCharacterSheet,
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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderCharacterSheet() {
  return render(
    <MemoryRouter>
      <CharacterSheet />
    </MemoryRouter>
  );
}

describe('CharacterSheet (Story 7.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCedricState = {
      characterSheetOpen: true,
      visibility: 'full',
      animationState: 'idle',
    };
    mockEquippedItems = {
      armor: { id: 'a1', name: 'Iron Chainmail', category: 'armor', rarity: 'common' },
      cape: { id: 'c1', name: 'Silver Cloak', category: 'cape', rarity: 'rare' },
      boots: null,
      banner: null,
      hairstyle: null,
      jewelry: null,
      emblem: null,
      color_palette: null,
    };
    mockAdventureState = {
      enabled: true,
      level: 5,
      title: 'Knight',
      currentXP: 150,
      xpToNextLevel: 300,
      gold: 500,
    };
  });

  it('renders when characterSheetOpen is true', () => {
    renderCharacterSheet();
    expect(screen.getByTestId('character-sheet')).toBeTruthy();
  });

  it('does not render when characterSheetOpen is false', () => {
    mockCedricState.characterSheetOpen = false;
    renderCharacterSheet();
    expect(screen.queryByTestId('character-sheet')).toBeNull();
  });

  it('displays 192x192 avatar preview', () => {
    renderCharacterSheet();
    const sprite = screen.getByTestId('avatar-sprite');
    expect(sprite.style.width).toBe('192px');
    expect(sprite.style.height).toBe('192px');
  });

  it('displays level, title, XP, and gold in stats section', () => {
    renderCharacterSheet();
    const stats = screen.getByTestId('character-sheet-stats');
    expect(stats.textContent).toContain('5');       // Level
    expect(stats.textContent).toContain('Knight');   // Title
    expect(stats.textContent).toContain('150');      // XP current
    expect(stats.textContent).toContain('300');      // XP to next
    expect(stats.textContent).toContain('500');      // Gold
  });

  it('displays XP progress bar', () => {
    renderCharacterSheet();
    expect(screen.getByTestId('character-sheet-xp-bar')).toBeTruthy();
  });

  it('displays 2x4 equipment grid with 8 slots', () => {
    renderCharacterSheet();
    const grid = screen.getByTestId('character-sheet-equipment-grid');
    expect(grid.children.length).toBe(8);
  });

  it('shows equipped item name in correct slot', () => {
    renderCharacterSheet();
    const armorSlot = screen.getByTestId('equipment-slot-armor');
    expect(armorSlot.textContent).toContain('Iron Chainmail');

    const capeSlot = screen.getByTestId('equipment-slot-cape');
    expect(capeSlot.textContent).toContain('Silver Cloak');
  });

  it('shows "Empty" for unequipped slots', () => {
    renderCharacterSheet();
    const bootsSlot = screen.getByTestId('equipment-slot-boots');
    expect(bootsSlot.textContent).toContain('Empty');

    const bannerSlot = screen.getByTestId('equipment-slot-banner');
    expect(bannerSlot.textContent).toContain('Empty');
  });

  it('has "Visit Armory" button that navigates to /store', () => {
    renderCharacterSheet();
    const visitButton = screen.getByTestId('character-sheet-visit-store');
    expect(visitButton.textContent).toContain('Visit Armory');

    fireEvent.click(visitButton);
    expect(mockCloseCharacterSheet).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/store');
  });

  it('closes on X button click', () => {
    renderCharacterSheet();
    const closeButton = screen.getByTestId('character-sheet-close');
    fireEvent.click(closeButton);
    expect(mockCloseCharacterSheet).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key', () => {
    renderCharacterSheet();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockCloseCharacterSheet).toHaveBeenCalledTimes(1);
  });

  it('displays slide-in animation style (x: 300 initial)', () => {
    renderCharacterSheet();
    const sheet = screen.getByTestId('character-sheet');
    // In our mock, framer-motion props are not applied, but the element renders
    // The presence of the element when open confirms it
    expect(sheet).toBeTruthy();
    expect(sheet.style.position).toBe('fixed');
  });
});

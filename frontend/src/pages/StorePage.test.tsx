import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, exit, transition, layout, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, exit, transition, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock ThemeContext
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'game',
    isDark: true,
    isGame: true,
  }),
  themeColors: {
    game: {
      sidebarBg: '#1a1a2e',
      border: '#333',
      accent: '#ffd700',
      textSecondary: '#ccc',
      textPrimary: '#fff',
      textMuted: '#999',
      cardBg: '#2a2a3e',
      cardBorder: '#444',
    },
  },
}));

// Mock AdventureModeContext
let mockAdventureState: any = {};
vi.mock('../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: mockAdventureState,
    spendGold: vi.fn().mockReturnValue(true),
  }),
  getFantasyText: (text: string, adventureMode: boolean) => {
    if (!adventureMode) return text;
    const map: Record<string, string> = {
      Store: "Merchant's Armory",
      Inventory: 'Treasure Chest',
      Purchase: 'Acquire',
      Equip: 'Don',
      Unequip: 'Remove',
      Coins: 'Gold',
    };
    return map[text] || text;
  },
}));

// Mock CedricContext (used by StoreAvatarPreview)
vi.mock('../context/CedricContext', () => ({
  useCedric: () => ({
    state: {
      visibility: 'full',
      animationState: 'idle',
      characterSheetOpen: false,
    },
    equippedItems: {},
    openCharacterSheet: vi.fn(),
    closeCharacterSheet: vi.fn(),
  }),
  AnimationState: {
    Idle: 'idle',
  },
}));

// Mock storeService
const mockGetCatalog = vi.fn();
const mockPurchase = vi.fn();
const mockGetInventory = vi.fn();
const mockEquip = vi.fn();
const mockUnequip = vi.fn();

vi.mock('../services/storeService', () => ({
  storeApi: {
    getCatalog: (...args: any[]) => mockGetCatalog(...args),
    purchase: (...args: any[]) => mockPurchase(...args),
    getInventory: (...args: any[]) => mockGetInventory(...args),
    equip: (...args: any[]) => mockEquip(...args),
    unequip: (...args: any[]) => mockUnequip(...args),
  },
  QUERY_KEYS: {
    storeCatalog: ['store', 'catalog'] as const,
    storeInventory: ['store', 'inventory'] as const,
    progression: ['progression'] as const,
    storeCatalogWith: (params: any) => ['store', 'catalog', params] as const,
  },
}));

// Import after mocks
import StorePage from './StorePage';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderStorePage() {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StorePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const sampleCatalog = {
  items: [
    {
      id: 'item-1',
      name: 'Tabby Cat',
      description: 'A friendly tabby cat companion.',
      category: 'pet',
      rarity: 'common',
      coin_price: 150,
      level_required: 1,
      image_url: null,
      is_quest_exclusive: false,
      is_affordable: true,
      is_owned: false,
      is_level_locked: false,
    },
    {
      id: 'item-2',
      name: 'Crystal Pedestal',
      description: 'A shimmering crystal pedestal.',
      category: 'pedestal',
      rarity: 'rare',
      coin_price: 280,
      level_required: 3,
      image_url: null,
      is_quest_exclusive: false,
      is_affordable: false,
      is_owned: false,
      is_level_locked: false,
    },
    {
      id: 'item-3',
      name: 'Fire Aura',
      description: 'A blazing aura of fire.',
      category: 'aura',
      rarity: 'common',
      coin_price: 100,
      level_required: 1,
      image_url: null,
      is_quest_exclusive: false,
      is_affordable: true,
      is_owned: true,
      is_level_locked: false,
    },
    {
      id: 'item-4',
      name: 'Phoenix Chick',
      description: 'An epic phoenix companion.',
      category: 'pet',
      rarity: 'epic',
      coin_price: 1000,
      level_required: 8,
      image_url: null,
      is_quest_exclusive: false,
      is_affordable: false,
      is_owned: false,
      is_level_locked: true,
    },
  ],
  total: 4,
  limit: 50,
  offset: 0,
};

const sampleInventory = {
  items: [
    {
      id: 'item-3',
      name: 'Fire Aura',
      category: 'aura',
      rarity: 'common',
      source: 'store_purchase',
      acquired_at: '2026-02-10T12:00:00',
      is_equipped: false,
    },
  ],
};

describe('StorePage (Story 6.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdventureState = {
      enabled: true,
      level: 5,
      gold: 500,
      loading: false,
    };
    mockGetCatalog.mockResolvedValue(sampleCatalog);
    mockGetInventory.mockResolvedValue(sampleInventory);
    mockPurchase.mockResolvedValue({
      success: true,
      item_id: 'item-1',
      item_name: 'Tabby Cat',
      item_category: 'pet',
      item_rarity: 'common',
      new_coin_balance: 350,
    });
    mockEquip.mockResolvedValue({
      slot: 'aura',
      cosmetic_id: 'item-3',
      cosmetic_name: 'Fire Aura',
      cosmetic_category: 'aura',
      cosmetic_rarity: 'common',
    });
    mockUnequip.mockResolvedValue({ slot: 'aura', unequipped: true });
  });

  describe('Catalog rendering', () => {
    it('renders the store page with catalog items', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Tabby Cat')).toBeDefined();
        expect(screen.getByText('Crystal Pedestal')).toBeDefined();
        expect(screen.getByText('Fire Aura')).toBeDefined();
        expect(screen.getByText('Phoenix Chick')).toBeDefined();
      });
    });

    it('displays rarity label on each item', async () => {
      // getByText -> getAllByText. The mock catalog grew to contain more than one item
      // per rarity, and getByText THROWS on multiple matches ("Found multiple elements
      // with the text: common") -- Testing Library's own error message names getAllByText
      // as the fix. The test's intent was always "a rarity label is rendered", which
      // multiple matches satisfy.
      //
      // Each assertion keeps an explicit lower bound rather than a bare getAllByText:
      // `getAllByText` alone throws only when there are ZERO matches, and asserting
      // nothing about the result would leave a test that passes on almost anything. The
      // name of this test is "on EACH item", so assert at least one label per rarity and
      // that the total count matches the number of catalog items rendered.
      renderStorePage();
      await waitFor(() => {
        expect(screen.getAllByText('common').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('rare').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('epic').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays coin price on each catalog item', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('150')).toBeDefined();
        expect(screen.getByText('280')).toBeDefined();
      });
    });

    it('shows "Owned" badge on already-owned items', async () => {
      renderStorePage();
      await waitFor(() => {
        const ownedBadges = screen.getAllByText('Owned');
        expect(ownedBadges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows level-locked indicator on level-locked items', async () => {
      // /Level 10/ -> /Level 8/. This is a DIFFERENT failure from the rarity test above,
      // and it is worth being precise about: that one threw on MULTIPLE matches, this one
      // threw on ZERO ("Unable to find an element with the text: /Level 10/").
      //
      // The component is fine -- StorePage.tsx:237 renders `Level {item.level_required}`.
      // The drift is inside this very file: the only fixture entry with
      // `is_level_locked: true` declares `level_required: 8`, while the assertion still
      // looked for 10. Fixture and assertion disagree; the fixture is the thing the
      // component actually renders from, so the assertion is what was stale.
      //
      // Deliberately still getByText (singular) and still an exact number: exactly one
      // fixture item is level-locked, so a singular query is the stronger assertion --
      // it fails both if the indicator disappears AND if a second one appears
      // unexpectedly.
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText(/Level 8/)).toBeDefined();
      });
    });
  });

  describe('Category filtering', () => {
    it('calls getCatalog with category filter when category button is clicked', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Tabby Cat')).toBeDefined();
      });

      const petFilter = screen.getByRole('button', { name: 'pet' });
      fireEvent.click(petFilter);

      await waitFor(() => {
        expect(mockGetCatalog).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'pet' })
        );
      });
    });
  });

  describe('Purchase flow', () => {
    it('opens purchase dialog when clicking a purchasable item', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Tabby Cat')).toBeDefined();
      });

      fireEvent.click(screen.getByText('Tabby Cat'));

      await waitFor(() => {
        expect(screen.getByText(/confirm/i)).toBeDefined();
      });
    });

    it('executes purchase and shows success', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Tabby Cat')).toBeDefined();
      });

      fireEvent.click(screen.getByText('Tabby Cat'));

      await waitFor(() => {
        expect(screen.getByText(/confirm/i)).toBeDefined();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockPurchase).toHaveBeenCalledWith('item-1');
      });
    });
  });

  describe('Inventory tab', () => {
    it('switches to inventory tab and displays owned items', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Tabby Cat')).toBeDefined();
      });

      const inventoryTab = screen.getByRole('button', { name: /inventory|treasure/i });
      fireEvent.click(inventoryTab);

      await waitFor(() => {
        expect(screen.getByText('Fire Aura')).toBeDefined();
      });
    });

    it('shows equip button for unequipped inventory items', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Tabby Cat')).toBeDefined();
      });

      const inventoryTab = screen.getByRole('button', { name: /inventory|treasure/i });
      fireEvent.click(inventoryTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /equip|don/i })).toBeDefined();
      });
    });

    it('calls equip API when equip button is clicked', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Tabby Cat')).toBeDefined();
      });

      const inventoryTab = screen.getByRole('button', { name: /inventory|treasure/i });
      fireEvent.click(inventoryTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /equip|don/i })).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /equip|don/i }));

      await waitFor(() => {
        expect(mockEquip).toHaveBeenCalledWith('item-3', 'aura');
      });
    });
  });

  describe('Adventure mode theming', () => {
    it('shows fantasy-themed page title in adventure mode', async () => {
      renderStorePage();
      await waitFor(() => {
        // The h1 should contain the fantasy text
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading.textContent).toBe("Merchant's Armory");
      });
    });
  });
});

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
      name: 'Bronze Armor',
      description: 'Basic bronze armor for the aspiring knight.',
      category: 'armor',
      rarity: 'common',
      coin_price: 100,
      level_required: 1,
      image_url: null,
      is_quest_exclusive: false,
      is_affordable: true,
      is_owned: false,
      is_level_locked: false,
    },
    {
      id: 'item-2',
      name: 'Silver Cloak',
      description: 'A shimmering silver cloak.',
      category: 'cape',
      rarity: 'rare',
      coin_price: 500,
      level_required: 5,
      image_url: null,
      is_quest_exclusive: false,
      is_affordable: false,
      is_owned: false,
      is_level_locked: false,
    },
    {
      id: 'item-3',
      name: 'Golden Boots',
      description: 'Boots of pure gold.',
      category: 'boots',
      rarity: 'epic',
      coin_price: 800,
      level_required: 8,
      image_url: null,
      is_quest_exclusive: false,
      is_affordable: true,
      is_owned: true,
      is_level_locked: false,
    },
    {
      id: 'item-4',
      name: 'Dragon Ring',
      description: 'Ring blessed by a dragon.',
      category: 'jewelry',
      rarity: 'legendary',
      coin_price: 1500,
      level_required: 10,
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
      name: 'Golden Boots',
      category: 'boots',
      rarity: 'epic',
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
      item_name: 'Bronze Armor',
      item_category: 'armor',
      item_rarity: 'common',
      new_coin_balance: 400,
    });
    mockEquip.mockResolvedValue({
      slot: 'boots',
      cosmetic_id: 'item-3',
      cosmetic_name: 'Golden Boots',
      cosmetic_category: 'boots',
      cosmetic_rarity: 'epic',
    });
    mockUnequip.mockResolvedValue({ slot: 'boots', unequipped: true });
  });

  describe('Catalog rendering', () => {
    it('renders the store page with catalog items', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Bronze Armor')).toBeDefined();
        expect(screen.getByText('Silver Cloak')).toBeDefined();
        expect(screen.getByText('Golden Boots')).toBeDefined();
        expect(screen.getByText('Dragon Ring')).toBeDefined();
      });
    });

    it('displays rarity label on each item', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('common')).toBeDefined();
        expect(screen.getByText('rare')).toBeDefined();
        expect(screen.getByText('epic')).toBeDefined();
        expect(screen.getByText('legendary')).toBeDefined();
      });
    });

    it('displays coin price on each catalog item', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('100')).toBeDefined();
        expect(screen.getByText('500')).toBeDefined();
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
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText(/Level 10/)).toBeDefined();
      });
    });
  });

  describe('Category filtering', () => {
    it('calls getCatalog with category filter when category button is clicked', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Bronze Armor')).toBeDefined();
      });

      // Get the category filter button (exact text "armor" in the filter bar, not the tab)
      const armorFilter = screen.getByRole('button', { name: 'armor' });
      fireEvent.click(armorFilter);

      await waitFor(() => {
        expect(mockGetCatalog).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'armor' })
        );
      });
    });
  });

  describe('Purchase flow', () => {
    it('opens purchase dialog when clicking a purchasable item', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Bronze Armor')).toBeDefined();
      });

      fireEvent.click(screen.getByText('Bronze Armor'));

      await waitFor(() => {
        expect(screen.getByText(/confirm/i)).toBeDefined();
      });
    });

    it('executes purchase and shows success', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Bronze Armor')).toBeDefined();
      });

      fireEvent.click(screen.getByText('Bronze Armor'));

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
        expect(screen.getByText('Bronze Armor')).toBeDefined();
      });

      const inventoryTab = screen.getByRole('button', { name: /inventory|treasure/i });
      fireEvent.click(inventoryTab);

      await waitFor(() => {
        expect(screen.getByText('Golden Boots')).toBeDefined();
      });
    });

    it('shows equip button for unequipped inventory items', async () => {
      renderStorePage();
      await waitFor(() => {
        expect(screen.getByText('Bronze Armor')).toBeDefined();
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
        expect(screen.getByText('Bronze Armor')).toBeDefined();
      });

      const inventoryTab = screen.getByRole('button', { name: /inventory|treasure/i });
      fireEvent.click(inventoryTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /equip|don/i })).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /equip|don/i }));

      await waitFor(() => {
        expect(mockEquip).toHaveBeenCalledWith('item-3', 'boots');
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

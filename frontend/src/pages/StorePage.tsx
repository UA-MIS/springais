import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme, themeColors } from '../context/ThemeContext';
import { useAdventureMode, getFantasyText } from '../context/AdventureModeContext';
import { storeApi, QUERY_KEYS } from '../services/storeService';
import type { CatalogItem, InventoryItem } from '../services/storeService';
import type { CosmeticBrief } from '../services/progressionService';
import StoreAvatarPreview from '../components/avatar/StoreAvatarPreview';

const CATEGORIES = ['all', 'armor', 'cape', 'jewelry', 'boots', 'hairstyle', 'color_palette', 'banner', 'emblem'];

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export default function StorePage() {
  const { isDark, isGame } = useTheme();
  const colors = themeColors[isGame ? 'game' : isDark ? 'dark' : 'light'];
  const { state } = useAdventureMode();
  const adventureEnabled = state.enabled;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'catalog' | 'inventory'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  // Story 7.2: Hover-to-preview state (managed locally, not in CedricContext)
  const [previewOverrides, setPreviewOverrides] = useState<Partial<Record<string, CosmeticBrief | null>>>({});

  const handleItemHover = useCallback((item: CatalogItem) => {
    setPreviewOverrides({
      [item.category]: {
        id: item.id,
        name: item.name,
        category: item.category,
        rarity: item.rarity,
      },
    });
  }, []);

  const handleItemHoverEnd = useCallback(() => {
    setPreviewOverrides({});
  }, []);

  // Fetch catalog
  const catalogParams = selectedCategory === 'all' ? {} : { category: selectedCategory };
  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: QUERY_KEYS.storeCatalogWith(catalogParams),
    queryFn: () => storeApi.getCatalog(selectedCategory === 'all' ? undefined : catalogParams),
    staleTime: 30000,
  });

  // Fetch inventory
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: QUERY_KEYS.storeInventory,
    queryFn: storeApi.getInventory,
    staleTime: 30000,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (cosmeticId: string) => storeApi.purchase(cosmeticId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
      setShowPurchaseDialog(false);
      setSelectedItem(null);
    },
  });

  // Equip mutation
  const equipMutation = useMutation({
    mutationFn: ({ cosmeticId, slot }: { cosmeticId: string; slot: string }) =>
      storeApi.equip(cosmeticId, slot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
    },
  });

  // Unequip mutation
  const unequipMutation = useMutation({
    mutationFn: (slot: string) => storeApi.unequip(slot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
    },
  });

  const handleItemClick = (item: CatalogItem) => {
    if (!item.is_owned && !item.is_level_locked && item.is_affordable && !item.is_quest_exclusive) {
      setSelectedItem(item);
      setShowPurchaseDialog(true);
    }
  };

  const handleConfirmPurchase = () => {
    if (selectedItem) {
      purchaseMutation.mutate(selectedItem.id);
    }
  };

  const handleEquip = (item: InventoryItem) => {
    equipMutation.mutate({ cosmeticId: item.id, slot: item.category });
  };

  const handleUnequip = (item: InventoryItem) => {
    unequipMutation.mutate(item.category);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      {/* Page Header + Avatar Preview Area (Stories 7.1, 7.2) */}
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
          {getFantasyText('Store', adventureEnabled)}
        </h1>
        <StoreAvatarPreview previewOverrides={previewOverrides} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className="px-4 py-2 rounded-md font-semibold transition-colors"
          style={{
            backgroundColor: activeTab === 'catalog' ? colors.accent : 'transparent',
            color: activeTab === 'catalog' ? '#2E2E38' : colors.textPrimary,
            border: `1px solid ${colors.accent}`,
          }}
        >
          {getFantasyText('Store', adventureEnabled)}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          data-tour="inventory-tab"
          className="px-4 py-2 rounded-md font-semibold transition-colors"
          style={{
            backgroundColor: activeTab === 'inventory' ? colors.accent : 'transparent',
            color: activeTab === 'inventory' ? '#2E2E38' : colors.textPrimary,
            border: `1px solid ${colors.accent}`,
          }}
        >
          {getFantasyText('Inventory', adventureEnabled)}
        </button>
      </div>

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <>
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize"
                style={{
                  backgroundColor: selectedCategory === cat
                    ? colors.accent
                    : (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: selectedCategory === cat ? '#2E2E38' : colors.textPrimary,
                }}
              >
                {cat === 'all' ? 'All' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Loading */}
          {catalogLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
          )}

          {/* Item Grid */}
          {catalogData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {catalogData.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => handleItemHover(item)}
                  onMouseLeave={handleItemHoverEnd}
                  data-testid={`catalog-item-${item.id}`}
                  className="p-4 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.07)' : colors.cardBg,
                    border: `1px solid ${RARITY_COLORS[item.rarity] || colors.cardBorder}`,
                    opacity: (item.is_level_locked || item.is_quest_exclusive) ? 0.6 : 1,
                  }}
                >
                  {/* Rarity + Category */}
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="text-xs font-bold uppercase"
                      style={{ color: RARITY_COLORS[item.rarity] || colors.textMuted }}
                    >
                      {item.rarity}
                    </span>
                    <span className="text-xs capitalize" style={{ color: colors.textMuted }}>
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {item.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: colors.textMuted }}>
                    {item.description}
                  </p>

                  {/* Price + Status */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 font-bold">{item.coin_price}</span>
                      <span className="text-xs" style={{ color: colors.textMuted }}>
                        {getFantasyText('Coins', adventureEnabled)}
                      </span>
                    </div>
                    {item.is_owned && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                        Owned
                      </span>
                    )}
                    {item.is_level_locked && !item.is_owned && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                        Level {item.level_required}
                      </span>
                    )}
                    {!item.is_affordable && !item.is_owned && !item.is_level_locked && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                        Too Expensive
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          {inventoryLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
          )}

          {inventoryData && inventoryData.items.length === 0 && (
            <div className="text-center py-12" style={{ color: colors.textMuted }}>
              No items in your inventory yet.
            </div>
          )}

          {inventoryData && inventoryData.items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventoryData.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.07)' : colors.cardBg,
                    border: `1px solid ${RARITY_COLORS[item.rarity] || colors.cardBorder}`,
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="text-xs font-bold uppercase"
                      style={{ color: RARITY_COLORS[item.rarity] || colors.textMuted }}
                    >
                      {item.rarity}
                    </span>
                    <span className="text-xs capitalize" style={{ color: colors.textMuted }}>
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {item.name}
                  </h3>

                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: colors.textMuted }}>
                      {item.source.replace('_', ' ')}
                    </span>
                    {item.is_equipped ? (
                      <button
                        onClick={() => handleUnequip(item)}
                        className="px-3 py-1 rounded text-sm font-semibold transition-colors"
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.2)',
                          color: '#ef4444',
                        }}
                      >
                        {getFantasyText('Unequip', adventureEnabled)}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEquip(item)}
                        className="px-3 py-1 rounded text-sm font-semibold transition-colors"
                        style={{
                          backgroundColor: `${colors.accent}33`,
                          color: colors.accent,
                        }}
                      >
                        {getFantasyText('Equip', adventureEnabled)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Purchase Confirmation Dialog */}
      {showPurchaseDialog && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowPurchaseDialog(false)}
        >
          <div
            className="p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: (isDark || isGame) ? '#1e1e2e' : '#ffffff',
              border: `1px solid ${RARITY_COLORS[selectedItem.rarity] || colors.cardBorder}`,
            }}
          >
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {getFantasyText('Purchase', adventureEnabled)}: {selectedItem.name}
            </h2>
            <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
              {selectedItem.description}
            </p>
            <div className="flex justify-between mb-4">
              <span style={{ color: colors.textSecondary }}>Cost</span>
              <span className="text-yellow-500 font-bold">
                {selectedItem.coin_price} {getFantasyText('Coins', adventureEnabled)}
              </span>
            </div>
            <div className="flex justify-between mb-6">
              <span style={{ color: colors.textSecondary }}>Balance After</span>
              <span style={{ color: colors.textPrimary }}>
                {state.gold - selectedItem.coin_price} {getFantasyText('Coins', adventureEnabled)}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseDialog(false)}
                className="flex-1 px-4 py-2 rounded-md font-semibold"
                style={{
                  backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: colors.textPrimary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={purchaseMutation.isPending}
                className="flex-1 px-4 py-2 rounded-md font-semibold"
                style={{
                  backgroundColor: colors.accent,
                  color: '#2E2E38',
                  opacity: purchaseMutation.isPending ? 0.7 : 1,
                }}
              >
                {purchaseMutation.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

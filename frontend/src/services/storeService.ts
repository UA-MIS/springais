import api from './api';
import { QUERY_KEYS } from './progressionService';

export { QUERY_KEYS };

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  coin_price: number;
  level_required: number;
  image_url: string | null;
  is_quest_exclusive: boolean;
  is_affordable: boolean;
  is_owned: boolean;
  is_level_locked: boolean;
}

export interface CatalogResponse {
  items: CatalogItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface PurchaseResponse {
  success: boolean;
  error?: string;
  item_id?: string;
  item_name?: string;
  item_category?: string;
  item_rarity?: string;
  new_coin_balance: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  rarity: string;
  source: string;
  acquired_at: string;
  is_equipped: boolean;
}

export interface InventoryResponse {
  items: InventoryItem[];
}

export interface EquipResponse {
  slot: string;
  cosmetic_id?: string;
  cosmetic_name?: string;
  cosmetic_category?: string;
  cosmetic_rarity?: string;
}

export const storeApi = {
  getCatalog: (params?: { category?: string; rarity?: string; limit?: number; offset?: number }) =>
    api.get<CatalogResponse>('/store/catalog', { params }).then((r) => r.data),

  purchase: (cosmetic_id: string) =>
    api.post<PurchaseResponse>('/store/purchase', { cosmetic_id }).then((r) => r.data),

  getInventory: () =>
    api.get<InventoryResponse>('/store/inventory').then((r) => r.data),

  equip: (cosmetic_id: string, slot: string) =>
    api.post<EquipResponse>('/store/equip', { cosmetic_id, slot }).then((r) => r.data),

  unequip: (slot: string) =>
    api.post<{ slot: string; unequipped: boolean }>('/store/unequip', { slot }).then((r) => r.data),
};

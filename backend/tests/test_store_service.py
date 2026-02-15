"""Tests for store service -- purchase, inventory, equip/unequip.

Covers Story 6.3: StoreService with atomic purchase (FINDING-SEC-003 fix),
inventory management, and equip/unequip operations.
"""

from __future__ import annotations

import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.database import DATABASE_URL
from app.models import Base
from app.models.cosmetic import CosmeticCatalog, UserEquippedItem, UserInventory
from app.models.progression import UserProgression
from app.models.user_profile import UserProfile
from app.services.store_service import store_service, EquipResult

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", DATABASE_URL)
engine = create_engine(TEST_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


def _create_user(db, email="store_test@test.com") -> UserProfile:
    user = UserProfile(email=email, hashed_password="$2b$12$test", full_name="Store Tester")
    db.add(user)
    db.flush()
    return user


def _create_progression(db, user_id, coin_balance=500, level=5) -> UserProgression:
    prog = UserProgression(user_id=user_id, xp_total=1000, level=level, coin_balance=coin_balance)
    db.add(prog)
    db.flush()
    return prog


def _create_catalog_item(
    db, name="Test Pet", category="pet", rarity="common",
    coin_price=100, level_required=1, is_quest_exclusive=False, is_active=True,
) -> CosmeticCatalog:
    item = CosmeticCatalog(
        name=name, description="Test item", category=category, rarity=rarity,
        coin_price=coin_price, level_required=level_required,
        is_quest_exclusive=is_quest_exclusive, is_active=is_active, sort_order=1,
    )
    db.add(item)
    db.flush()
    return item


class TestStorePurchase:
    """Story 6.3 AC #1: Purchase flow with FINDING-SEC-003 fix."""

    def test_successful_purchase_deducts_coins_and_adds_inventory(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=500, level=5)
        item = _create_catalog_item(db_session, coin_price=200, level_required=1)

        result = store_service.purchase(db_session, user.id, item.id)

        assert result.success is True
        assert result.new_coin_balance == 300
        # Verify inventory
        inv = db_session.query(UserInventory).filter_by(user_id=user.id, cosmetic_id=item.id).first()
        assert inv is not None
        assert inv.source == "store_purchase"

    def test_purchase_fails_insufficient_coins(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=50, level=5)
        item = _create_catalog_item(db_session, coin_price=200)

        result = store_service.purchase(db_session, user.id, item.id)

        assert result.success is False
        assert result.error == "insufficient_coins"

    def test_purchase_fails_already_owned(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item = _create_catalog_item(db_session, coin_price=100)

        # First purchase succeeds
        result1 = store_service.purchase(db_session, user.id, item.id)
        assert result1.success is True

        # Second purchase fails
        result2 = store_service.purchase(db_session, user.id, item.id)
        assert result2.success is False
        assert result2.error == "already_owned"

    def test_purchase_fails_level_too_low(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=2)
        item = _create_catalog_item(db_session, coin_price=100, level_required=5)

        result = store_service.purchase(db_session, user.id, item.id)

        assert result.success is False
        assert result.error == "level_too_low"

    def test_purchase_fails_quest_exclusive(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=10)
        item = _create_catalog_item(db_session, coin_price=0, is_quest_exclusive=True)

        result = store_service.purchase(db_session, user.id, item.id)

        assert result.success is False
        assert result.error == "quest_exclusive"

    def test_purchase_fails_item_unavailable(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=10)
        item = _create_catalog_item(db_session, coin_price=100, is_active=False)

        result = store_service.purchase(db_session, user.id, item.id)

        assert result.success is False
        assert result.error == "item_unavailable"


class TestStoreCatalog:
    """Story 6.3 AC #2: get_catalog with per-user flags."""

    def test_get_catalog_returns_items_with_user_flags(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=200, level=3)
        _create_catalog_item(db_session, name="Cheap Pet", coin_price=100, level_required=1)
        _create_catalog_item(db_session, name="Pricey Aura", category="aura", coin_price=500, level_required=1)
        _create_catalog_item(db_session, name="Locked Pedestal", category="pedestal", coin_price=100, level_required=10)

        items, total = store_service.get_catalog(db_session, user.id)

        assert total >= 3
        by_name = {r["name"]: r for r in items}
        assert by_name["Cheap Pet"]["is_affordable"] is True
        assert by_name["Cheap Pet"]["is_level_locked"] is False
        assert by_name["Pricey Aura"]["is_affordable"] is False
        assert by_name["Locked Pedestal"]["is_level_locked"] is True

    def test_get_catalog_filters_by_category(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id)
        _create_catalog_item(db_session, name="Filter Pet", category="pet", coin_price=100)
        _create_catalog_item(db_session, name="Filter Aura", category="aura", coin_price=100)

        items, _ = store_service.get_catalog(db_session, user.id, category="pet")

        names = [i["name"] for i in items]
        assert "Filter Pet" in names
        assert "Filter Aura" not in names


class TestStoreInventory:
    """Story 6.3 AC #3: get_inventory."""

    def test_get_inventory_returns_owned_items(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item = _create_catalog_item(db_session, coin_price=100)

        store_service.purchase(db_session, user.id, item.id)
        inventory = store_service.get_inventory(db_session, user.id)

        assert len(inventory) >= 1
        ids = [inv.id for inv in inventory]
        assert str(item.id) in ids


class TestStoreEquip:
    """Story 6.3 AC #4-5: equip/unequip."""

    def test_equip_item(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item = _create_catalog_item(db_session, category="pet", coin_price=100)

        store_service.purchase(db_session, user.id, item.id)
        result = store_service.equip(db_session, user.id, item.id, "pet")

        assert isinstance(result, EquipResult)
        assert result.slot == "pet"
        equipped = db_session.query(UserEquippedItem).filter_by(user_id=user.id, slot="pet").first()
        assert equipped is not None
        assert equipped.cosmetic_id == item.id

    def test_equip_replaces_existing_item_in_slot(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item1 = _create_catalog_item(db_session, name="Pet A", category="pet", coin_price=100)
        item2 = _create_catalog_item(db_session, name="Pet B", category="pet", coin_price=200)

        store_service.purchase(db_session, user.id, item1.id)
        store_service.purchase(db_session, user.id, item2.id)
        store_service.equip(db_session, user.id, item1.id, "pet")
        result = store_service.equip(db_session, user.id, item2.id, "pet")

        assert isinstance(result, EquipResult)
        equipped = db_session.query(UserEquippedItem).filter_by(user_id=user.id, slot="pet").first()
        assert equipped.cosmetic_id == item2.id

    def test_equip_fails_not_owned(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item = _create_catalog_item(db_session, category="pet", coin_price=100)

        result = store_service.equip(db_session, user.id, item.id, "pet")

        assert isinstance(result, str)
        assert result == "item_not_owned"

    def test_equip_fails_category_slot_mismatch(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item = _create_catalog_item(db_session, category="pet", coin_price=100)

        store_service.purchase(db_session, user.id, item.id)
        result = store_service.equip(db_session, user.id, item.id, "pedestal")

        assert isinstance(result, str)
        assert result == "category_slot_mismatch"

    def test_unequip_item(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item = _create_catalog_item(db_session, category="pet", coin_price=100)

        store_service.purchase(db_session, user.id, item.id)
        store_service.equip(db_session, user.id, item.id, "pet")
        store_service.unequip(db_session, user.id, "pet")

        equipped = db_session.query(UserEquippedItem).filter_by(user_id=user.id, slot="pet").first()
        assert equipped is None

    def test_unequip_empty_slot_is_noop(self, db_session):
        user = _create_user(db_session)
        # Should not raise
        store_service.unequip(db_session, user.id, "pet")

    def test_equip_multiple_slots(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=2000, level=5)
        pet = _create_catalog_item(db_session, name="Multi Pet", category="pet", coin_price=100)
        aura = _create_catalog_item(db_session, name="Multi Aura", category="aura", coin_price=100)

        store_service.purchase(db_session, user.id, pet.id)
        store_service.purchase(db_session, user.id, aura.id)

        result_pet = store_service.equip(db_session, user.id, pet.id, "pet")
        result_aura = store_service.equip(db_session, user.id, aura.id, "aura")

        assert isinstance(result_pet, EquipResult)
        assert isinstance(result_aura, EquipResult)

        equipped_count = db_session.query(UserEquippedItem).filter_by(user_id=user.id).count()
        assert equipped_count == 2


class TestStorePurchaseAdditional:
    """Additional purchase tests."""

    def test_purchase_fails_no_progression(self, db_session):
        user = _create_user(db_session)
        item = _create_catalog_item(db_session, coin_price=100)

        result = store_service.purchase(db_session, user.id, item.id)

        assert result.success is False
        assert result.error == "progression_not_found"

    def test_purchase_returns_item_details(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=500, level=5)
        item = _create_catalog_item(
            db_session, name="Golden Throne", category="pedestal",
            rarity="epic", coin_price=100, level_required=1,
        )

        result = store_service.purchase(db_session, user.id, item.id)

        assert result.success is True
        assert result.item_id == item.id
        assert result.item_name == "Golden Throne"
        assert result.item_category == "pedestal"
        assert result.item_rarity == "epic"
        assert result.new_coin_balance == 400


class TestInventoryEquipStatus:
    """Inventory shows equipped status correctly."""

    def test_get_inventory_empty_for_new_user(self, db_session):
        user = _create_user(db_session)
        inventory = store_service.get_inventory(db_session, user.id)
        assert len(inventory) == 0

    def test_get_inventory_shows_equipped_status(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item = _create_catalog_item(db_session, category="pet", coin_price=100)

        store_service.purchase(db_session, user.id, item.id)
        store_service.equip(db_session, user.id, item.id, "pet")
        inventory = store_service.get_inventory(db_session, user.id)

        assert len(inventory) >= 1
        equipped_items = [inv for inv in inventory if inv.id == str(item.id)]
        assert len(equipped_items) == 1
        assert equipped_items[0].is_equipped is True

    def test_get_inventory_not_equipped_after_unequip(self, db_session):
        user = _create_user(db_session)
        _create_progression(db_session, user.id, coin_balance=1000, level=5)
        item = _create_catalog_item(db_session, category="pet", coin_price=100)

        store_service.purchase(db_session, user.id, item.id)
        store_service.equip(db_session, user.id, item.id, "pet")
        store_service.unequip(db_session, user.id, "pet")
        inventory = store_service.get_inventory(db_session, user.id)

        target = [inv for inv in inventory if inv.id == str(item.id)]
        assert len(target) == 1
        assert target[0].is_equipped is False


class TestCosmeticSeedData:
    """Story 6.1: Validate seed data integrity."""

    def test_seed_data_has_at_least_30_items(self):
        from app.data.cosmetic_seed import COSMETIC_SEED_DATA
        assert len(COSMETIC_SEED_DATA) >= 30

    def test_seed_data_covers_all_categories(self):
        from app.data.cosmetic_seed import COSMETIC_SEED_DATA
        categories = {item["category"] for item in COSMETIC_SEED_DATA}
        expected = {"pet", "pedestal", "aura", "hairstyle", "color_palette", "banner", "emblem"}
        assert categories == expected

    def test_seed_data_covers_all_rarities(self):
        from app.data.cosmetic_seed import COSMETIC_SEED_DATA
        rarities = {item["rarity"] for item in COSMETIC_SEED_DATA}
        expected = {"common", "uncommon", "rare", "epic", "legendary"}
        assert rarities == expected

    def test_seed_data_has_quest_exclusive_items(self):
        from app.data.cosmetic_seed import COSMETIC_SEED_DATA
        quest_exclusive = [item for item in COSMETIC_SEED_DATA if item.get("is_quest_exclusive")]
        assert len(quest_exclusive) >= 5

    def test_seed_data_pricing_within_rarity_ranges(self):
        from app.data.cosmetic_seed import COSMETIC_SEED_DATA

        rarity_ranges = {
            "common": (100, 200),
            "uncommon": (200, 400),
            "rare": (400, 700),
            "epic": (700, 1200),
            "legendary": (1200, 2000),
        }

        for item in COSMETIC_SEED_DATA:
            if item.get("is_quest_exclusive"):
                continue  # Quest exclusives have price 0
            low, high = rarity_ranges[item["rarity"]]
            assert low <= item["coin_price"] <= high, (
                f"{item['name']} price {item['coin_price']} outside {item['rarity']} range ({low}-{high})"
            )

    def test_seed_data_unique_names(self):
        from app.data.cosmetic_seed import COSMETIC_SEED_DATA
        names = [item["name"] for item in COSMETIC_SEED_DATA]
        assert len(names) == len(set(names)), "Duplicate item names in seed data"

    def test_seed_data_unique_sort_orders(self):
        from app.data.cosmetic_seed import COSMETIC_SEED_DATA
        orders = [item["sort_order"] for item in COSMETIC_SEED_DATA]
        assert len(orders) == len(set(orders)), "Duplicate sort orders in seed data"

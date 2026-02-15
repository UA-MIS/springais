"""Add gamification tables for Medieval Mode.

Creates:
- user_progression: Per-user gamification state (XP, coins, level, streak)
- gamification_events: Append-only event log for reward tracking
- coin_transactions: Ledger for all coin movements
- user_page_visits: Page visit tracking for explorer achievement

Revision ID: 029
Revises: 028
Create Date: 2026-02-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


# revision identifiers, used by Alembic.
revision = "029"
down_revision = "028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. user_progression
    op.create_table(
        "user_progression",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("xp_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("coin_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("login_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_login_date", sa.Date(), nullable=True),
        sa.Column("adventure_mode_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
        sa.CheckConstraint("coin_balance >= 0", name="ck_coin_balance_non_negative"),
        sa.CheckConstraint("xp_total >= 0", name="ck_xp_total_non_negative"),
        sa.CheckConstraint("level >= 1", name="ck_level_positive"),
    )
    op.create_index("idx_user_progression_user_id", "user_progression", ["user_id"], unique=True)

    # 2. gamification_events
    op.create_table(
        "gamification_events",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("event_key", sa.String(255), nullable=True),
        sa.Column("xp_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("coins_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("metadata", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["user_progression.user_id"], ondelete="CASCADE"),
    )
    op.create_index("idx_gamification_events_user_id", "gamification_events", ["user_id"])
    op.create_index("idx_gamification_events_type", "gamification_events", ["event_type"])
    op.create_index("idx_gamification_events_created", "gamification_events", ["created_at"])
    op.create_index(
        "uq_gamification_events_user_key",
        "gamification_events",
        ["user_id", "event_key"],
        unique=True,
        postgresql_where=sa.text("event_key IS NOT NULL"),
    )

    # 3. coin_transactions
    op.create_table(
        "coin_transactions",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("transaction_type", sa.String(20), nullable=False),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("reference_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["user_progression.user_id"], ondelete="CASCADE"),
        sa.CheckConstraint("balance_after >= 0", name="ck_balance_after_non_negative"),
        sa.CheckConstraint(
            "transaction_type IN ('earned', 'spent', 'refund')",
            name="ck_transaction_type_valid",
        ),
    )
    op.create_index("idx_coin_transactions_user_id", "coin_transactions", ["user_id"])
    op.create_index("idx_coin_transactions_created", "coin_transactions", ["created_at"])

    # 4. user_page_visits
    op.create_table(
        "user_page_visits",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("page", sa.String(100), nullable=False),
        sa.Column("first_visited_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("visit_count", sa.Integer(), nullable=False, server_default="1"),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.id"], ondelete="CASCADE"),
    )
    op.create_index("uq_user_page_visit", "user_page_visits", ["user_id", "page"], unique=True)
    op.create_index("idx_user_page_visits_user_id", "user_page_visits", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_page_visits")
    op.drop_table("coin_transactions")
    op.drop_table("gamification_events")
    op.drop_table("user_progression")

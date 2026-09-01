"""Add the skill_taxonomy table.

``SkillTaxonomy`` (app/models/skill_taxonomy.py) has always existed as a model and NO
migration ever created its table. It stayed invisible because the app called
``Base.metadata.create_all()`` in its startup lifespan, which built any model table the
migrations had missed — so on a developer's machine, where the app had been started at
least once, the table was simply there.

Removing that ``create_all()`` call (see the long comment in app/main.py — it also
skipped the raw-SQL HNSW indexes and never stamped alembic_version, which broke fresh
deployments) removed the thing that was hiding this. On a database built purely by
Alembic the table does not exist, and ``POST /api/skills/extract`` fails at the
normalization step with::

    ERROR:app.routes.skills:Skill extraction failed:
      (psycopg.errors.UndefinedTable) relation "skill_taxonomy" does not exist

Note WHERE that lands: the OpenAI call has already succeeded and been paid for (30
skills extracted, $0.0137) before the lookup fails, so the user sees a 500 on the step
that is meant to be the first thing they do.

This is the SECOND instance of exactly this drift — revision 033 exists because
``employees.career_history`` was likewise in the model layer and in no migration. A
model-vs-database diff run against the live schema found precisely one remaining
mismatch, this one:

    models define : 31 tables
    database has  : 31 tables
    IN MODELS BUT NOT IN THE DATABASE (1)
        skill_taxonomy
    IN DATABASE BUT NOT IN MODELS (1)
        alembic_version

So after this revision the two are in sync, and Alembic owns the whole schema.

The table is created EMPTY on purpose. Nothing seeds it: SkillNormalizer treats it as a
lookup cache and falls back to its in-process alias map (the 409-entry cache it logs at
startup) when a row is absent, and SkillTaxonomyService's 42 definitions come from a
Python dict, not from here. An empty table therefore restores correct behaviour rather
than merely silencing the error.

Revision ID: 034
Revises: 033
Create Date: 2026-09-01
"""

from alembic import op
import sqlalchemy as sa


revision = "034"
down_revision = "033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # IF NOT EXISTS via a reflection check rather than raw DDL: an environment that was
    # started with the old create_all() lifespan ALREADY has this table, and this
    # migration must be a clean no-op there rather than failing with "already exists".
    # That is the exact failure mode described in app/main.py's comment, and it would be
    # perverse to reintroduce it in the migration that fixes it.
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "skill_taxonomy" in inspector.get_table_names():
        return

    op.create_table(
        "skill_taxonomy",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("canonical_name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("aliases", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_skill_taxonomy_id"), "skill_taxonomy", ["id"], unique=False)
    op.create_index(
        op.f("ix_skill_taxonomy_canonical_name"), "skill_taxonomy", ["canonical_name"], unique=True
    )
    op.create_index(op.f("ix_skill_taxonomy_category"), "skill_taxonomy", ["category"], unique=False)
    # Matches the model's __table_args__ Index('idx_skill_taxonomy_category', 'category').
    # Redundant with the ix_ index above, but reproduced so the model and the schema agree
    # exactly -- the whole point of this revision.
    op.create_index("idx_skill_taxonomy_category", "skill_taxonomy", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_skill_taxonomy_category", table_name="skill_taxonomy")
    op.drop_index(op.f("ix_skill_taxonomy_category"), table_name="skill_taxonomy")
    op.drop_index(op.f("ix_skill_taxonomy_canonical_name"), table_name="skill_taxonomy")
    op.drop_index(op.f("ix_skill_taxonomy_id"), table_name="skill_taxonomy")
    op.drop_table("skill_taxonomy")

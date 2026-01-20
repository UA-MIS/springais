"""Expand job_postings search_vector to include tags + sectioned text.

Revision ID: 006
Revises: 005
Create Date: 2026-01-19
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Replace function to include tags + sectioned text.
    op.execute(
        """
        CREATE OR REPLACE FUNCTION update_job_postings_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(NEW.service_line, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(array_to_string(ARRAY(
                    SELECT jsonb_array_elements_text(COALESCE(NEW.tags, '[]'::jsonb))
                ), ' '), '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(NEW.requirements_text, '')), 'C') ||
                setweight(to_tsvector('english', COALESCE(NEW.responsibilities_text, '')), 'C') ||
                setweight(to_tsvector('english', COALESCE(NEW.preferred_text, '')), 'D') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    # Backfill for existing rows
    op.execute(
        """
        UPDATE job_postings
        SET search_vector =
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(location, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(service_line, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(array_to_string(ARRAY(
                SELECT jsonb_array_elements_text(COALESCE(tags, '[]'::jsonb))
            ), ' '), '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(requirements_text, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(responsibilities_text, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(preferred_text, '')), 'D') ||
            setweight(to_tsvector('english', COALESCE(description, '')), 'D');
        """
    )


def downgrade() -> None:
    # Revert to the simpler function from revision 004.
    op.execute(
        """
        CREATE OR REPLACE FUNCTION update_job_postings_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    op.execute(
        """
        UPDATE job_postings
        SET search_vector =
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(location, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(description, '')), 'C');
        """
    )


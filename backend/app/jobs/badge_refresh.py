"""
Badge Catalog Refresh Jobs.

Background jobs for keeping the badge catalog current (Architecture Section 2.6).

| Job                        | Schedule    | Source              |
|----------------------------|-------------|---------------------|
| refresh_microsoft_catalog  | Weekly      | Microsoft Learn API |
| refresh_credly_catalog     | Daily (C)   | Credly API          |
| validate_badge_urls        | Weekly      | badge_catalog       |
| deactivate_stale_entries   | Monthly     | badge_catalog       |
"""

import logging
from datetime import datetime, timezone, timedelta

import requests
from sqlalchemy.orm import Session

from app.models.badge import BadgeCatalog, BadgeSkillMapping

logger = logging.getLogger(__name__)


async def refresh_microsoft_catalog(db: Session) -> int:
    """
    Pull full Microsoft Learn certification catalog and upsert into badge_catalog.

    1. GET https://learn.microsoft.com/api/catalog/?type=mergedCertifications
    2. For each certification:
       - Upsert into badge_catalog (platform=microsoft, external_id=uid)
       - Upsert badge_skill_mapping entries from cert.skills array
    3. Update last_refreshed_at
    4. Return count of badges added/updated
    """
    from app.services.badge_discovery_service import BadgeDiscoveryService

    service = BadgeDiscoveryService(db)
    return await service.refresh_catalog(source="microsoft")


async def validate_badge_urls(db: Session) -> dict:
    """
    Validate all active badge URLs via HTTP HEAD.

    1. Query badge_catalog WHERE is_active=True
    2. For each badge, send HEAD request (timeout=10s)
    3. If 4xx/5xx: mark is_active=False, log warning
    4. Return {"checked": N, "deactivated": M}
    """
    badges = db.query(BadgeCatalog).filter(BadgeCatalog.is_active == True).all()

    checked = 0
    deactivated = 0

    for badge in badges:
        checked += 1
        try:
            response = requests.head(badge.url, timeout=10, allow_redirects=True)
            if response.status_code >= 400:
                badge.is_active = False
                deactivated += 1
                logger.warning(
                    f"Badge URL invalid ({response.status_code}): {badge.name} - {badge.url}"
                )
        except requests.RequestException as e:
            # Network error - don't deactivate, could be transient
            logger.warning(f"Badge URL check failed for {badge.name}: {e}")

    db.commit()
    logger.info(f"Badge URL validation: checked={checked}, deactivated={deactivated}")
    return {"checked": checked, "deactivated": deactivated}


async def deactivate_stale_entries(db: Session) -> int:
    """
    Mark inactive badges that haven't been refreshed in 90 days
    and whose source is not 'curated'.

    Returns count of deactivated badges.
    """
    threshold = datetime.now(timezone.utc) - timedelta(days=90)

    # Get badges that are:
    # - active
    # - last_refreshed_at < 90 days ago (or never refreshed)
    # - NOT curated-only (have at least one non-curated mapping)
    stale_badges = (
        db.query(BadgeCatalog)
        .filter(
            BadgeCatalog.is_active == True,
            (BadgeCatalog.last_refreshed_at < threshold) | (BadgeCatalog.last_refreshed_at == None),
        )
        .all()
    )

    count = 0
    for badge in stale_badges:
        # Check if this badge has curated mappings
        curated_count = (
            db.query(BadgeSkillMapping)
            .filter(
                BadgeSkillMapping.badge_id == badge.id,
                BadgeSkillMapping.source == "curated",
            )
            .count()
        )

        # Don't deactivate badges with curated mappings
        if curated_count == 0:
            badge.is_active = False
            count += 1
            logger.info(f"Deactivated stale badge: {badge.name} (last refreshed: {badge.last_refreshed_at})")

    db.commit()
    logger.info(f"Stale entry deactivation: {count} badges deactivated")
    return count

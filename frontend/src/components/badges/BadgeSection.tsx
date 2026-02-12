import { useState, useEffect } from 'react';
import { discoverBadges, Badge } from '../../services/badgeService';
import BadgeCard, { BadgeCardBadge } from './BadgeCard';

export interface BadgeSectionProps {
  skillName: string;
}

export default function BadgeSection({ skillName }: BadgeSectionProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchBadges() {
      setLoading(true);
      setError(null);
      setDegraded(false);
      try {
        const response = await discoverBadges([skillName]);
        if (cancelled) return;
        setBadges(response.badges);
        // If we got results but fewer than expected, external APIs may be down
        if (response.badges.length > 0 && response.total_count > response.badges.length) {
          setDegraded(true);
        }
      } catch {
        if (cancelled) return;
        setError('Unable to load badge suggestions.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBadges();
    return () => { cancelled = true; };
  }, [skillName]);

  if (loading) {
    return (
      <div>
        <label className="text-xs font-medium text-ey-gray uppercase mb-3 block">
          Badges & Certifications
        </label>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-3 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <label className="text-xs font-medium text-ey-gray uppercase mb-3 block">
          Badges & Certifications
        </label>
        <div className="p-3 rounded-lg border border-gray-200 text-sm text-gray-500">
          <p>{error}</p>
          <a
            href={`https://www.credly.com/organizations/ey/badges?search=${encodeURIComponent(skillName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs mt-1 inline-block"
          >
            Search EY badges for {skillName} on Credly
          </a>
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div>
        <label className="text-xs font-medium text-ey-gray uppercase mb-3 block">
          Badges & Certifications
        </label>
        <div className="p-3 rounded-lg border border-gray-200 text-sm text-gray-500">
          <p>No badges found for this skill.</p>
          <a
            href={`https://www.credly.com/organizations/ey/badges?search=${encodeURIComponent(skillName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs mt-1 inline-block"
          >
            Search EY badges for {skillName} on Credly
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium text-ey-gray uppercase mb-3 block">
        Badges & Certifications ({badges.length})
      </label>
      {degraded && (
        <p className="text-xs text-amber-600 mb-2">
          Some results may be limited due to external service availability.
        </p>
      )}
      <div className="space-y-2">
        {badges.map((badge) => {
          const cardBadge: BadgeCardBadge = {
            name: badge.name,
            provider: badge.issuer,
            url: badge.url,
            difficulty_level: badge.difficulty_level,
            estimated_cost_usd: badge.estimated_cost_usd,
            estimated_hours: badge.estimated_hours,
            badge_id: badge.id,
          };
          return (
            <BadgeCard
              key={badge.id}
              badge={cardBadge}
              source="skill_module"
            />
          );
        })}
      </div>
    </div>
  );
}

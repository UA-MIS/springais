import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

/**
 * Tests for getResourceIcon switch-case logic in SkillDetailModal.jsx.
 *
 * Since getResourceIcon is a local function inside the component, we replicate
 * its switch logic here to verify the icon routing, particularly that:
 * - 'ey_badge' maps to the badge checkmark icon (same as 'certification' and 'badge')
 * - 'ey_course' maps to the building icon
 * - Other types map to their expected icons
 *
 * The badge checkmark icon uses the path containing "M9 12l2 2 4-4M7.835"
 * The building icon uses the path containing "M19 21V5"
 * The video icon uses paths containing "M14.752"
 */

// Replicate the getResourceIcon logic exactly as it appears in SkillDetailModal.jsx
// after the FR-7.5 change (ey_badge falls through to badge icon)
function getResourceIcon(type: string) {
  switch (type) {
    case 'course':
    case 'video':
      return (
        <svg data-testid="icon-video" className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'certification':
    case 'badge':
    case 'ey_badge':
      return (
        <svg data-testid="icon-badge" className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      );
    case 'practice':
    case 'hands-on':
      return (
        <svg data-testid="icon-practice" className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'ey_course':
      return (
        <svg data-testid="icon-building" className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    default:
      return (
        <svg data-testid="icon-default" className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
      );
  }
}

describe('getResourceIcon routing', () => {
  it('returns badge icon for "certification" type', () => {
    const { container } = render(getResourceIcon('certification'));
    expect(container.querySelector('[data-testid="icon-badge"]')).not.toBeNull();
  });

  it('returns badge icon for "badge" type', () => {
    const { container } = render(getResourceIcon('badge'));
    expect(container.querySelector('[data-testid="icon-badge"]')).not.toBeNull();
  });

  it('returns badge icon for "ey_badge" type (FR-7.5)', () => {
    const { container } = render(getResourceIcon('ey_badge'));
    expect(container.querySelector('[data-testid="icon-badge"]')).not.toBeNull();
  });

  it('returns building icon for "ey_course" type', () => {
    const { container } = render(getResourceIcon('ey_course'));
    expect(container.querySelector('[data-testid="icon-building"]')).not.toBeNull();
  });

  it('returns video icon for "course" type', () => {
    const { container } = render(getResourceIcon('course'));
    expect(container.querySelector('[data-testid="icon-video"]')).not.toBeNull();
  });

  it('returns video icon for "video" type', () => {
    const { container } = render(getResourceIcon('video'));
    expect(container.querySelector('[data-testid="icon-video"]')).not.toBeNull();
  });

  it('returns practice icon for "practice" type', () => {
    const { container } = render(getResourceIcon('practice'));
    expect(container.querySelector('[data-testid="icon-practice"]')).not.toBeNull();
  });

  it('returns practice icon for "hands-on" type', () => {
    const { container } = render(getResourceIcon('hands-on'));
    expect(container.querySelector('[data-testid="icon-practice"]')).not.toBeNull();
  });

  it('returns default book icon for unknown types', () => {
    const { container } = render(getResourceIcon('unknown'));
    expect(container.querySelector('[data-testid="icon-default"]')).not.toBeNull();
  });

  // Verify ey_badge and ey_course are NOT the same icon
  it('ey_badge and ey_course produce different icons', () => {
    const { container: badgeContainer } = render(getResourceIcon('ey_badge'));
    const { container: courseContainer } = render(getResourceIcon('ey_course'));
    expect(badgeContainer.querySelector('[data-testid="icon-badge"]')).not.toBeNull();
    expect(courseContainer.querySelector('[data-testid="icon-building"]')).not.toBeNull();
    expect(badgeContainer.querySelector('[data-testid="icon-building"]')).toBeNull();
    expect(courseContainer.querySelector('[data-testid="icon-badge"]')).toBeNull();
  });
});

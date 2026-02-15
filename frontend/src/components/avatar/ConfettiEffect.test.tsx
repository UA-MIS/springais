import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfettiEffect from './ConfettiEffect';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { variants, initial, animate, custom, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ConfettiEffect', () => {
  it('renders 8 confetti particles when active', () => {
    render(<ConfettiEffect active={true} />);
    expect(screen.getByTestId('confetti-effect')).toBeDefined();
    const particles = screen.getAllByTestId('confetti-particle');
    expect(particles).toHaveLength(8);
  });

  it('renders nothing when not active', () => {
    const { container } = render(<ConfettiEffect active={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('particles use gold and blue colors', () => {
    render(<ConfettiEffect active={true} />);
    const particles = screen.getAllByTestId('confetti-particle');
    const colors = particles.map((p) => p.style.backgroundColor);
    expect(colors.filter((c) => c === 'rgb(255, 230, 0)').length).toBeGreaterThan(0);
    expect(colors.filter((c) => c === 'rgb(96, 192, 255)').length).toBeGreaterThan(0);
  });
});

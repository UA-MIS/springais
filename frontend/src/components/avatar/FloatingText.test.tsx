import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FloatingText from './FloatingText';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { variants, initial, animate, custom, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('FloatingText', () => {
  it('renders text when provided', () => {
    render(<FloatingText text="+50 XP" />);
    expect(screen.getByTestId('floating-text')).toBeDefined();
    expect(screen.getByText('+50 XP')).toBeDefined();
  });

  it('renders nothing when text is null', () => {
    const { container } = render(<FloatingText text={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('uses custom color when provided', () => {
    render(<FloatingText text="+100 Gold" color="#22c55e" />);
    const el = screen.getByTestId('floating-text');
    expect(el.style.color).toBe('rgb(34, 197, 94)');
  });

  it('uses gold color by default', () => {
    render(<FloatingText text="+50 XP" />);
    const el = screen.getByTestId('floating-text');
    expect(el.style.color).toBe('rgb(255, 230, 0)');
  });
});

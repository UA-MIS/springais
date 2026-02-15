import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModernGuideIcon from './ModernGuideIcon';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ModernGuideIcon (Story 8.1)', () => {
  it('renders compass icon', () => {
    render(<ModernGuideIcon onClick={vi.fn()} />);
    const img = screen.getByAltText('Guide');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('/assets/cedric/modern/compass-icon.png');
  });

  it('renders at 32x32 default size', () => {
    render(<ModernGuideIcon onClick={vi.fn()} />);
    const container = screen.getByTestId('modern-guide-icon');
    expect(container.style.width).toBe('32px');
    expect(container.style.height).toBe('32px');
  });

  it('renders with custom size', () => {
    render(<ModernGuideIcon onClick={vi.fn()} size={48} />);
    const container = screen.getByTestId('modern-guide-icon');
    expect(container.style.width).toBe('48px');
    expect(container.style.height).toBe('48px');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ModernGuideIcon onClick={onClick} />);
    fireEvent.click(screen.getByTestId('modern-guide-icon'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has tooltip text', () => {
    render(<ModernGuideIcon onClick={vi.fn()} />);
    const container = screen.getByTestId('modern-guide-icon');
    expect(container.getAttribute('title')).toBe('Click to open guide');
  });

  it('has accessible aria-label', () => {
    render(<ModernGuideIcon onClick={vi.fn()} />);
    const container = screen.getByTestId('modern-guide-icon');
    expect(container.getAttribute('aria-label')).toBe('Click to open guide');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pedestal, { getPedestalLevel } from './Pedestal';

describe('Pedestal', () => {
  it('renders with correct data-pedestal-level for level 1', () => {
    render(<Pedestal level={1} size={128} />);
    expect(screen.getByTestId('pedestal')).toHaveAttribute('data-pedestal-level', '1');
  });

  it('renders with correct data-pedestal-level for level 2', () => {
    render(<Pedestal level={2} size={128} />);
    expect(screen.getByTestId('pedestal')).toHaveAttribute('data-pedestal-level', '1');
  });

  it('renders with correct data-pedestal-level for level 3', () => {
    render(<Pedestal level={3} size={128} />);
    expect(screen.getByTestId('pedestal')).toHaveAttribute('data-pedestal-level', '3');
  });

  it('renders with correct data-pedestal-level for level 5', () => {
    render(<Pedestal level={5} size={128} />);
    expect(screen.getByTestId('pedestal')).toHaveAttribute('data-pedestal-level', '5');
  });

  it('renders with correct data-pedestal-level for level 7', () => {
    render(<Pedestal level={7} size={128} />);
    expect(screen.getByTestId('pedestal')).toHaveAttribute('data-pedestal-level', '7');
  });

  it('renders with correct data-pedestal-level for level 9+', () => {
    render(<Pedestal level={9} size={128} />);
    expect(screen.getByTestId('pedestal')).toHaveAttribute('data-pedestal-level', '9');
  });

  it('renders with correct data-pedestal-level for level 15', () => {
    render(<Pedestal level={15} size={128} />);
    expect(screen.getByTestId('pedestal')).toHaveAttribute('data-pedestal-level', '9');
  });

  it('renders at correct width based on size prop', () => {
    render(<Pedestal level={1} size={192} />);
    const pedestal = screen.getByTestId('pedestal');
    expect(pedestal.style.width).toBe('192px');
  });
});

describe('getPedestalLevel', () => {
  it('returns 1 for levels 1-2', () => {
    expect(getPedestalLevel(1)).toBe(1);
    expect(getPedestalLevel(2)).toBe(1);
  });

  it('returns 3 for levels 3-4', () => {
    expect(getPedestalLevel(3)).toBe(3);
    expect(getPedestalLevel(4)).toBe(3);
  });

  it('returns 5 for levels 5-6', () => {
    expect(getPedestalLevel(5)).toBe(5);
    expect(getPedestalLevel(6)).toBe(5);
  });

  it('returns 7 for levels 7-8', () => {
    expect(getPedestalLevel(7)).toBe(7);
    expect(getPedestalLevel(8)).toBe(7);
  });

  it('returns 9 for level 9+', () => {
    expect(getPedestalLevel(9)).toBe(9);
    expect(getPedestalLevel(20)).toBe(9);
  });
});

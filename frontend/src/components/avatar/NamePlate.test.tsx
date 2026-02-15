import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NamePlate from './NamePlate';

// Mock hooks
const mockAdventureState = { title: 'Apprentice', enabled: true };
const mockTheme = { theme: 'game' as const, isGame: true, isDark: false };

vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({ state: mockAdventureState }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => mockTheme,
}));

describe('NamePlate', () => {
  it('renders "Cedric the {title}" text', () => {
    render(<NamePlate level={3} size={128} />);
    expect(screen.getByTestId('nameplate-title').textContent).toBe('Cedric the Apprentice');
  });

  it('renders level text', () => {
    render(<NamePlate level={5} size={128} />);
    expect(screen.getByTestId('nameplate-level').textContent).toBe('Lv. 5');
  });

  it('uses Cinzel font in game mode', () => {
    render(<NamePlate level={1} size={128} />);
    const titleEl = screen.getByTestId('nameplate-title');
    expect(titleEl.style.fontFamily).toContain('Cinzel');
  });

  it('scales font size based on sprite size', () => {
    const { rerender } = render(<NamePlate level={1} size={64} />);
    let titleEl = screen.getByTestId('nameplate-title');
    expect(titleEl.style.fontSize).toBe('8px');

    rerender(<NamePlate level={1} size={128} />);
    titleEl = screen.getByTestId('nameplate-title');
    expect(titleEl.style.fontSize).toBe('11px');

    rerender(<NamePlate level={1} size={192} />);
    titleEl = screen.getByTestId('nameplate-title');
    expect(titleEl.style.fontSize).toBe('14px');
  });
});

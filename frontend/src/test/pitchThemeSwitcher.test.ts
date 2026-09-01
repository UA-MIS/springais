import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const scriptPath = resolve(
  __dirname,
  '../../public/deck/assets/js/pitch-theme-switcher.js',
);

type ThemeSwitcher = {
  STORAGE_KEY: string;
  THEMES: string[];
  DEFAULT_THEME: string;
  isValidTheme: (name: string | null | undefined) => boolean;
  readStoredTheme: (storage?: Storage) => string | null;
  writeStoredTheme: (name: string, storage?: Storage) => boolean;
  resolveInitialTheme: (storage?: Storage) => string;
  applyTheme: (name: string, doc?: Document) => string;
};

function loadSwitcher(): ThemeSwitcher {
  const source = readFileSync(scriptPath, 'utf8');
  const win = window as unknown as { PitchThemeSwitcher?: ThemeSwitcher };
  delete win.PitchThemeSwitcher;
  new Function(source).call(window);
  if (!win.PitchThemeSwitcher) {
    throw new Error('PitchThemeSwitcher failed to attach to window');
  }
  return win.PitchThemeSwitcher;
}

describe('pitch theme switcher', () => {
  let TS: ThemeSwitcher;

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.body.className = '';
    document.body.innerHTML = `
      <button data-theme-btn="light" aria-pressed="false"></button>
      <button data-theme-btn="dark" aria-pressed="false"></button>
      <button data-theme-btn="medieval" aria-pressed="false"></button>
    `;
    TS = loadSwitcher();
  });

  it('exposes the expected API surface', () => {
    expect(TS.STORAGE_KEY).toBe('springais-pitch-theme');
    expect(TS.DEFAULT_THEME).toBe('medieval');
    expect(TS.THEMES).toEqual(['light', 'dark', 'medieval']);
  });

  it('validates theme names', () => {
    expect(TS.isValidTheme('light')).toBe(true);
    expect(TS.isValidTheme('dark')).toBe(true);
    expect(TS.isValidTheme('medieval')).toBe(true);
    expect(TS.isValidTheme('blue')).toBe(false);
    expect(TS.isValidTheme(null)).toBe(false);
    expect(TS.isValidTheme(undefined)).toBe(false);
  });

  it('defaults to medieval when nothing is stored', () => {
    expect(TS.resolveInitialTheme()).toBe('medieval');
  });

  it('resolves the stored theme when one exists', () => {
    window.localStorage.setItem('springais-pitch-theme', 'dark');
    expect(TS.resolveInitialTheme()).toBe('dark');
  });

  it('ignores invalid stored values and falls back to default', () => {
    window.localStorage.setItem('springais-pitch-theme', 'blue');
    expect(TS.resolveInitialTheme()).toBe('medieval');
  });

  it('applyTheme updates body class, data-theme attr, and persists', () => {
    TS.applyTheme('light');
    expect(document.body.classList.contains('theme-light')).toBe(true);
    expect(document.body.classList.contains('theme-medieval')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem('springais-pitch-theme')).toBe('light');
  });

  it('applyTheme swaps the body class when called multiple times', () => {
    TS.applyTheme('light');
    TS.applyTheme('dark');
    expect(document.body.classList.contains('theme-light')).toBe(false);
    expect(document.body.classList.contains('theme-dark')).toBe(true);
    TS.applyTheme('medieval');
    expect(document.body.classList.contains('theme-dark')).toBe(false);
    expect(document.body.classList.contains('theme-medieval')).toBe(true);
  });

  it('applyTheme sets aria-pressed on theme buttons', () => {
    TS.applyTheme('dark');
    const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-btn]');
    const pressed = Array.from(buttons).filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0].dataset.themeBtn).toBe('dark');
  });

  it('applyTheme with invalid input falls back to default', () => {
    TS.applyTheme('blue');
    expect(document.body.classList.contains('theme-medieval')).toBe(true);
    expect(window.localStorage.getItem('springais-pitch-theme')).toBe('medieval');
  });

  it('writeStoredTheme returns false for invalid names and does not persist', () => {
    expect(TS.writeStoredTheme('blue')).toBe(false);
    expect(window.localStorage.getItem('springais-pitch-theme')).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as gameExports from './index';

describe('CoinFlipGame removal (Story 9.1)', () => {
  it('CoinFlipGame is NOT exported from the game components barrel', () => {
    expect('CoinFlipGame' in gameExports).toBe(false);
  });

  it('CoinFlipGame.tsx file does not exist on disk', () => {
    const coinFlipPath = path.resolve(__dirname, 'CoinFlipGame.tsx');
    expect(fs.existsSync(coinFlipPath)).toBe(false);
  });

  it('AdventureHUD does not import or reference CoinFlipGame', () => {
    const hudPath = path.resolve(__dirname, 'AdventureHUD.tsx');
    const hudSource = fs.readFileSync(hudPath, 'utf-8');
    expect(hudSource).not.toContain('CoinFlipGame');
    expect(hudSource).not.toContain('showMiniGame');
  });

  it('barrel export file does not reference CoinFlipGame', () => {
    const indexPath = path.resolve(__dirname, 'index.ts');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');
    expect(indexSource).not.toContain('CoinFlipGame');
  });
});

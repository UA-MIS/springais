interface PedestalProps {
  level: number;
  size: 64 | 128 | 192;
}

function getPedestalLevel(level: number): number {
  if (level >= 9) return 9;
  if (level >= 7) return 7;
  if (level >= 5) return 5;
  if (level >= 3) return 3;
  return 1;
}

// CSS-only pedestal colors by level range
const PEDESTAL_STYLES: Record<number, { bg: string; border: string; shadow: string }> = {
  1: { bg: '#6b7280', border: '#4b5563', shadow: 'none' },
  3: { bg: '#6b7280', border: '#4b5563', shadow: 'inset 0 -2px 4px rgba(34, 197, 94, 0.2)' },
  5: { bg: '#78716c', border: '#57534e', shadow: 'inset 0 -2px 6px rgba(168, 162, 158, 0.3)' },
  7: { bg: '#44403c', border: '#78716c', shadow: '0 0 8px rgba(255, 215, 0, 0.2), inset 0 -2px 6px rgba(255, 215, 0, 0.15)' },
  9: { bg: 'linear-gradient(180deg, #78716c 0%, #44403c 100%)', border: '#fbbf24', shadow: '0 0 12px rgba(255, 215, 0, 0.4), inset 0 -2px 8px rgba(255, 215, 0, 0.2)' },
};

export default function Pedestal({ level, size }: PedestalProps) {
  const pedestalLevel = getPedestalLevel(level);
  const style = PEDESTAL_STYLES[pedestalLevel];
  const width = size;
  const height = Math.round(size * 0.25);

  return (
    <div
      data-testid="pedestal"
      data-pedestal-level={pedestalLevel}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: '4px 4px 8px 8px',
        boxShadow: style.shadow,
        imageRendering: 'pixelated',
      }}
    />
  );
}

export { getPedestalLevel };

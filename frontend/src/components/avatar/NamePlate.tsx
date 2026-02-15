import { useAdventureMode } from '../../context/AdventureModeContext';
import { useTheme } from '../../context/ThemeContext';

interface NamePlateProps {
  level: number;
  size: 64 | 128 | 192;
}

// Title from AdventureModeContext
export default function NamePlate({ level, size }: NamePlateProps) {
  const { state } = useAdventureMode();
  const { isGame } = useTheme();

  const fontSize = size <= 64 ? '8px' : size <= 128 ? '11px' : '14px';
  const levelFontSize = size <= 64 ? '7px' : size <= 128 ? '9px' : '12px';
  const title = state.title || 'Apprentice';

  return (
    <div
      data-testid="nameplate"
      style={{
        textAlign: 'center',
        width: `${size}px`,
        marginTop: '2px',
      }}
    >
      <div
        data-testid="nameplate-title"
        style={{
          fontSize,
          fontFamily: isGame ? "'Cinzel', serif" : 'system-ui, sans-serif',
          color: isGame ? '#e8dcc4' : '#374151',
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        Cedric the {title}
      </div>
      <div
        data-testid="nameplate-level"
        style={{
          fontSize: levelFontSize,
          fontFamily: isGame ? "'Cinzel', serif" : 'system-ui, sans-serif',
          color: isGame ? '#7a7060' : '#9ca3af',
          lineHeight: 1.2,
        }}
      >
        Lv. {level}
      </div>
    </div>
  );
}

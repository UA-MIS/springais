import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SkillFrequency } from '../../services/successPatternService';
import { useTheme, themeColors } from '../../context/ThemeContext';

interface SkillFrequencyChartProps {
  data: SkillFrequency[];
}

export default function SkillFrequencyChart({ data }: SkillFrequencyChartProps) {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const gridStroke = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
  const tickStroke = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)';
  const tickFill = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)';
  const labelFill = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.5)';

  // Get top 10 skills, sorted by frequency
  const topSkills = [...data]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const skill = payload[0].payload as SkillFrequency;
      return (
        <div
          className="p-3 rounded-sm shadow-2xl"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            backdropFilter: isDark ? 'blur(12px)' : 'none',
          }}
        >
          <p className="font-semibold" style={{ color: colors.textPrimary }}>{skill.skill}</p>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Required for <span className="font-bold">{skill.frequency}%</span> of successful
            transitions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="p-6 rounded-sm shadow-2xl transition-colors"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
        Top Skills for Successful Transitions
      </h3>
      <div className="flex justify-center">
        <div className="w-full max-w-[860px]">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={topSkills}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 26 }}
              barCategoryGap={14}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} strokeWidth={1.5} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: tickFill }}
                label={{
                  value: 'Frequency (%)',
                  position: 'bottom',
                  offset: 10,
                  fill: labelFill,
                }}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <YAxis
                type="category"
                dataKey="skill"
                tick={{ fontSize: 12, fill: tickFill }}
                width={150}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="frequency" barSize={14} radius={[0, 4, 4, 0]}>
                {topSkills.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#FFE600" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

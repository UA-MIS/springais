import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TransitionData } from '../../services/successPatternService';
import { useTheme, themeColors } from '../../context/ThemeContext';

interface SuccessRateChartProps {
  data: TransitionData[];
}

export default function SuccessRateChart({ data }: SuccessRateChartProps) {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const gridStroke = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
  const tickStroke = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)';
  const tickFill = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)';
  const labelFill = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.5)';

  // Custom color based on success rate
  const getBarColor = (successRate: number): string => {
    if (successRate >= 70) return '#FFE600'; // Accent yellow
    if (successRate >= 50) return '#C4C4CD'; // Light gray
    return '#52525B'; // Dark gray
  };

  const sortedData = [...data].sort((a, b) => b.successRate - a.successRate);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TransitionData;
      return (
        <div
          className="p-3 rounded-sm shadow-2xl"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            backdropFilter: isDark ? 'blur(12px)' : 'none',
          }}
        >
          <p className="font-semibold" style={{ color: colors.textPrimary }}>{label}</p>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Success Rate: <span className="font-bold">{data.successRate}%</span>
          </p>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Sample Size: <span className="font-bold">{data.sampleSize} employees</span>
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
        Success Rate by Transition
      </h3>
      <div className="flex justify-center">
        <div className="w-full max-w-[760px]">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} strokeWidth={1.5} />
              <XAxis
                dataKey="transition"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12, fill: tickFill }}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <YAxis
                label={{
                  value: 'Success Rate (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: labelFill,
                }}
                tick={{ fontSize: 12, fill: tickFill }}
                domain={[0, 100]}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span style={{ color: tickFill }}>{value}</span>}
              />
              <Bar dataKey="successRate" name="Success Rate" radius={[4, 4, 0, 0]}>
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.successRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

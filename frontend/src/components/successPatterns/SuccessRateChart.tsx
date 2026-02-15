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

interface SuccessRateChartProps {
  data: TransitionData[];
}

export default function SuccessRateChart({ data }: SuccessRateChartProps) {
  const gridStroke = 'rgba(255,255,255,0.14)';
  const axisStroke = 'rgba(255,255,255,0.25)';
  const tickStroke = 'rgba(255,255,255,0.22)';

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
        <div className="border border-white/20 p-3 rounded-sm shadow-2xl" style={{ backgroundColor: 'rgba(20, 18, 15, 0.95)' }}>
          <p className="font-semibold text-white">{label}</p>
          <p className="text-sm text-white/80">
            Success Rate: <span className="font-bold">{data.successRate}%</span>
          </p>
          <p className="text-sm text-white/80">
            Sample Size: <span className="font-bold">{data.sampleSize} employees</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-white/15 bg-white/7 p-6 rounded-sm shadow-2xl backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-4 text-white">
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
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.75)' }}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <YAxis
                label={{
                  value: 'Success Rate (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'rgba(255,255,255,0.60)',
                }}
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.75)' }}
                domain={[0, 100]}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</span>}
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

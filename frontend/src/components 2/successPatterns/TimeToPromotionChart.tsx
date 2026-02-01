import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StageData } from '../../services/successPatternService';

interface TimeToPromotionChartProps {
  data: {
    [department: string]: StageData[];
  };
}

export default function TimeToPromotionChart({ data }: TimeToPromotionChartProps) {
  const gridStroke = 'rgba(255,255,255,0.14)';
  const axisStroke = 'rgba(255,255,255,0.25)';
  const tickStroke = 'rgba(255,255,255,0.22)';

  // Transform data for multi-line chart
  const departments = Object.keys(data);
  if (departments.length === 0) return null;

  const chartData = data[departments[0]].map((item, index) => {
    const result: { stage: string; [key: string]: string | number } = {
      stage: item.stage,
    };
    departments.forEach((dept) => {
      result[dept] = data[dept][index]?.avgYears || 0;
    });
    return result;
  });

  const departmentColors: { [key: string]: string } = {
    Advisory: '#FFE600',
    Tax: '#A1A1AA',
    Consulting: '#71717A',
    Audit: '#52525B',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="border border-white/15 bg-white/7 p-3 rounded-sm shadow-2xl backdrop-blur-md">
          <p className="font-semibold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value} years</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-white/15 bg-white/7 p-6 rounded-sm shadow-2xl backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-4 text-white">
        Average Time to Promotion
      </h3>
      <div className="flex justify-center">
        <div className="w-full max-w-[760px]">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} strokeWidth={1.5} />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.75)' }}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <YAxis
                label={{
                  value: 'Years',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'rgba(255,255,255,0.60)',
                }}
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.75)' }}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</span>}
              />
              {departments.map((dept) => (
                <Line
                  key={dept}
                  type="monotone"
                  dataKey={dept}
                  stroke={departmentColors[dept] || '#71717A'}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

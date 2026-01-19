import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DepartmentData } from '../../services/successPatternService';

interface DepartmentDistributionChartProps {
  data: DepartmentData[];
  onDepartmentClick?: (department: string) => void;
}

export default function DepartmentDistributionChart({
  data,
  onDepartmentClick,
}: DepartmentDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const defaultColors = ['#FFE600', '#A1A1AA', '#71717A', '#52525B', '#3F3F46'];

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DepartmentData;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="border border-white/15 bg-white/7 p-3 rounded-sm shadow-2xl backdrop-blur-md">
          <p className="font-semibold text-white">{data.name}</p>
          <p className="text-sm text-white/60">
            Count: <span className="font-bold">{data.value}</span>
          </p>
          <p className="text-sm text-white/60">
            Percentage: <span className="font-bold">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for very small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="border border-white/15 bg-white/7 p-6 rounded-sm shadow-2xl backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-4 text-white">
        Transitions by Department
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            onClick={(data) => {
              if (onDepartmentClick && data.name) {
                onDepartmentClick(data.name);
              }
            }}
            style={{ cursor: onDepartmentClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-sm text-white/60">
          Total: <span className="font-bold text-white/85">{total} transitions</span>
        </p>
      </div>
    </div>
  );
}

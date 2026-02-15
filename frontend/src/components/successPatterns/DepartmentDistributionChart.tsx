import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
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
  const sliceStroke = 'rgba(255,255,255,0.70)';
  const [hovered, setHovered] = useState<DepartmentData | null>(null);

  const defaultColors = ['#FFE600', '#A1A1AA', '#71717A', '#52525B', '#3F3F46'];

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for very small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const label = `${(percent * 100).toFixed(0)}%`;

    return (
      <>
        {/* outline for contrast against bright slices */}
        <text
          x={x}
          y={y}
          fill="white"
          stroke="rgba(0,0,0,0.65)"
          strokeWidth={3}
          paintOrder="stroke"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={12}
          fontWeight={700}
        >
          {label}
        </text>
      </>
    );
  };

  return (
    <div className="border border-white/15 bg-white/7 p-6 rounded-sm shadow-2xl backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-4 text-white">
        Transitions by Department
      </h3>
      <div className="flex justify-center">
        <div className="w-full max-w-[860px]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_180px] md:gap-6 items-start">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
                    stroke={sliceStroke}
                    strokeWidth={1.6}
                    onMouseEnter={(slice: any) => {
                      if (slice?.name) setHovered(slice as DepartmentData);
                    }}
                    onMouseLeave={() => setHovered(null)}
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
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Fixed tooltip area (no overlap) */}
            <div className="hidden md:block">
              {hovered ? (
                <div className="pointer-events-none w-[180px] border border-white/20 p-2.5 rounded-sm shadow-2xl" style={{ backgroundColor: 'rgba(20, 18, 15, 0.95)' }}>
                  <p className="text-sm font-semibold text-white">{hovered.name}</p>
                  <p className="mt-1 text-xs text-white/80">
                    Count: <span className="text-white/90">{hovered.value}</span>
                  </p>
                  <p className="text-xs text-white/80">
                    %: <span className="text-white/90">{((hovered.value / total) * 100).toFixed(1)}%</span>
                  </p>
                </div>
              ) : (
                <div className="w-[180px]" />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-4">
        <p className="text-sm text-white/60">
          Total: <span className="text-white/60">{total} transitions</span>
        </p>
      </div>
    </div>
  );
}

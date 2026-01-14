import React from 'react';
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
    Tax: '#2E2E38',
    Consulting: '#747480',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-[#2E2E38] mb-2">{label}</p>
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
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-[#2E2E38]">
        Average Time to Promotion
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#2E2E38' }} />
          <YAxis
            label={{ value: 'Years', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12, fill: '#2E2E38' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {departments.map((dept) => (
            <Line
              key={dept}
              type="monotone"
              dataKey={dept}
              stroke={departmentColors[dept] || '#747480'}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

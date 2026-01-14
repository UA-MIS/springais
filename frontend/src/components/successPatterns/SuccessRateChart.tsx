import React from 'react';
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
  // Custom color based on success rate
  const getBarColor = (successRate: number): string => {
    if (successRate >= 70) return '#22c55e'; // Green
    if (successRate >= 50) return '#FFE600'; // Yellow
    return '#dc2626'; // Red
  };

  const sortedData = [...data].sort((a, b) => b.successRate - a.successRate);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TransitionData;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-[#2E2E38]">{label}</p>
          <p className="text-sm text-gray-600">
            Success Rate: <span className="font-bold">{data.successRate}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Sample Size: <span className="font-bold">{data.sampleSize} employees</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-[#2E2E38]">
        Success Rate by Transition
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="transition"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12, fill: '#2E2E38' }}
          />
          <YAxis
            label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12, fill: '#2E2E38' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            payload={[
              { value: 'High (≥70%)', type: 'square', color: '#22c55e' },
              { value: 'Medium (50-69%)', type: 'square', color: '#FFE600' },
              { value: 'Low (<50%)', type: 'square', color: '#dc2626' },
            ]}
          />
          <Bar dataKey="successRate" radius={[4, 4, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.successRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

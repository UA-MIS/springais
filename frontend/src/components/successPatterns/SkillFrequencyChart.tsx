import React from 'react';
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

interface SkillFrequencyChartProps {
  data: SkillFrequency[];
}

export default function SkillFrequencyChart({ data }: SkillFrequencyChartProps) {
  // Get top 10 skills, sorted by frequency
  const topSkills = [...data]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const skill = payload[0].payload as SkillFrequency;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-[#2E2E38]">{skill.skill}</p>
          <p className="text-sm text-gray-600">
            Required for <span className="font-bold">{skill.frequency}%</span> of successful
            transitions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-[#2E2E38]">
        Top Skills for Successful Transitions
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={topSkills}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#2E2E38' }}
            label={{ value: 'Frequency (%)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            type="category"
            dataKey="skill"
            tick={{ fontSize: 12, fill: '#2E2E38' }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="frequency" radius={[0, 4, 4, 0]}>
            {topSkills.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#FFE600" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

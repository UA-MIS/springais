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
  const gridStroke = 'rgba(255,255,255,0.14)';
  const axisStroke = 'rgba(255,255,255,0.25)';
  const tickStroke = 'rgba(255,255,255,0.22)';

  // Get top 10 skills, sorted by frequency
  const topSkills = [...data]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const skill = payload[0].payload as SkillFrequency;
      return (
        <div className="border border-white/20 p-3 rounded-sm shadow-2xl" style={{ backgroundColor: 'rgba(20, 18, 15, 0.95)' }}>
          <p className="font-semibold text-white">{skill.skill}</p>
          <p className="text-sm text-white/80">
            Required for <span className="font-bold">{skill.frequency}%</span> of successful
            transitions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-white/15 bg-white/7 p-6 rounded-sm shadow-2xl backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-4 text-white">
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
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.75)' }}
                label={{
                  value: 'Frequency (%)',
                  position: 'bottom',
                  offset: 10,
                  fill: 'rgba(255,255,255,0.60)',
                }}
                axisLine={{ stroke: axisStroke, strokeWidth: 1.5 }}
                tickLine={{ stroke: tickStroke, strokeWidth: 1 }}
              />
              <YAxis
                type="category"
                dataKey="skill"
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.75)' }}
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

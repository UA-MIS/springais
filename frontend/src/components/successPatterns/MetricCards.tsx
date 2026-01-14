import React from 'react';
import { SuccessPatternMetrics } from '../../services/successPatternService';

interface MetricCardsProps {
  metrics: SuccessPatternMetrics;
}

export default function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Average Time to Promotion */}
      <div className="bg-white p-6 rounded-lg shadow hover:border-2 hover:border-[#FFE600] transition-all border-2 border-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFE600] bg-opacity-20 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#FFE600]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Time to Promotion</p>
            <p className="text-2xl font-bold text-[#2E2E38]">{metrics.avgTimeToPromotion} years</p>
          </div>
        </div>
      </div>

      {/* Overall Success Rate */}
      <div className="bg-white p-6 rounded-lg shadow hover:border-2 hover:border-[#FFE600] transition-all border-2 border-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFE600] bg-opacity-20 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#FFE600]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Overall Success Rate</p>
            <p className="text-2xl font-bold text-[#2E2E38]">
              {(metrics.overallSuccessRate * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Sample Size */}
      <div className="bg-white p-6 rounded-lg shadow hover:border-2 hover:border-[#FFE600] transition-all border-2 border-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFE600] bg-opacity-20 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#FFE600]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sample Size</p>
            <p className="text-2xl font-bold text-[#2E2E38]">{metrics.totalSampleSize} transitions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

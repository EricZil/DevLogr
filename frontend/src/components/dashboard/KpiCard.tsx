import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: string;
  progress?: number;
  sparklineData?: number[];
  className?: string;
}

export default function KpiCard({ 
  title, 
  value, 
  trend, 
  progress, 
  sparklineData, 
  className = ""
}: KpiCardProps) {
  return (
    <div className={`rounded-xl p-6 transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
          <div className="text-3xl font-bold text-white">{value}</div>
        </div>
        
        {trend && (
          <div className="flex items-center space-x-1 text-green-400 bg-green-500/20 px-2 py-1 rounded-md border border-green-500/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="font-medium text-white">{progress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-2">7-day trend</div>
          <div className="h-12 flex items-end space-x-1">
            {sparklineData.map((value, index) => {
              const maxValue = Math.max(...sparklineData);
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-400/60 rounded-sm"
                  style={{ 
                    height: `${height}%`,
                    minHeight: '4px'
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

 
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
    <div className={`bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-black/50 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">{title}</h3>
          <div className="text-3xl font-bold text-white">{value}</div>
        </div>
        
        {trend && (
          <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
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
            <span className="text-zinc-400">Progress</span>
            <span className="font-medium text-white">{progress}%</span>
          </div>
          <div className="w-full bg-zinc-700/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-zinc-400 mb-2">7-day trend</div>
          <div className="h-12 flex items-end space-x-1">
            {sparklineData.map((value, index) => {
              const maxValue = Math.max(...sparklineData);
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-400/60 rounded-sm transition-all duration-300"
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

 
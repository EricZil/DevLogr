'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import KpiCard from './KpiCard';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalUpdates: number;
  avgProgress: number;
}

interface PerformanceMetricsProps {
  stats: DashboardStats | null;
  updatesTrend: number[];
}

export default function PerformanceMetrics({ stats, updatesTrend }: PerformanceMetricsProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
          <p className="text-gray-400">Real-time insights into your project ecosystem</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border border-white/20 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Projects"
          value={stats ? stats.totalProjects.toString() : '0'}
          trend="+12%"
          className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
        />

        <KpiCard
          title="Active Projects" 
          value={stats ? stats.activeProjects.toString() : '0'}
          trend="+8%"
          className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
        />

        <KpiCard
          title="Total Updates"
          value={stats ? stats.totalUpdates.toString() : '0'}
          trend="+24%"
          sparklineData={updatesTrend}
          className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
        />

        <KpiCard
          title="Avg Progress"
          value={`${stats ? stats.avgProgress : 0}%`}
          progress={stats ? stats.avgProgress : 0}
          className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
        />
      </div>
    </section>
  );
} 
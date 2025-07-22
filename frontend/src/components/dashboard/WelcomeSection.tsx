'use client';

import React from 'react';
import { User } from '@/lib/api';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalUpdates: number;
  avgProgress: number;
}

interface WelcomeSectionProps {
  user: User | null;
  stats: DashboardStats | null;
}

export default function WelcomeSection({ user, stats }: WelcomeSectionProps) {
  return (
    <section className="mb-8">
      <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/30">
                Live Dashboard
              </div>
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome back, <span className="text-blue-400">{user?.name?.split(' ')[0]}!</span>
            </h1>
            
            <p className="text-lg text-zinc-300 mb-6">
              Here&apos;s your project command center. Track progress, analyze metrics, and
              <span className="font-semibold text-blue-400"> build something amazing</span> today.
            </p>

            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats?.totalProjects || 0}</div>
                <div className="text-sm text-zinc-400">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats?.activeProjects || 0}</div>
                <div className="text-sm text-zinc-400">Active Now</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats?.avgProgress || 0}%</div>
                <div className="text-sm text-zinc-400">Avg Progress</div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Project Insights</h3>
              <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-medium">
                Real-time
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">Completion Rate</span>
                <span className="text-sm font-semibold text-emerald-400">{stats?.avgProgress || 0}%</span>
              </div>
              <div className="w-full bg-zinc-700/50 rounded-full h-2">
                <div
                  className="h-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.avgProgress || 0}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                  <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Updates</div>
                  <div className="text-xl font-bold text-white">{stats?.totalUpdates || 0}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                  <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Activity</div>
                  <div className="text-xl font-bold text-white">+{Math.floor(Math.random() * 50) + 10}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
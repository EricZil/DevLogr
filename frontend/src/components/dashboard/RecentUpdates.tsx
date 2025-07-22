'use client';

import React, { useMemo } from 'react';
import { Activity, FileText } from 'lucide-react';
import { Update as ProjectUpdate } from '@/types';

interface RecentUpdatesProps {
  recentUpdates: ProjectUpdate[];
  updatesLoading: boolean;
}

export default function RecentUpdates({ recentUpdates, updatesLoading }: RecentUpdatesProps) {
  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'FEATURE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PROGRESS': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'RELEASE': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'BUGFIX': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-700/50 text-zinc-300 border-zinc-600/50';
    }
  };

  const groupedUpdates = useMemo(() => {
    if (recentUpdates.length === 0) return [];

    const groups: { [key: string]: ProjectUpdate[] } = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const formatLabel = (d: Date) => {
      const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
      if (sameDay(d, today)) return 'Today';
      if (sameDay(d, yesterday)) return 'Yesterday';
      return d.toLocaleDateString();
    };

    recentUpdates.forEach((u) => {
      const date = new Date(u.createdAt);
      const label = formatLabel(date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(u);
    });

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
  }, [recentUpdates]);

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Recent Updates</h2>
          <p className="text-zinc-400">Latest activity across your projects</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25">
          <Activity className="w-4 h-4" />
          <span className="text-sm">View All</span>
        </button>
      </div>

      {updatesLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-zinc-700/50 rounded-2xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-zinc-700/50 rounded w-full"></div>
                  <div className="h-3 bg-zinc-700/50 rounded w-3/4"></div>
                  <div className="h-2 bg-zinc-700/50 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : groupedUpdates.length === 0 ? (
        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-zinc-800/50 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">Ready for Updates?</h3>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            Create a project and start sharing your development journey with the world!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedUpdates.map(({ label, items }) => (
            <div key={label}>
              <h3 className="text-lg font-semibold text-white mb-6">{label}</h3>
              <div className="space-y-4">
                {items.map((update) => (
                  <div
                    key={update.id}
                    className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-white line-clamp-1 group-hover:text-blue-100 transition-colors">
                              {update.title}
                            </h4>
                            <div className="flex items-center space-x-3 mt-2">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getUpdateTypeColor(update.type)}`}>
                                {update.type}
                              </span>
                              <span className="text-sm text-zinc-400">{update.project?.title}</span>
                            </div>
                          </div>
                          <span className="text-xs text-zinc-400 flex-shrink-0 ml-4">
                            {new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{update.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
} 
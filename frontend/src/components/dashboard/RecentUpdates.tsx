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
      case 'FEATURE': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PROGRESS': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'RELEASE': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'BUGFIX': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-white/10 text-gray-300 border-white/20';
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Recent Updates</h2>
          <p className="text-gray-400">Latest activity across your projects</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20 transition-colors">
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">View All</span>
        </button>
      </div>

      {updatesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-3 bg-white/10 rounded w-3/4"></div>
                  <div className="h-2 bg-white/10 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : groupedUpdates.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center backdrop-blur-sm">
          <div className="w-16 h-16 mx-auto mb-6 bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-3">Ready for Updates?</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Create a project and start sharing your development journey with the world!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedUpdates.map(({ label, items }) => (
            <div key={label}>
              <h3 className="text-lg font-semibold text-white mb-4">{label}</h3>
              <div className="space-y-4">
                {items.map((update) => (
                  <div
                    key={update.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all backdrop-blur-sm"
                  >
                    <div className="flex space-x-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-white line-clamp-1">
                              {update.title}
                            </h4>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getUpdateTypeColor(update.type)}`}>
                                {update.type}
                              </span>
                              <span className="text-sm text-gray-400">{update.project?.title}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                            {new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">{update.content}</p>
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
'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useNotification } from '@/contexts/NotificationContext';

const AddUpdateModal = dynamic(
  () => import('@/components/modals/AddUpdateModal'),
  { ssr: false }
);

interface Update {
  id: string;
  title: string;
  content: string;
  type: 'PROGRESS' | 'MILESTONE' | 'FEATURE' | 'BUGFIX' | 'ANNOUNCEMENT' | 'RELEASE';
  images?: string[] | null;
  createdAt: string;
}

interface UpdateStats {
  total: number;
  counts: Record<string, number>;
}

interface UpdateManagerProps {
  projectId: string;
}


export default function UpdateManager({ projectId }: UpdateManagerProps) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [stats, setStats] = useState<UpdateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { success, error } = useNotification();

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const token = api.getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=updates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setUpdates(result.data);
        } else {
          console.error('Invalid updates response format:', result);
          setUpdates([]);
        }
      } else {
        error('Failed to load updates');
        setUpdates([]);
      }
    } catch (err) {
      console.error('Fetch updates error:', err);
      error('An error occurred');
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, error]);

  const fetchStats = useCallback(async () => {
    try {
      const token = api.getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=updates&subaction=stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          console.error('Invalid stats response format:', result);
          setStats({ total: 0, counts: {} });
        }
      } else {
        setStats({ total: 0, counts: {} });
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
      setStats({ total: 0, counts: {} });
    }
  }, [projectId]);

  useEffect(() => {
    fetchUpdates();
    fetchStats();
  }, [fetchUpdates, fetchStats]);

  const handleUpdateCreated = () => {
    fetchUpdates();
    fetchStats();
    success('Update created successfully!');
  };

  const deleteUpdate = async (id: string) => {
    if (!confirm('Delete this update?')) return;
    try {
      const token = api.getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/updates?id=${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        success('Update deleted');
        setUpdates((prev) => prev.filter((u) => u.id !== id));
        fetchStats();
      } else {
        error('Failed to delete update');
      }
    } catch (err) {
      console.error('Delete update error:', err);
      error('An error occurred');
    }
  };
  const getTypeBadge = (type: Update['type']) => {
    switch (type) {
      case 'PROGRESS':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'MILESTONE':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'FEATURE':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'BUGFIX':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'ANNOUNCEMENT':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'RELEASE':
        return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
    }
  };

  const getTypeColor = (type: Update['type']) => {
    switch (type) {
      case 'FEATURE':
        return 'bg-emerald-500';
      case 'PROGRESS':
        return 'bg-blue-500';
      case 'RELEASE':
        return 'bg-purple-500';
      case 'BUGFIX':
        return 'bg-red-500';
      case 'MILESTONE':
        return 'bg-yellow-500';
      case 'ANNOUNCEMENT':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const TypeIcon = ({ type }: { type: Update['type'] }) => {
    switch (type) {
      case 'FEATURE':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'PROGRESS':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'MILESTONE':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'RELEASE':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3M7 4H5a1 1 0 00-1 1v16a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1h-2M7 4h10" />
          </svg>
        );
      case 'BUGFIX':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7h-1a4 4 0 00-7.8-1.5M5 11v-1a4 4 0 017.8-1.5M5 13v1a4 4 0 007.8 1.5M19 17v-1a4 4 0 00-7.8-1.5" />
          </svg>
        );
      case 'ANNOUNCEMENT':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 5H8a2 2 0 00-2 2v4a2 2 0 002 2h8l5 5V0l-5 5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        {(
          [
            { label: 'Total Updates', count: stats?.total || 0, color: 'blue', icon: (
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )},
            { label: 'Progress', count: stats?.counts?.['PROGRESS'] || 0, color: 'purple', icon: (
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )},
            { label: 'Milestone', count: stats?.counts?.['MILESTONE'] || 0, color: 'yellow', icon: (
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )},
            { label: 'Feature', count: stats?.counts?.['FEATURE'] || 0, color: 'emerald', icon: (
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )},
            { label: 'Bugfix', count: stats?.counts?.['BUGFIX'] || 0, color: 'red', icon: (
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7h-1a4 4 0 00-7.8-1.5M5 11v-1a4 4 0 017.8-1.5M5 13v1a4 4 0 007.8 1.5M19 17v-1a4 4 0 00-7.8-1.5" />
              </svg>
            )},
            { label: 'Announcement', count: stats?.counts?.['ANNOUNCEMENT'] || 0, color: 'indigo', icon: (
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 5H8a2 2 0 00-2 2v4a2 2 0 002 2h8l5 5V0l-5 5z" />
              </svg>
            )},
            { label: 'Release', count: stats?.counts?.['RELEASE'] || 0, color: 'cyan', icon: (
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3M7 4H5a1 1 0 00-1 1v16a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1h-2M7 4h10" />
              </svg>
            )},
          ]
        ).map((tile) => (
          <div
            key={tile.label}
            className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm font-medium mb-1">{tile.label}</p>
                <p className="text-3xl font-bold text-white">{tile.count}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${tile.color}-500/20`}>{tile.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setIsAddModalOpen(true)}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>New Update</span>
      </button>

      <AddUpdateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUpdateCreated={handleUpdateCreated}
        projectId={projectId}
      />

      <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Development Timeline
            </h1>
            <p className="text-zinc-400">Track every significant update to your project</p>
          </div>
          {updates.length > 0 && (
            <p className="text-zinc-400 text-sm">Newest first</p>
          )}
        </div>

        <div className="space-y-6">
          {updates.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-zinc-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Updates Yet</h3>
              <p className="text-zinc-500">Create your first update to kick off the timeline.</p>
            </div>
          )}

          {updates.map((u) => (
            <div
              key={u.id}
              className="bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-xl ${getTypeColor(u.type)} flex items-center justify-center shadow-lg`}
                    >
                      <TypeIcon type={u.type} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{u.title}</h3>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getTypeBadge(
                            u.type
                          )}`}
                        >
                          {u.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-zinc-400 bg-black/30 px-3 py-1 rounded-lg">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => deleteUpdate(u.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete update"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{u.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
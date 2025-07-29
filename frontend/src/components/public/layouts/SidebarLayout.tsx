'use client';

import React from 'react';
import { useLayoutClasses } from '@/contexts/LayoutContext';
import PoweredByFooter from '@/components/public/PoweredByFooter';
import { ProjectData } from '@/types';

interface SidebarLayoutProps {
  projectData: ProjectData;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  onIssueClick?: () => void;
  onFeedbackClick?: () => void;
}

export default function SidebarLayout({
  projectData,
  activeTab,
  onTabChange,
  children,
  onIssueClick,
  onFeedbackClick
}: SidebarLayoutProps) {
  const layoutClasses = useLayoutClasses();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'updates', name: 'Updates', icon: '📝', count: projectData._count?.updates || 0 },
    { id: 'milestones', name: 'Milestones', icon: '🎯', count: projectData._count?.milestones || 0 },
    ...(projectData.allowIssues ? [{ id: 'issues', name: 'Issues', icon: '🐛', count: projectData._count?.issues || 0 }] : []),
    ...(projectData.allowFeedback ? [{ id: 'feedback', name: 'Feedback', icon: '💬', count: projectData._count?.feedback || 0 }] : []),
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'COMPLETED': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'PAUSED': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'DRAFT': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-pink-900/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <aside className={layoutClasses.navigation}>
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-12 h-12 rounded-xl ${projectData.color || 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center text-2xl shadow-lg`}>
                {projectData.icon || '📁'}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white truncate">{projectData.title}</h1>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(projectData.status)}`}>
                  {projectData.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-zinc-400">Progress</span>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - projectData.progress / 100)}`}
                    className="text-blue-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{projectData.progress}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {projectData.allowIssues && (
                <button
                  onClick={onIssueClick}
                  className="w-full flex items-center space-x-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Report Issue</span>
                </button>
              )}
              
              {projectData.allowFeedback && (
                <button
                  onClick={onFeedbackClick}
                  className="w-full flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                  </svg>
                  <span>Give Feedback</span>
                </button>
              )}
            </div>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={layoutClasses.header}>
          <div className="max-w-none mx-auto px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white capitalize">
                  {tabs.find(tab => tab.id === activeTab)?.name || 'Overview'}
                </h2>
                <p className="text-sm text-zinc-400">{projectData.description}</p>
              </div>
              <div className="text-sm text-zinc-400">
                by {projectData.user.name}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>

        <PoweredByFooter className="border-t border-white/10" />
      </div>
    </>
  );
}
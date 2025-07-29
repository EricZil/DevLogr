'use client';

import React from 'react';
import { useLayoutClasses } from '@/contexts/LayoutContext';
import PoweredByFooter from '@/components/public/PoweredByFooter';
import { ProjectData } from '@/types';

interface GridLayoutProps {
  projectData: ProjectData;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  onIssueClick?: () => void;
  onFeedbackClick?: () => void;
}

export default function GridLayout({
  projectData,
  activeTab,
  onTabChange,
  children,
  onIssueClick,
  onFeedbackClick
}: GridLayoutProps) {
  const layoutClasses = useLayoutClasses();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊', description: 'Project overview and stats' },
    { id: 'updates', name: 'Updates', icon: '📝', count: projectData._count?.updates || 0, description: 'Development timeline' },
    { id: 'milestones', name: 'Milestones', icon: '🎯', count: projectData._count?.milestones || 0, description: 'Project milestones' },
    ...(projectData.allowIssues ? [{ id: 'issues', name: 'Issues', icon: '🐛', count: projectData._count?.issues || 0, description: 'Bug reports and issues' }] : []),
    ...(projectData.allowFeedback ? [{ id: 'feedback', name: 'Feedback', icon: '💬', count: projectData._count?.feedback || 0, description: 'User feedback' }] : []),
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

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className={layoutClasses.header}>
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg ${projectData.color || 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center text-xl shadow-lg`}>
                  {projectData.icon || '📁'}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{projectData.title}</h1>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-zinc-400">by {projectData.user.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(projectData.status)}`}>
                      {projectData.status}
                    </span>
                    <span className="text-zinc-400">{projectData.progress}% complete</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {projectData.allowIssues && (
                  <button
                    onClick={onIssueClick}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 text-sm"
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
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                    </svg>
                    <span>Give Feedback</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border-blue-500/30 shadow-lg shadow-blue-500/10'
                      : 'bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
                  )}
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        activeTab === tab.id
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        {tab.icon}
                      </div>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeTab === tab.id
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-zinc-700 text-zinc-300'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`text-lg font-semibold mb-2 ${
                      activeTab === tab.id ? 'text-white' : 'text-zinc-200'
                    }`}>
                      {tab.name}
                    </h3>
                    
                    <p className={`text-sm ${
                      activeTab === tab.id ? 'text-zinc-300' : 'text-zinc-400'
                    }`}>
                      {tab.description}
                    </p>

                    {activeTab === tab.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <span className="text-2xl mr-3">
                      {tabs.find(tab => tab.id === activeTab)?.icon}
                    </span>
                    {tabs.find(tab => tab.id === activeTab)?.name}
                  </h2>
                  {projectData.description && activeTab === 'overview' && (
                    <p className="text-zinc-400 max-w-md text-right">
                      {projectData.description}
                    </p>
                  )}
                </div>
                
                {children}
              </div>
            </div>
          </div>
        </main>

        <PoweredByFooter />
      </div>

      <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-20 hidden xl:block">
        <div className="bg-gradient-to-br from-black/60 via-zinc-900/60 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-64">
          <h3 className="text-sm font-semibold text-white mb-4">Project Stats</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Progress</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${projectData.progress}%` }}
                  />
                </div>
                <span className="text-xs text-white font-medium">{projectData.progress}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Updates</span>
              <span className="text-xs text-white font-medium">{projectData._count?.updates || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Milestones</span>
              <span className="text-xs text-white font-medium">{projectData._count?.milestones || 0}</span>
            </div>
            
            {projectData.allowIssues && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Issues</span>
                <span className="text-xs text-white font-medium">{projectData._count?.issues || 0}</span>
              </div>
            )}
            
            {projectData.allowFeedback && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Feedback</span>
                <span className="text-xs text-white font-medium">{projectData._count?.feedback || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
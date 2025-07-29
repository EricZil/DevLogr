'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { ProjectData } from '@/types';

interface LayoutPreviewProps {
  projectData: ProjectData;
  className?: string;
}

export default function LayoutPreview({ projectData, className = '' }: LayoutPreviewProps) {
  const { currentLayout, previewMode, previewLayout } = useLayout();
  
  const activeLayout = previewMode && previewLayout ? previewLayout : currentLayout;

  if (!projectData) {
    return (
      <div className={`${className}`}>
        <div className="w-full h-96 bg-gradient-to-br from-zinc-900 to-black rounded-lg overflow-hidden border border-zinc-700 flex items-center justify-center">
          <div className="text-zinc-400 text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <div>Project data not available</div>
          </div>
        </div>
      </div>
    );
  }

  const mockTabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'updates', name: 'Updates', icon: '📝' },
    { id: 'milestones', name: 'Milestones', icon: '🎯' },
    { id: 'issues', name: 'Issues', icon: '🐛' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
  ];

  const renderDefaultLayout = () => (
    <div className="w-full h-96 bg-gradient-to-br from-zinc-900 to-black rounded-lg overflow-hidden border border-zinc-700">
      <div className="h-16 bg-black/60 border-b border-white/10 flex items-center px-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm">
            📁
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{projectData?.title || 'Project Title'}</div>
            <div className="text-zinc-400 text-xs">by {projectData?.user?.name || 'Unknown User'}</div>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded border border-emerald-500/30">
            {projectData?.status || 'ACTIVE'}
          </div>
        </div>
      </div>
      
      <div className="h-12 bg-black/40 border-b border-white/10 flex items-center px-4 space-x-6">
        {mockTabs.map((tab, index) => (
          <div key={tab.id} className={`flex items-center space-x-1 text-xs ${index === 0 ? 'text-blue-400 border-b-2 border-blue-500' : 'text-zinc-400'}`}>
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </div>
        ))}
      </div>
      
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
        </div>
        <div className="h-32 bg-zinc-800 rounded mt-4"></div>
      </div>
    </div>
  );

  const renderSidebarLayout = () => (
    <div className="w-full h-96 bg-gradient-to-br from-zinc-900 to-black rounded-lg overflow-hidden border border-zinc-700 flex">
      <div className="w-48 bg-black/60 border-r border-white/10 p-3">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded text-xs flex items-center justify-center">
            📁
          </div>
          <div>
            <div className="text-white text-xs font-semibold truncate">{projectData?.title || 'Project Title'}</div>
            <div className="text-zinc-400 text-xs">{projectData?.progress || 0}%</div>
          </div>
        </div>
        
        <div className="space-y-1">
          {mockTabs.map((tab, index) => (
            <div key={tab.id} className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${index === 0 ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-400'}`}>
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-black/40 border-b border-white/10 flex items-center px-4">
          <div className="text-white text-sm font-semibold">Overview</div>
          <div className="ml-auto text-zinc-400 text-xs">by {projectData?.user?.name || 'Unknown User'}</div>
        </div>
        
        <div className="flex-1 p-3 space-y-2">
          <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
          <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="h-12 bg-zinc-800 rounded"></div>
            <div className="h-12 bg-zinc-800 rounded"></div>
          </div>
          <div className="h-20 bg-zinc-800 rounded mt-3"></div>
        </div>
      </div>
    </div>
  );

  const renderGridLayout = () => (
    <div className="w-full h-96 bg-gradient-to-br from-zinc-900 to-black rounded-lg overflow-hidden border border-zinc-700">
      <div className="h-12 bg-black/40 border-b border-white/10 flex items-center px-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded text-xs flex items-center justify-center">
            📁
          </div>
          <div className="text-white text-sm font-semibold">{projectData?.title || 'Project Title'}</div>
          <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
            {projectData?.status || 'ACTIVE'}
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {mockTabs.slice(0, 3).map((tab, index) => (
            <div key={tab.id} className={`p-2 rounded border text-xs ${index === 0 ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
              <div className="flex items-center space-x-1 mb-1">
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </div>
              <div className="h-2 bg-zinc-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-zinc-800 rounded p-3 space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">📊</span>
            <span className="text-white text-sm font-semibold">Overview</span>
          </div>
          <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
          <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="h-8 bg-zinc-700 rounded"></div>
            <div className="h-8 bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Layout Preview: {activeLayout.charAt(0).toUpperCase() + activeLayout.slice(1)}
        </h3>
        {previewMode && (
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview Mode Active - This is how your public page will look</span>
          </div>
        )}
      </div>
      
      {activeLayout === 'default' && renderDefaultLayout()}
      {activeLayout === 'sidebar' && renderSidebarLayout()}
      {activeLayout === 'grid' && renderGridLayout()}
    </div>
  );
}
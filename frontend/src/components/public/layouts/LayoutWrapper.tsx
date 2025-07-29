'use client';

import React from 'react';
import { useLayout, useLayoutClasses } from '@/contexts/LayoutContext';
import DefaultLayout from './DefaultLayout';
import SidebarLayout from './SidebarLayout';
import GridLayout from './GridLayout';
import { ProjectData } from '@/types';

interface LayoutWrapperProps {
  projectData: ProjectData;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  onIssueClick?: () => void;
  onFeedbackClick?: () => void;
}

export default function LayoutWrapper({
  projectData,
  activeTab,
  onTabChange,
  children,
  onIssueClick,
  onFeedbackClick
}: LayoutWrapperProps) {
  const { currentLayout, previewMode } = useLayout();
  const layoutClasses = useLayoutClasses();

  const PreviewIndicator = () => {
    if (!previewMode) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 bg-blue-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-blue-400/30">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-sm font-medium">Preview Mode</span>
        </div>
      </div>
    );
  };

  const commonProps = {
    projectData,
    activeTab,
    onTabChange,
    children,
    onIssueClick,
    onFeedbackClick
  };

  return (
    <>
      <PreviewIndicator />
      <div className={layoutClasses.container}>
        {currentLayout === 'sidebar' && <SidebarLayout {...commonProps} />}
        {currentLayout === 'grid' && <GridLayout {...commonProps} />}
        {currentLayout === 'default' && <DefaultLayout {...commonProps} />}
      </div>
    </>
  );
}
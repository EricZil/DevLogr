'use client';

import React from 'react';
import { useLayoutClasses } from '@/contexts/LayoutContext';
import ProjectHeader from '@/components/public/ProjectHeader';
import ProjectTabs from '@/components/public/ProjectTabs';
import PoweredByFooter from '@/components/public/PoweredByFooter';
import { ProjectData } from '@/types';

interface DefaultLayoutProps {
  projectData: ProjectData;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  onIssueClick?: () => void;
  onFeedbackClick?: () => void;
}

export default function DefaultLayout({
  projectData,
  activeTab,
  onTabChange,
  children,
  onIssueClick,
  onFeedbackClick
}: DefaultLayoutProps) {
  const layoutClasses = useLayoutClasses();

  return (
    <>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-pink-900/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative z-10">
        <header className={layoutClasses.header}>
          <ProjectHeader 
            projectData={projectData}
            subdomain={projectData.slug}
            onIssueClick={onIssueClick || (() => {})}
            onFeedbackClick={onFeedbackClick || (() => {})}
            allowIssues={projectData.allowIssues}
            allowFeedback={projectData.allowFeedback}
          />
        </header>

        <nav className={layoutClasses.navigation}>
          <ProjectTabs 
            activeTab={activeTab}
            onTabChange={onTabChange}
            issueCount={projectData._count?.issues || 0}
            feedbackCount={projectData._count?.feedback || 0}
            milestoneCount={projectData._count?.milestones || 0}
            updateCount={projectData._count?.updates || 0}
            allowIssues={projectData.allowIssues}
            allowFeedback={projectData.allowFeedback}
          />
        </nav>

        <main className="relative">
          <div className={layoutClasses.content}>
            {children}
          </div>
        </main>

        <PoweredByFooter />
      </div>
    </>
  );
}
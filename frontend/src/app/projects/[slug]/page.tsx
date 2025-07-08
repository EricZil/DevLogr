'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectHeader from '@/components/public/ProjectHeader';
import ProjectTabs from '@/components/public/ProjectTabs';
import OverviewTab from '@/components/public/tabs/OverviewTab';
import UpdatesTab from '@/components/public/tabs/UpdatesTab';
import MilestonesTab from '@/components/public/tabs/MilestonesTab';
import IssuesTab from '@/components/public/tabs/IssuesTab';
import FeedbackTab from '@/components/public/tabs/FeedbackTab';
import IssueModal from '@/components/public/modals/IssueModal';
import FeedbackModal from '@/components/public/modals/FeedbackModal';
import PoweredByFooter from '@/components/public/PoweredByFooter';
import { ProjectData, Issue } from '@/types';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);

  const handleIssueCreated = (issue: Issue) => {
    setIssues(prev => [issue, ...prev]);
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public?action=project&slug=${encodeURIComponent(slug)}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setProjectData(result.data);
            setError(null);
          } else {
            setError('Failed to load project data');
          }

          try {
            const issuesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public?action=issues&slug=${encodeURIComponent(slug)}`, {
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });

            if (issuesRes.ok) {
              const issuesResult = await issuesRes.json();
              if (issuesResult.success && Array.isArray(issuesResult.data)) {
                setIssues(issuesResult.data);
              }
            }
          } catch (err) {
            console.error('Failed to fetch issues:', err);
          }
        } else if (response.status === 404) {
          setError('Project not found');
        } else {
          setError('Failed to load project');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const renderTabContent = () => {
    if (!projectData) return null;

    switch (activeTab) {
      case 'overview':
        return <OverviewTab projectData={projectData} />;
      case 'milestones':
        return <MilestonesTab milestones={projectData.milestones} />;
      case 'updates':
        return <UpdatesTab updates={projectData.updates} />;
      case 'issues':
        return <IssuesTab issues={issues} projectSlug={slug} />;
      case 'feedback':
        return <FeedbackTab feedback={projectData.feedback} />;
      default:
        return <OverviewTab projectData={projectData} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Loading Project</h3>
            <p className="text-zinc-400">Fetching project details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-pink-900/20"></div>
        <div className="relative z-10 text-center max-w-md mx-auto p-8">
          <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-red-500/20">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{error}</h3>
          <p className="text-zinc-400 mb-6">
            {error === 'Project not found' 
              ? 'The project you\'re looking for doesn\'t exist or may have been deleted.'
              : 'Something went wrong while loading the project. Please try again.'
            }
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
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
        <ProjectHeader 
          projectData={projectData}
          subdomain={slug}
          onIssueClick={() => setIsIssueModalOpen(true)}
          onFeedbackClick={() => setIsFeedbackModalOpen(true)}
          allowIssues={projectData.allowIssues}
          allowFeedback={projectData.allowFeedback}
        />

        <ProjectTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          issueCount={issues.length}
          feedbackCount={projectData.feedback?.length || 0}
          milestoneCount={projectData.milestones?.length || 0}
          updateCount={projectData.updates?.length || 0}
          allowIssues={projectData.allowIssues}
          allowFeedback={projectData.allowFeedback}
        />

        <div className="relative">
        {renderTabContent()}
        </div>
        <PoweredByFooter />
        {projectData.allowIssues && (
          <IssueModal 
            isOpen={isIssueModalOpen}
            onClose={() => setIsIssueModalOpen(false)}
            projectTitle={projectData.title}
            projectSlug={slug}
            onIssueCreated={handleIssueCreated}
          />
        )}
        
        {projectData.allowFeedback && (
          <FeedbackModal 
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            projectTitle={projectData.title}
            projectSlug={slug}
          />
        )}
      </div>
    </div>
  );
} 
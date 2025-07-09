'use client';

import { useState, useEffect } from 'react';
import { api, domainUtils } from '@/lib/api';
import LoadingScreen from '@/components/shared/ui/LoadingScreen';
import OverviewTab from '@/components/public/tabs/OverviewTab';
import UpdatesTab from '@/components/public/tabs/UpdatesTab';
import MilestonesTab from '@/components/public/tabs/MilestonesTab';
import IssuesTab from '@/components/public/tabs/IssuesTab';
import FeedbackTab from '@/components/public/tabs/FeedbackTab';
import IssueModal from '@/components/public/modals/IssueModal';
import FeedbackModal from '@/components/public/modals/FeedbackModal';
import { Issue } from '@/types';

interface PublicProject {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  progress: number;
  banner: string | null;
  status: string;
  allowIssues: boolean;
  allowFeedback: boolean;
  customDomain: string | null;
  domainVerified: boolean;
  startDate: string;
  endDate: string | null;
  user: {
    name: string;
    username: string | null;
    avatar: string | null;
  };
  tags: Array<{
    tag: { name: string };
  }>;
  updates: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    images: string[];
    createdAt: string;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    completedAt: string | null;
    progress: number;
  }>;
  feedback: Array<{
    id: string;
    message: string;
    rating: number | null;
    category: string;
    submitterName: string | null;
    createdAt: string;
  }>;
}

type TabType = 'overview' | 'updates' | 'milestones' | 'issues' | 'feedback';

export default function PublicProjectPage() {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const domainInfo = domainUtils.getDomainInfo();
        const identifier = domainUtils.getProjectIdentifier();

        if (!identifier) {
          throw new Error('No project identifier found');
        }

        let response;
        if (domainInfo.type === 'subdomain') {
          response = await api.getPublicProject(identifier, 'slug');
        } else if (domainInfo.type === 'custom') {
          response = await api.getPublicProject(identifier, 'domain');
        } else {
          throw new Error('Invalid domain type');
        }

        if (!response.success || !response.data) {
          throw new Error(response.message || response.error || 'Project not found');
        }

        setProject(response.data);
        if (response.data.allowIssues) {
          fetchIssues(response.data.slug);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, []);
  
  const fetchIssues = async (slug: string) => {
    try {
      setIssuesLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public?action=issues&slug=${encodeURIComponent(slug)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setIssues(data.data);
          console.log("Issues loaded successfully:", data.data.length);
        } else {
          console.error('Failed to parse issues:', data);
          setIssues([]);
        }
      } else {
        console.error('Failed to fetch issues:', response.status);
        setIssues([]);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    if (project?.slug && project?.allowIssues && !issuesLoading) {
      fetchIssues(project.slug);
    }
  }, [project?.slug, project?.allowIssues, issuesLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'COMPLETED': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'PAUSED': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'DRAFT': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'updates', name: 'Updates', icon: '📝' },
    { id: 'milestones', name: 'Milestones', icon: '🎯' },
    ...(project?.allowIssues ? [{ id: 'issues', name: 'Issues', icon: '🐛' }] : []),
    ...(project?.allowFeedback ? [{ id: 'feedback', name: 'Feedback', icon: '💬' }] : []),
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    const domainInfo = domainUtils.getDomainInfo();
    const identifier = domainUtils.getProjectIdentifier();
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-pink-900/20"></div>
        <div className="relative z-10 text-center max-w-md mx-auto p-8">
          <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-red-500/20">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Project Not Found</h3>
          <p className="text-zinc-400 mb-6">Network error occurred</p>
          <div className="text-sm text-zinc-500 space-y-2">
            <p>This project may be:</p>
            <ul className="list-disc list-inside text-left space-y-1">
              <li>Private or not yet published</li>
              <li>Deleted or moved</li>
              <li>Not properly configured</li>
              {domainInfo.type === 'subdomain' && (
                <li>The subdomain &quot;{identifier}&quot; doesn&apos;t have a project associated with it</li>
              )}
            </ul>
          </div>
          <div className="mt-8">
            <a 
              href="https://devlogr.space" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              ← Back to DevLogr
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-pink-900/20"></div>
        <div className="relative z-10 text-center max-w-md mx-auto p-8">
          <h3 className="text-xl font-semibold text-white mb-3">Project Not Found</h3>
          <p className="text-zinc-400">This project does not exist or is not public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-pink-900/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <header className="relative z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                  📁
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{project.title}</h1>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-zinc-400">by {project.user.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <span className="text-sm text-zinc-400">{project.progress}% complete</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {project.allowIssues && (
                <button
                  onClick={() => setIsIssueModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm font-medium">Report Issue</span>
                </button>
              )}
              
              {project.allowFeedback && (
                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                  </svg>
                  <span className="text-sm font-medium">Give Feedback</span>
                </button>
              )}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
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
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - project.progress / 100)}`}
                    className="text-blue-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{project.progress}%</span>
                </div>
              </div>
            </div>
          </div>

          {project.description && (
            <div className="mt-4">
              <p className="text-zinc-300 text-lg leading-relaxed">{project.description}</p>
            </div>
          )}

        </div>
      </header>

      <nav className="relative z-40 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {activeTab === 'overview' && (
          <OverviewTab projectData={{
            id: project.id,
            name: project.title,
            title: project.title,
            description: project.description,
            slug: project.slug,
            status: project.status,
            progress: project.progress,
            visibility: 'PUBLIC',
            icon: '📁',
            color: 'bg-gradient-to-br from-blue-500 to-purple-600',
            githubUrl: null,
            twitterUrl: null,
            websiteUrl: null,
            allowIssues: project.allowIssues,
            allowFeedback: project.allowFeedback,
            createdAt: project.startDate,
            updatedAt: project.startDate,
            lastUpdate: project.updates.length > 0 ? project.updates[0].createdAt : project.startDate,
            user: {
              id: project.user.name,
              name: project.user.name,
              username: project.user.username || '',
              avatar: project.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.user.name}`
            },
            tags: project.tags.map(tagWrapper => ({
              tag: {
                id: tagWrapper.tag.name,
                name: tagWrapper.tag.name,
                color: null
              }
            })),
            updates: project.updates.map(update => ({
              ...update,
              projectId: project.id,
              images: update.images?.map(img => ({ url: img })) || []
            })),
            milestones: project.milestones.map(milestone => ({
              ...milestone,
              createdAt: milestone.dueDate || project.startDate,
              tasks: []
            })),
            issues: [],
            feedback: project.feedback.map(f => ({
              ...f,
              rating: f.rating || 0,
              submitterName: f.submitterName || 'Anonymous'
            })),
            _count: {
              updates: project.updates.length,
              milestones: project.milestones.length,
              issues: 0,
              feedback: project.feedback.length
            }
          }} />
        )}

        {activeTab === 'updates' && (
          <UpdatesTab updates={project.updates.map(update => ({
            ...update,
            projectId: project.id,
            images: update.images?.map(img => ({ url: img })) || []
          }))} />
        )}

        {activeTab === 'milestones' && (
          <MilestonesTab milestones={project.milestones.map(milestone => ({
            ...milestone,
            createdAt: milestone.dueDate || project.startDate,
            tasks: []
          }))} />
        )}

        {activeTab === 'issues' && project.allowIssues && (
          <IssuesTab 
            issues={issues} 
            projectSlug={project.slug} 
          />
        )}

        {activeTab === 'feedback' && project.allowFeedback && (
          <FeedbackTab feedback={project.feedback.map(f => ({
            ...f,
            rating: f.rating || 0,
            submitterName: f.submitterName || 'Anonymous'
          }))} />
        )}
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-center space-x-2 text-zinc-400">
            <span className="text-sm">Powered by</span>
            <a 
              href="https://devlogr.space" 
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              DevLogr
            </a>
          </div>
        </div>
      </footer>
      
      {project && (
        <>
          <IssueModal 
            isOpen={isIssueModalOpen} 
            onClose={() => setIsIssueModalOpen(false)} 
            projectTitle={project.title} 
            projectSlug={project.slug}
            onIssueCreated={() => {
              fetchIssues(project.slug);
              setIsIssueModalOpen(false);
              if (activeTab !== 'issues') {
                setActiveTab('issues');
              }
            }}
          />
          
          <FeedbackModal 
            isOpen={isFeedbackModalOpen} 
            onClose={() => setIsFeedbackModalOpen(false)} 
            projectTitle={project.title} 
            projectSlug={project.slug} 
          />
        </>
      )}
    </div>
  );
} 
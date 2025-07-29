'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { LayoutProvider } from '@/contexts/LayoutContext';
import MilestoneManager from '@/components/dashboard/MilestoneManager';
import UpdateManager from '@/components/dashboard/UpdateManager';
import IssueManager from '@/components/dashboard/IssueManager';
import FeedbackManager from '@/components/dashboard/FeedbackManager';
import LayoutSettings from '@/components/dashboard/LayoutSettings';
import LoadingScreen from '@/components/shared/ui/LoadingScreen';
import DomainSetupWizard from '@/components/dashboard/DomainSetupWizard';
import DomainVerificationStatus from '@/components/dashboard/DomainVerificationStatus';
import RestrictedFeatureWrapper from '@/components/dashboard/RestrictedFeatureWrapper';

interface Tag {
  id: string;
  name: string;
  _count?: { projects: number };
}

interface Project {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: string;
  progress: number;
  visibility: string;
  theme: string | null;
  banner: string | null;
  icon: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  allowIssues?: boolean;
  allowFeedback?: boolean;
  customDomain?: string | null;
  domainVerified?: boolean;
  sslEnabled?: boolean;
}

type TabType = 'overview' | 'settings' | 'milestones' | 'updates' | 'issues' | 'feedback';



export default function ProjectManagement() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [saving, setSaving] = useState(false);
  const [projectTags, setProjectTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [timelineData, setTimelineData] = useState<{startDate: string; endDate: string}>({
    startDate: '',
    endDate: ''
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDomainWizard, setShowDomainWizard] = useState(false);
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!api.isAuthenticated()) {
          router.push('/auth');
          return;
        }

        const token = api.getAccessToken();
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=basic`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.success && responseData.data) {
            setProject(responseData.data);
            setTimelineData({
              startDate: responseData.data.startDate ? new Date(responseData.data.startDate).toISOString().split('T')[0] : '',
              endDate: responseData.data.endDate ? new Date(responseData.data.endDate).toISOString().split('T')[0] : ''
            });
          } else {
            setError(responseData.message || 'Failed to load project');
          }
        } else if (response.status === 404) {
          setError('Project not found');
        } else if (response.status === 403) {
          setError('You do not have permission to access this project');
        } else {
          setError('Failed to load project');
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, router]);

  const updateBasicInfo = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=basic-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          setProject(prev => prev ? { ...prev, ...responseData.data } : null);
          setToast({ message: 'Project information updated successfully!', type: 'success' });
          setTimeout(() => setToast(null), 3000);
          return true;
        } else {
          setToast({ message: responseData.message || 'Failed to update project information', type: 'error' });
          setTimeout(() => setToast(null), 3000);
          return false;
        }
      }
      setToast({ message: 'Failed to update project information', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return false;
    } catch (error) {
      console.error('Failed to update basic info:', error);
      setToast({ message: 'An error occurred while updating', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          setProject(prev => prev ? { ...prev, ...responseData.data } : null);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to update status:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateTimeline = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=timeline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          setProject(prev => prev ? { ...prev, ...responseData.data } : null);
          setTimelineData({
            startDate: responseData.data.startDate ? new Date(responseData.data.startDate).toISOString().split('T')[0] : '',
            endDate: responseData.data.endDate ? new Date(responseData.data.endDate).toISOString().split('T')[0] : ''
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to update timeline:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const fetchProjectTags = useCallback(async () => {
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=tags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          setProjectTags(responseData.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }, [projectId]);



  const addTag = async (tagName: string) => {
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ tagName })
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          setProjectTags(prev => [...prev, responseData.data]);
          setNewTagName('');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to add tag:', error);
      return false;
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=tags&tagId=${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        setProjectTags(prev => prev.filter(tag => tag.id !== tagId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove tag:', error);
      return false;
    }
  };


  const verifyDomain = async () => {
    if (!project?.customDomain) return;
    
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=verify-domain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          if (responseData.data.verified) {
            setProject(prev => prev ? { ...prev, domainVerified: true, sslEnabled: responseData.data.ssl } : null);
            setToast({ message: 'Domain verified successfully!', type: 'success' });
          } else {
            setToast({ message: 'Domain verification failed. Please check your DNS settings.', type: 'error' });
          }
          setTimeout(() => setToast(null), 3000);
          return responseData.data;
        }
      }
      setToast({ message: 'Failed to verify domain', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return null;
    } catch (error) {
      console.error('Failed to verify domain:', error);
      setToast({ message: 'An error occurred during domain verification', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return null;
    }
  };


  useEffect(() => {
    if (activeTab === 'settings' && project) {
      fetchProjectTags();
    }
  }, [activeTab, project, fetchProjectTags]);

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
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'milestones', name: 'Milestones', icon: '🎯' },
    { id: 'updates', name: 'Updates', icon: '📝' },
    { id: 'issues', name: 'Issues', icon: '🐛' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
  ];

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  if (error || !project) {
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
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <LayoutProvider projectId={projectId}>
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
              <button
                onClick={() => router.push('/dashboard')}
                className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl ${project.theme || 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center text-2xl shadow-lg`}>
                  📁
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{project.title}</h1>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-zinc-400">Project Management</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href={project.customDomain && project.domainVerified 
                  ? `https://${project.customDomain}` 
                  : `https://${project.slug}.devlogr.space`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="text-sm font-medium">View Public Page</span>
                {project.customDomain && project.domainVerified && (
                  <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded text-xs font-medium">
                    Custom Domain
                  </span>
                )}
              </a>
            </div>
          </div>
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
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">Progress</p>
                    <p className="text-3xl font-bold text-white">{project.progress}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">Updates</p>
                    <p className="text-3xl font-bold text-white">0</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">Issues</p>
                    <p className="text-3xl font-bold text-white">0</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">Feedback</p>
                    <p className="text-3xl font-bold text-white">0</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('updates')}
                  className="flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Create Update</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('milestones')}
                  className="flex items-center space-x-3 p-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium">Add Milestone</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Project Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-6xl space-y-8">
            <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">📝</span>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => setProject(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Enter project title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={project.description || ''}
                      onChange={(e) => setProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={4}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      placeholder="Describe your project..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Project Slug
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={project.slug}
                        onChange={(e) => setProject(prev => prev ? { ...prev, slug: e.target.value } : null)}
                        className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="project-slug"
                      />
                      <span className="text-zinc-500 text-sm">.devlogr.space</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Your project will be available at {project.slug}.devlogr.space</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Project Icon
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-xl ${project.theme || 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center text-3xl`}>
                        📁
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={project.icon || ''}
                          onChange={(e) => setProject(prev => prev ? { ...prev, icon: e.target.value } : null)}
                          className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          placeholder="Enter emoji or icon..."
                        />
                        <p className="text-xs text-zinc-500 mt-2">Use emoji or upload an image</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Theme Color
                    </label>
                    <div className="grid grid-cols-6 gap-3">
                      {[
                        'bg-gradient-to-br from-blue-500 to-blue-600',
                        'bg-gradient-to-br from-purple-500 to-purple-600',
                        'bg-gradient-to-br from-pink-500 to-pink-600',
                        'bg-gradient-to-br from-red-500 to-red-600',
                        'bg-gradient-to-br from-orange-500 to-orange-600',
                        'bg-gradient-to-br from-yellow-500 to-yellow-600',
                        'bg-gradient-to-br from-green-500 to-green-600',
                        'bg-gradient-to-br from-emerald-500 to-emerald-600',
                        'bg-gradient-to-br from-teal-500 to-teal-600',
                        'bg-gradient-to-br from-cyan-500 to-cyan-600',
                        'bg-gradient-to-br from-indigo-500 to-indigo-600',
                        'bg-gradient-to-br from-violet-500 to-violet-600',
                      ].map((color, index) => (
                        <button
                          key={index}
                          onClick={() => setProject(prev => prev ? { ...prev, theme: color } : null)}
                          className={`w-8 h-8 rounded-lg ${color} hover:scale-110 transition-transform ${
                            project.theme === color ? 'ring-2 ring-white/50' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Progress
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={project.progress}
                          onChange={(e) => setProject(prev => prev ? { ...prev, progress: parseInt(e.target.value) } : null)}
                          className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <span className="text-white font-semibold w-16 text-right">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-8 pt-6 border-t border-white/10">
                <button 
                  onClick={() => updateBasicInfo({
                    title: project.title,
                    description: project.description,
                    slug: project.slug,
                    progress: project.progress
                  })}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">🔒</span>
                Status & Visibility
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Project Status
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'DRAFT', label: 'Draft', color: 'gray', desc: 'Not ready for public viewing' },
                      { value: 'ACTIVE', label: 'Active', color: 'emerald', desc: 'Currently being worked on' },
                      { value: 'PAUSED', label: 'Paused', color: 'amber', desc: 'Temporarily halted' },
                      { value: 'COMPLETED', label: 'Completed', color: 'blue', desc: 'Project finished' },
                      { value: 'ARCHIVED', label: 'Archived', color: 'zinc', desc: 'No longer maintained' },
                    ].map((status) => (
                      <label key={status.value} className="flex items-center space-x-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="status"
                          value={status.value}
                          checked={project.status === status.value}
                          onChange={(e) => setProject(prev => prev ? { ...prev, status: e.target.value } : null)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                          project.status === status.value 
                            ? `border-${status.color}-500 bg-${status.color}-500` 
                            : 'border-zinc-600 group-hover:border-zinc-400'
                        }`}>
                          {project.status === status.value && (
                            <div className="w-full h-full rounded-full bg-white/20"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{status.label}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.value)}`}>
                              {status.value}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400">{status.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Visibility
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'PUBLIC', label: 'Public', icon: '🌍', desc: 'Anyone can view this project' },
                      { value: 'UNLISTED', label: 'Unlisted', icon: '🔗', desc: 'Only accessible via direct link' },
                      { value: 'PRIVATE', label: 'Private', icon: '🔒', desc: 'Only you can view this project' },
                    ].map((visibility) => (
                      <label key={visibility.value} className="flex items-center space-x-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="visibility"
                          value={visibility.value}
                          checked={project.visibility === visibility.value}
                          onChange={(e) => setProject(prev => prev ? { ...prev, visibility: e.target.value } : null)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                          project.visibility === visibility.value 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-zinc-600 group-hover:border-zinc-400'
                        }`}>
                          {project.visibility === visibility.value && (
                            <div className="w-full h-full rounded-full bg-white/20"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{visibility.icon}</span>
                            <span className="text-white font-medium">{visibility.label}</span>
                          </div>
                          <p className="text-sm text-zinc-400">{visibility.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-8 pt-6 border-t border-white/10">
                <button 
                  onClick={() => updateStatus({
                    status: project.status,
                    visibility: project.visibility
                  })}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">💬</span>
                Engagement Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <label className="flex items-center space-x-4 cursor-pointer">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Allow Issues</h4>
                    <p className="text-sm text-zinc-400">Enable a public issue tracker for this project.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={project.allowIssues ?? false}
                    onChange={(e) => setProject(prev => prev ? { ...prev, allowIssues: e.target.checked } : null)}
                  />
                  <div className={`w-14 h-8 flex items-center bg-zinc-700 rounded-full p-1 transition-all duration-300 ${project.allowIssues ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${project.allowIssues ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>

                <label className="flex items-center space-x-4 cursor-pointer">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Allow Feedback</h4>
                    <p className="text-sm text-zinc-400">Let visitors submit feedback posts.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={project.allowFeedback ?? false}
                    onChange={(e) => setProject(prev => prev ? { ...prev, allowFeedback: e.target.checked } : null)}
                  />
                  <div className={`w-14 h-8 flex items-center bg-zinc-700 rounded-full p-1 transition-all duration-300 ${project.allowFeedback ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${project.allowFeedback ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={() => updateBasicInfo({
                    allowIssues: project.allowIssues,
                    allowFeedback: project.allowFeedback,
                  })}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Update Engagement'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">📅</span>
                Timeline
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={timelineData.startDate}
                    onChange={(e) => setTimelineData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Expected End Date
                  </label>
                  <input
                    type="date"
                    value={timelineData.endDate}
                    onChange={(e) => setTimelineData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-8 pt-6 border-t border-white/10">
                <button 
                  onClick={async () => {
                    const success = await updateTimeline({
                      startDate: timelineData.startDate ? new Date(timelineData.startDate + 'T00:00:00.000Z').toISOString() : null,
                      endDate: timelineData.endDate ? new Date(timelineData.endDate + 'T23:59:59.999Z').toISOString() : null
                    });
                    if (success) {
                      setToast({ message: 'Timeline updated successfully!', type: 'success' });
                      setTimeout(() => setToast(null), 3000);
                    } else {
                      setToast({ message: 'Failed to update timeline', type: 'error' });
                      setTimeout(() => setToast(null), 3000);
                    }
                  }}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Timeline'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">🏷️</span>
                Tags & Technologies
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Current Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {projectTags.length > 0 ? projectTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{tag.name}</span>
                        <button 
                          onClick={() => removeTag(tag.id)}
                          className="text-blue-300 hover:text-white transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )) : (
                      <p className="text-zinc-500 text-sm">No tags added yet</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Add New Tag
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newTagName.trim()) {
                          addTag(newTagName.trim());
                        }
                      }}
                      placeholder="Enter tag name..."
                      className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button 
                      onClick={() => {
                        if (newTagName.trim()) {
                          addTag(newTagName.trim());
                        }
                      }}
                      disabled={!newTagName.trim()}
                      className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-6 py-3 rounded-xl hover:bg-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Popular Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['JavaScript', 'Python', 'React', 'Vue.js', 'Angular', 'Next.js', 'Express', 'Django', 'Flask', 'MongoDB', 'PostgreSQL', 'MySQL', 'Docker', 'AWS', 'Vercel'].map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!projectTags.find(pt => pt.name.toLowerCase() === tag.toLowerCase())) {
                            addTag(tag);
                          }
                        }}
                        disabled={!!projectTags.find(pt => pt.name.toLowerCase() === tag.toLowerCase())}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          projectTags.find(pt => pt.name.toLowerCase() === tag.toLowerCase())
                            ? 'bg-zinc-700/50 border border-zinc-600/50 text-zinc-500 cursor-not-allowed'
                            : 'bg-zinc-800/50 border border-zinc-600/50 text-zinc-300 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-400'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <LayoutSettings
              projectId={projectId}
              projectData={project ? {
                id: project.id,
                name: project.title,
                title: project.title,
                description: project.description,
                slug: project.slug,
                status: project.status,
                progress: project.progress,
                visibility: project.visibility,
                icon: project.icon,
                color: project.theme,
                githubUrl: null,
                twitterUrl: null,
                websiteUrl: null,
                allowIssues: project.allowIssues || false,
                allowFeedback: project.allowFeedback || false,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                lastUpdate: project.updatedAt,
                customDomain: project.customDomain,
                domainVerified: project.domainVerified,
                sslEnabled: project.sslEnabled,
                user: project.user,
                tags: [],
                updates: [],
                milestones: [],
                issues: [],
                feedback: [],
                _count: {
                  updates: 0,
                  milestones: 0,
                  issues: 0,
                  feedback: 0
                }
              } : undefined}
            />

            <DomainVerificationStatus
              projectId={projectId}
              onVerificationChange={(verified) => {
                if (verified && project) {
                  setProject(prev => prev ? { ...prev, domainVerified: true } : null);
                }
              }}
            />
          </div>
        )}

        {activeTab === 'milestones' && (
          <RestrictedFeatureWrapper
            projectId={projectId}
            featureName="Milestones"
            className="max-w-6xl"
          >
            <MilestoneManager projectId={projectId} />
          </RestrictedFeatureWrapper>
        )}

        {activeTab === 'updates' && (
          <RestrictedFeatureWrapper
            projectId={projectId}
            featureName="Updates"
            className="max-w-6xl"
          >
            <UpdateManager projectId={projectId} />
          </RestrictedFeatureWrapper>
        )}

        {activeTab === 'issues' && project && (
          <RestrictedFeatureWrapper
            projectId={project.id}
            featureName="Issues"
            className="max-w-6xl"
          >
            <IssueManager projectId={project.id} />
          </RestrictedFeatureWrapper>
        )}

        {activeTab === 'feedback' && project && (
          <RestrictedFeatureWrapper
            projectId={project.id}
            featureName="Feedback"
            className="max-w-6xl"
          >
            <FeedbackManager projectId={project.id} />
          </RestrictedFeatureWrapper>
        )}
      </main>

      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm border transition-all duration-300 transform ${
          toast.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/20 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center space-x-3">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {showDomainWizard && (
        <DomainSetupWizard
          projectId={projectId}
          projectSlug={project.slug}
          currentDomain={project.customDomain}
          onComplete={(domain) => {
            setProject(prev => prev ? { ...prev, customDomain: domain } : null);
            setShowDomainWizard(false);
            setTimeout(() => {
              verifyDomain();
            }, 1000);
          }}
          onCancel={() => setShowDomainWizard(false)}
        />
      )}
    </div>
    </LayoutProvider>
  );
}
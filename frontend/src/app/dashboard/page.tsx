'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api, User } from '@/lib/api';
import AccountSettings from '@/components/dashboard/AccountSettings';
import ProjectSetup from '@/components/dashboard/ProjectSetup';
import LoadingScreen from '@/components/shared/ui/LoadingScreen';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import WelcomeSection from '@/components/dashboard/WelcomeSection';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import ProjectsSection from '@/components/dashboard/ProjectsSection';
import RecentUpdates from '@/components/dashboard/RecentUpdates';
import { ProjectData, Update as ProjectUpdate } from '@/types';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  visibility: string;
  updates: number;
  lastUpdate?: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  icon?: string | null;
  tags?: string[];
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalUpdates: number;
  avgProgress: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<ProjectUpdate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isProjectSetupOpen, setIsProjectSetupOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const authenticated = await api.isAuthenticated();
        
        if (!authenticated) {
          router.push('/auth');
          return;
        }
  
        const userResponse = await api.getCurrentUser();
        
        if (!userResponse.success || !userResponse.data) {
          throw new Error(userResponse.message || 'Failed to fetch user data');
        }
        
        setUser(userResponse.data);
        
        const projectsResponse = await api.getProjects();
        
        if (projectsResponse.success && projectsResponse.data) {
          const transformedProjects: Project[] = projectsResponse.data.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            progress: project.progress,
            visibility: project.visibility,
            updates: project.updates?.length || 0,
            lastUpdate: project.updates?.[0]?.createdAt,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            slug: project.slug,
            icon: project.icon,
            tags: project.tags?.map(tagRelation => tagRelation.tag.name) || []
          }));
          
          setProjects(transformedProjects);
          
          setStats({
            totalProjects: transformedProjects.length,
            activeProjects: transformedProjects.filter(p => p.status === 'active').length,
            totalUpdates: transformedProjects.reduce((acc, p) => acc + p.updates, 0),
            avgProgress: transformedProjects.length > 0 
              ? Math.round(transformedProjects.reduce((acc, p) => acc + p.progress, 0) / transformedProjects.length)
              : 0
          });
        } else {
          setProjects([]);
          setStats({
            totalProjects: 0,
            activeProjects: 0,
            totalUpdates: 0,
            avgProgress: 0
          });
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        setError(errorMessage);
        
        if (errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
          setTimeout(() => router.push('/auth'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await api.getProjects();
      if (response.success && response.data) {
        const mappedProjects = response.data.map((p: ProjectData) => ({
          ...p,
          updates: p._count?.updates ?? 0,
          progress: p.progress ?? 0,
          tags: p.tags?.map(t => t.tag.name) ?? [],
        }));
        setProjects(mappedProjects);
      } else {
        console.error('Failed to fetch projects:', response.message);
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const fetchRecentUpdates = useCallback(async () => {
    setUpdatesLoading(true);
    try {
      const response = await api.getRecentUpdates(6);
      if (response.success && response.data) {
        setRecentUpdates(response.data);
      } else {
        console.error('Failed to fetch updates:', response.message);
        setRecentUpdates([]);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
      setRecentUpdates([]);
    } finally {
      setUpdatesLoading(false);
    }
  }, []);

  const updatesTrend: number[] = useMemo(() => {
    const counts: { [key: string]: number } = {};
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString();
      counts[key] = 0;
    }
    recentUpdates.forEach((u) => {
      const key = new Date(u.createdAt).toLocaleDateString();
      if (counts[key] !== undefined) counts[key] += 1;
    });
    return Object.values(counts);
  }, [recentUpdates]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchRecentUpdates();
    }
  }, [user, fetchProjects, fetchRecentUpdates]);

  const fetchStats = useCallback(async () => {
    try {
      if (projects.length === 0) {
        setStats({
          totalProjects: 0,
          activeProjects: 0,
          totalUpdates: 0,
          avgProgress: 0
        });
        return;
      }

      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
      
      const totalUpdates = projects.reduce((sum, p) => sum + (Number(p.updates) || 0), 0);
      
      const avgProgress = totalProjects > 0
        ? Math.round(projects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / totalProjects)
        : 0;

      setStats({
        totalProjects,
        activeProjects,
        totalUpdates,
        avgProgress
      });
    } catch (error) {
      console.error('Failed to calculate stats:', error);
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        totalUpdates: 0,
        avgProgress: 0
      });
    }
  }, [projects]);

  useEffect(() => {
    if (projects.length >= 0) {
      fetchStats();
    }
  }, [projects, fetchStats]);

  const handleLogout = async () => {
    try {
      await api.logout();
      api.clearTokens();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      api.clearTokens();
      router.push('/auth');
    }
  };

  if (loading) {
    return <LoadingScreen title="Loading Dashboard" subtitle="Preparing your workspace..." />;
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{error}</h3>
          <button
            onClick={() => router.push('/auth')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <DashboardHeader
        user={user}
        onLogout={handleLogout}
        onAccountSettings={() => setIsAccountSettingsOpen(true)}
        onNewProject={() => setIsProjectSetupOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <WelcomeSection user={user} stats={stats} />
        
        <PerformanceMetrics stats={stats} updatesTrend={updatesTrend} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <ProjectsSection
              projects={projects}
              projectsLoading={projectsLoading}
              onNewProject={() => setIsProjectSetupOpen(true)}
            />
          </div>
          <div className="xl:col-span-1">
            <RecentUpdates
              recentUpdates={recentUpdates}
              updatesLoading={updatesLoading}
            />
          </div>
        </div>
      </main>

      <AccountSettings
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        user={user}
      />

      <ProjectSetup
        isOpen={isProjectSetupOpen}
        onClose={() => setIsProjectSetupOpen(false)}
        onComplete={(projectData) => {
          console.log('Project created:', projectData);
          setIsProjectSetupOpen(false);
          fetchProjects();
          router.push(`/dashboard/projects/${projectData.id}`);
        }}
      />
    </div>
  );
} 
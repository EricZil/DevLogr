'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api, User } from '@/lib/api';
import AccountSettings from '@/components/dashboard/AccountSettings';
import ProjectSetup from '@/components/dashboard/ProjectSetup';
import LoadingScreen from '@/components/shared/ui/LoadingScreen';
import Image from 'next/image';
import KpiCard from '@/components/dashboard/KpiCard';
import { FolderKanban, Zap, FileText, Eye as EyeIcon, Archive as ArchiveIcon } from 'lucide-react';
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

function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const minutes = api.getTokenTimeLeft();
      setTimeLeft(minutes);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, []);

  if (timeLeft <= 0) return null;

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProjectSetupOpen, setIsProjectSetupOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.querySelector('[data-dropdown]');
      if (dropdown && !dropdown.contains(target) && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isDropdownOpen]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/20';
      case 'COMPLETED': return 'text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-blue-500/20';
      case 'PAUSED': return 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-amber-500/20';
      case 'DRAFT': return 'text-gray-400 bg-gray-500/10 border-gray-500/30 shadow-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30 shadow-gray-500/20';
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'FEATURE': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'PROGRESS': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'RELEASE': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'BUGFIX': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getUpdateTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'FEATURE': return 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30';
      case 'PROGRESS': return 'bg-blue-600/20 text-blue-300 border border-blue-500/30';
      case 'RELEASE': return 'bg-purple-600/20 text-purple-300 border border-purple-500/30';
      case 'BUGFIX': return 'bg-red-600/20 text-red-300 border border-red-500/30';
      default: return 'bg-gray-600/20 text-gray-300 border border-gray-500/30';
    }
  };

  const groupedUpdates = useMemo(() => {
    if (recentUpdates.length === 0) return [] as { label: string; items: ProjectUpdate[] }[];

    const groups: { [key: string]: ProjectUpdate[] } = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const formatLabel = (d: Date) => {
      const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
      if (sameDay(d, today)) return 'Today';
      if (sameDay(d, yesterday)) return 'Yesterday';
      return d.toLocaleDateString();
    };

    recentUpdates.forEach((u) => {
      const date = new Date(u.createdAt);
      const label = formatLabel(date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(u);
    });

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
  }, [recentUpdates]);

  if (loading) {
    return <LoadingScreen title="Loading Dashboard" subtitle="Preparing your workspace..." />;
  }

  if (error && !user) {
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
            onClick={() => router.push('/auth')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Back to Login
          </button>
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
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

      <header className="relative z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
                    <span className="text-white font-bold text-xl">D</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    DevLogr
                  </h1>
                  <p className="text-xs text-zinc-500 font-medium">Developer Project Tracker</p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V5a2 2 0 012-2h14a2 2 0 012 2v2" />
                  </svg>
                  <span className="text-white font-semibold">Dashboard</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setIsProjectSetupOpen(true)}
                className="group relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 shadow-xl shadow-blue-500/25 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-semibold relative z-10">New Project</span>
              </button>

              <div className="flex items-center space-x-4">
                    {user?.avatar && (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-xl ring-2 ring-white/20 object-cover"
                          unoptimized
                        />
                    )}
                <div className="hidden lg:flex flex-col">
                  <span className="text-sm font-semibold text-white">
                        {user?.name}
                      </span>
                  <SessionTimer />
                    </div>
                <button
                  onClick={handleLogout}
                  className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-4">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl">
            Here&apos;s what&apos;s happening with your projects today. Ready to build something amazing?
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-12">
          <KpiCard
            title="Total Projects"
            value={stats ? stats.totalProjects : '0'}
            icon={
              <div className="bg-blue-500/10 p-2 rounded-xl">
                <FolderKanban className="w-7 h-7 text-blue-400" strokeWidth={2} />
              </div>
            }
          />

          <KpiCard
            title="Active Projects"
            value={stats ? stats.activeProjects : '0'}
            icon={
              <div className="bg-emerald-500/10 p-2 rounded-xl">
                <Zap className="w-7 h-7 text-emerald-400" strokeWidth={2} />
              </div>
            }
          />

          <KpiCard
            title="Total Updates"
            value={stats ? stats.totalUpdates : '0'}
            sparklineData={updatesTrend}
          />

          <KpiCard
            title="Avg Progress"
            value={`${stats ? stats.avgProgress : 0}%`}
            progress={stats ? stats.avgProgress : 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">Your Projects</h3>
            </div>

            {projectsLoading ? (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-pulse">
                    <div className="h-6 bg-zinc-700/50 rounded w-48 mb-4"></div>
                    <div className="h-4 bg-zinc-700/50 rounded w-full mb-4"></div>
                    <div className="h-3 bg-zinc-700/50 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">No Projects Yet</h3>
                  <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                    Start your development journey by creating your first project. Track progress, share updates, and build in public!
                  </p>
                  <button 
                    onClick={() => setIsProjectSetupOpen(true)}
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto shadow-xl shadow-blue-500/25"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create Your First Project</span>
                  </button>
                        </div>
                              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="relative overflow-hidden cursor-pointer group rounded-3xl border border-white/10 bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-2xl" />
                    </div>

                    <div className="relative z-10 flex items-start space-x-5">
                      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold shadow-lg shrink-0">
                        {project.icon ? project.icon : project.title.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors">
                            {project.title}
                          </h4>
                          <div className="text-right hidden sm:block">
                            <div className="text-sm text-zinc-400">{project.progress}% complete</div>
                            <div className="w-32 bg-zinc-700 rounded-full h-2 mt-1">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <p className="text-zinc-300 line-clamp-2">
                          {project.description || 'No description provided'}
                        </p>

                        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5 relative">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                            <span className="flex items-center text-zinc-400 text-xs">
                              <FileText className="w-4 h-4 mr-1 text-zinc-400" strokeWidth={2} />
                              {project.updates} update{project.updates !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {project.lastUpdate && (
                            <span className="text-xs text-zinc-500">
                              Last update: {new Date(project.lastUpdate).toLocaleDateString()}
                            </span>
                          )}

                          <div className="absolute right-0 top-0 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/projects/${project.id}`);
                              }}
                              className="p-2 rounded-lg hover:bg-white/10"
                              title="View"
                            >
                              <EyeIcon className="w-4 h-4 text-zinc-400" strokeWidth={2} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // todo implement archive
                              }}
                              className="p-2 rounded-lg hover:bg-white/10"
                              title="Archive"
                            >
                              <ArchiveIcon className="w-4 h-4 text-zinc-400" strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3">
                            {project.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded border border-blue-500/30 bg-blue-500/10 text-blue-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tags.length > 3 && (
                              <span className="px-2 py-1 text-xs rounded border border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                                +{project.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-8">Recent Updates</h3>

            {updatesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-zinc-700/50 rounded w-full mb-2"></div>
                    <div className="h-3 bg-zinc-700/50 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : groupedUpdates.length === 0 ? (
              <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">No Updates Yet</h4>
                <p className="text-zinc-400 text-sm">Create a project and start sharing your progress!</p>
              </div>
            ) : (
              <div className="timeline relative pl-6">
                <div className="absolute top-0 left-0 w-px h-full bg-white/10" />

                {groupedUpdates.map(({ label, items }) => (
                  <div key={label} className="mb-8 first:mt-0">
                    <h4 className="text-base font-semibold text-zinc-400 mb-4">{label}</h4>

                    <div className="space-y-4">
                      {items.map((u) => (
                        <div
                          key={u.id}
                          className="relative ml-4 bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl p-6 flex space-x-4 transition-all duration-300"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getUpdateTypeColor(u.type)} shadow-lg shrink-0`}>
                            <FileText className="w-5 h-5 text-white" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="text-base font-semibold text-white line-clamp-1 mr-4">{u.title}</h4>
                              <span className="text-sm text-zinc-500 flex-shrink-0">{new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className={`inline-block mt-1 mb-2 px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${getUpdateTypeBadgeClass(u.type)}`}>{u.type}</span>
                            <p className="text-sm text-zinc-500 mb-1 line-clamp-2">{u.project?.title}</p>
                            <p className="text-sm text-zinc-400 line-clamp-3">{u.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
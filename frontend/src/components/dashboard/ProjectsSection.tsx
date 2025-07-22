'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Eye, Archive, Clock, FileText } from 'lucide-react';

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
  customDomain?: string | null;
  domainVerified?: boolean;
  sslEnabled?: boolean;
}

interface ProjectsSectionProps {
  projects: Project[];
  projectsLoading: boolean;
  onNewProject: () => void;
}

export default function ProjectsSection({ 
  projects, 
  projectsLoading, 
  onNewProject 
}: ProjectsSectionProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PAUSED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'DRAFT': return 'bg-white/10 text-gray-300 border-white/20';
      default: return 'bg-white/10 text-gray-300 border-white/20';
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Projects</h2>
          <p className="text-gray-400">Manage and track your development journey</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-white/20 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20 transition-colors">
            <span className="text-sm font-medium">View All</span>
          </button>
        </div>
      </div>

      {projectsLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-zinc-700/50 rounded-xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-zinc-700/50 rounded w-48"></div>
                  <div className="h-4 bg-zinc-700/50 rounded w-full"></div>
                  <div className="h-3 bg-zinc-700/50 rounded w-3/4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-zinc-700/50 rounded w-16"></div>
                    <div className="h-6 bg-zinc-700/50 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-zinc-800/50 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Ready to Start Building?</h3>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Create your first project and start tracking your development journey. Share progress, gather feedback, and build in public!
            </p>
            <button
              onClick={onNewProject}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Create Your First Project
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-black/50 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {project.icon ? project.icon : project.title.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {project.title}
                      </h3>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className="flex items-center text-gray-400 text-sm">
                          <FileText className="w-4 h-4 mr-1" />
                          {project.updates} update{project.updates !== 1 ? 's' : ''}
                        </span>
                        {project.customDomain && (
                          <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            project.domainVerified 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}>
                            {project.domainVerified ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Custom Domain
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                Domain Pending
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-400">Progress</span>
                        <span className="text-sm font-semibold text-white">{project.progress}%</span>
                      </div>
                      <div className="w-24 bg-white/10 rounded-full h-2">
                        <div
                          className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                    {project.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex flex-col space-y-2">
                      {project.lastUpdate && (
                        <span className="flex items-center text-zinc-400 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          Last update: {new Date(project.lastUpdate).toLocaleDateString()}
                        </span>
                      )}
                      <div className="flex items-center space-x-3">
                        <a
                          href={`https://${project.slug}.devlogr.space`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {project.slug}.devlogr.space
                        </a>
                        
                        {project.customDomain && project.domainVerified && (
                          <a
                            href={`https://${project.customDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {project.customDomain}
                            <span className="ml-1 px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">CUSTOM</span>
                          </a>
                        )}
                        
                        {project.customDomain && !project.domainVerified && (
                          <span className="flex items-center text-amber-400 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {project.customDomain} (pending verification)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/projects/${project.id}`);
                        }}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors"
                        title="View Project"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // todo implement archive
                        }}
                        className="p-2 text-zinc-400 hover:bg-zinc-700/50 rounded-xl transition-colors"
                        title="Archive Project"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {project.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30"
                        >
                          #{tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-3 py-1 bg-zinc-700/50 text-zinc-400 rounded-full text-xs font-medium border border-zinc-600/50">
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
    </section>
  );
} 
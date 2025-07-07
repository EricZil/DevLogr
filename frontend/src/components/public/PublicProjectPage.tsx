'use client';

import { useState, useEffect } from 'react';
import { api, domainUtils } from '@/lib/api';
import LoadingScreen from '@/components/shared/ui/LoadingScreen';

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

export default function PublicProjectPage() {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          throw new Error(response.message || 'Project not found');
        }

        setProject(response.data);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Project Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="text-sm text-gray-500">
            This project may be private, deleted, or the domain may not be properly configured.
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Project Not Found</h1>
          <p className="text-gray-400">This project does not exist or is not publicly available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{project.title}</h1>
              {project.description && (
                <p className="text-gray-300 text-lg mb-4">{project.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  {project.user.avatar && (
                    <img 
                      src={project.user.avatar} 
                      alt={project.user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span>by {project.user.name}</span>
                </div>
                <div>•</div>
                <div className="capitalize">{project.status.toLowerCase()}</div>
                <div>•</div>
                <div>{project.progress}% complete</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - project.progress / 100)}`}
                    className="text-blue-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{project.progress}%</span>
                </div>
              </div>
            </div>
          </div>

          {project.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {project.tags.map((tagWrapper, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30"
                >
                  {tagWrapper.tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Updates</h2>
            
            {project.updates.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <p className="text-gray-400">No updates posted yet.</p>
              </div>
            ) : (
              project.updates.map((update) => (
                <article
                  key={update.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{update.title}</h3>
                    <span className="text-sm text-gray-400">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed">{update.content}</p>
                  </div>

                  {update.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {update.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt=""
                          className="rounded-lg border border-white/10"
                        />
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Milestones</h3>
              {project.milestones.length === 0 ? (
                <p className="text-gray-400 text-sm">No milestones set.</p>
              ) : (
                <div className="space-y-3">
                  {project.milestones.slice(0, 5).map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm font-medium">{milestone.title}</div>
                        {milestone.dueDate && (
                          <div className="text-gray-400 text-xs">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-300">{milestone.progress}%</div>
                        {milestone.completedAt && (
                          <div className="text-xs text-green-400">✓ Complete</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Project Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Updates</span>
                  <span className="text-white">{project.updates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Milestones</span>
                  <span className="text-white">{project.milestones.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Started</span>
                  <span className="text-white">
                    {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </div>
                {project.feedback.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Feedback</span>
                    <span className="text-white">{project.feedback.length}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-gray-400 text-sm mb-2">Powered by</div>
              <div className="text-white font-semibold">DevLogr</div>
              <div className="text-gray-500 text-xs mt-1">
                Track your development journey
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
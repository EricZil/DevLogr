import Image from 'next/image';
import { ProjectData } from '@/types';

interface OverviewTabProps {
  projectData: ProjectData;
}

const getUpdateTypeColor = (type: string) => {
  switch (type) {
    case 'FEATURE': return 'bg-emerald-500';
    case 'PROGRESS': return 'bg-blue-500';
    case 'RELEASE': return 'bg-purple-500';
    case 'BUGFIX': return 'bg-red-500';
    case 'MILESTONE': return 'bg-yellow-500';
    default: return 'bg-gray-500';
  }
};

const getUpdateTypeBadge = (type: string) => {
  switch (type) {
    case 'FEATURE': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    case 'PROGRESS': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'RELEASE': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'BUGFIX': return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'MILESTONE': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

export default function OverviewTab({ projectData }: OverviewTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
          <div className={`w-24 h-24 rounded-2xl ${projectData.color || 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center text-4xl shadow-2xl`}>
            {projectData.icon || '📁'}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-3">
              {projectData.title}
            </h1>
            <p className="text-xl text-zinc-300 mb-4 max-w-2xl">{projectData.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center space-x-2">
                <Image
                  src={projectData.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${projectData.user.username}`}
                  alt={projectData.user.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full ring-2 ring-white/20"
                  unoptimized
                />
                <span>Created by {projectData.user.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Started {new Date(projectData.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last update {projectData.updates && projectData.updates.length > 0 
                  ? new Date(projectData.lastUpdate).toLocaleDateString()
                  : "No updates yet"
                }</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Progress</p>
              <p className="text-3xl font-bold text-white">{projectData.progress}%</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Updates</p>
              <p className="text-3xl font-bold text-white">{projectData.updates?.length || 0}</p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Technologies</p>
              <p className="text-3xl font-bold text-white">{projectData.tags?.length || 0}</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Project Info
            </h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Progress</span>
                <span className="text-sm font-semibold text-white">{projectData.progress}%</span>
              </div>
              <div className="bg-zinc-800/50 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${projectData.color || 'from-blue-500 to-purple-600'} transition-all duration-500`}
                  style={{ width: `${projectData.progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Started</p>
                <p className="text-sm text-white">{new Date(projectData.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Last Update</p>
                <p className="text-sm text-white">
                  {projectData.updates && projectData.updates.length > 0 
                    ? new Date(projectData.lastUpdate).toLocaleDateString()
                    : "No updates yet"
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Total Updates</p>
                <p className="text-sm text-white">{projectData.updates?.length || 0}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {projectData.tags?.map((tagObj, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-white/10 border border-white/20 rounded-md text-xs text-white font-medium"
                  >
                    {tagObj.tag.name}
                  </span>
                )) || (
                  <span className="text-xs text-zinc-500">No technologies specified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Updates
            </h2>
            
            <div className="space-y-8">
              {(projectData.updates || []).slice(0, 5).map((update, index) => (
                <div key={update.id} className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full ${getUpdateTypeColor(update.type)} mt-2`} />
                    {index < Math.min(projectData.updates?.length || 0, 5) - 1 && (
                      <div className="w-0.5 h-20 bg-gradient-to-b from-zinc-600 to-transparent mt-2 ml-1.5" />
                    )}
                  </div>
                  <div className="flex-1 bg-black/30 rounded-xl p-6 border border-white/5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{update.title}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getUpdateTypeBadge(update.type)}`}>
                          {update.type}
                        </span>
                      </div>
                      <span className="text-sm text-zinc-400">{update.createdAt}</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-base">{update.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {(projectData.updates?.length || 0) > 5 && (
              <div className="mt-8 text-center">
                <button className="px-6 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300">
                  View All Updates ({projectData.updates?.length || 0})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
import { Update } from '@/types';
import Image from 'next/image';

interface UpdatesTabProps {
  updates: Update[];
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

export default function UpdatesTab({ updates = [] }: UpdatesTabProps) {
  const safeUpdates = Array.isArray(updates) ? updates : [];
  
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Total Updates</p>
              <p className="text-3xl font-bold text-white">{safeUpdates.length}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Features</p>
              <p className="text-3xl font-bold text-white">{safeUpdates.filter(u => u.type === 'FEATURE').length}</p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Progress</p>
              <p className="text-3xl font-bold text-white">{safeUpdates.filter(u => u.type === 'PROGRESS').length}</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Milestones</p>
              <p className="text-3xl font-bold text-white">{safeUpdates.filter(u => u.type === 'MILESTONE').length}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Development Timeline
          </h1>
          <p className="text-zinc-400">Follow the complete development journey of this project</p>
        </div>

        <div className="space-y-6">
          {safeUpdates.map((update) => (
            <div key={update.id} className="bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl ${getUpdateTypeColor(update.type)} flex items-center justify-center shadow-lg`}>
                      {update.type === 'FEATURE' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {update.type === 'PROGRESS' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      {update.type === 'MILESTONE' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      )}
                      {update.type === 'RELEASE' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3M7 4H5a1 1 0 00-1 1v16a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1h-2M7 4h10" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{update.title}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getUpdateTypeBadge(update.type)}`}>
                          {update.type}
                        </span>
                      </div>
                      <span className="text-sm text-zinc-400 bg-black/30 px-3 py-1 rounded-lg">{update.createdAt}</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-base">{update.content}</p>
                    
                    {update.images && update.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                        {update.images.map((image, imgIndex) => (
                          <Image
                            key={imgIndex}
                            src={image.url}
                            alt={`Update ${update.id} image ${imgIndex + 1}`}
                            width={500}
                            height={300}
                            className="rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 object-cover"
                            unoptimized
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {safeUpdates.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-zinc-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Updates Yet</h3>
            <p className="text-zinc-500">Updates will appear here as the project progresses.</p>
          </div>
        )}
      </div>
    </div>
  );
} 
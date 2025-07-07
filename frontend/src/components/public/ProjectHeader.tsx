import { ProjectData } from '@/types';

interface ProjectHeaderProps {
  projectData: ProjectData;
  subdomain: string;
  onIssueClick: () => void;
  onFeedbackClick: () => void;
  allowIssues: boolean;
  allowFeedback: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'COMPLETED': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'PAUSED': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  }
};

export default function ProjectHeader({ projectData, subdomain, onIssueClick, onFeedbackClick, allowIssues, allowFeedback }: ProjectHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl ${projectData.color || 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center text-2xl shadow-lg`}>
              {projectData.icon || '📁'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{projectData.title}</h1>
              <div className="text-sm text-blue-400">
                {subdomain}.devlogr.space
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {allowIssues && (
            <button
              onClick={onIssueClick}
              className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">Report Issue</span>
            </button>
            )}
            
            {allowFeedback && (
            <button
              onClick={onFeedbackClick}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
              </svg>
              <span className="text-sm font-medium">Give Feedback</span>
            </button>
            )}

            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(projectData.status)}`}>
              {projectData.status}
            </span>
            
            {projectData.githubUrl && (
              <a 
                href={projectData.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                title="View creator's GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            )}
            
            {projectData.twitterUrl && (
              <a 
                href={projectData.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                title="View creator's Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 
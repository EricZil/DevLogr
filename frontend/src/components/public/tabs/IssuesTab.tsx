import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Issue, Comment } from '@/types';

interface IssuesTabProps {
  issues: Issue[];
  projectSlug?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'IN_PROGRESS': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'CLOSED': return 'text-green-400 bg-green-500/20 border-green-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'HIGH': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'LOW': return 'text-green-400 bg-green-500/20 border-green-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'OPEN':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'IN_PROGRESS':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'CLOSED':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return '🔴';
    case 'HIGH': return '🟠';
    case 'MEDIUM': return '🟡';
    case 'LOW': return '🟢';
    default: return '⚪';
  }
};

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes>1?'s':''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours>1?'s':''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days>1?'s':''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months>1?'s':''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years>1?'s':''} ago`;
}

export default function IssuesTab({ issues, projectSlug }: IssuesTabProps) {
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const fetchComments = async (issueId: string) => {
    if (!projectSlug) return;
    try {
      const apiKeyRes = await fetch('/api/config');
      const { apiKey } = await apiKeyRes.json();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/public/issues/${issueId}/comments`, {
        headers: { 'X-API-Key': apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        setCommentsMap(prev => ({ ...prev, [issueId]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    if (!projectSlug) return;
    issues.forEach((iss) => {
      if ((iss._count?.comments || 0) > 0 && !commentsMap[iss.id]) {
        fetchComments(iss.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, projectSlug]);

  const toggleIssueExpansion = (issueId: string) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
        if (!commentsMap[issueId] && projectSlug) {
          fetchComments(issueId);
        }
      }
      return newSet;
    });
  };

  const filteredAndSortedIssues = issues
    .filter(issue => {
      if (filterStatus !== 'ALL' && issue.status !== filterStatus) return false;
      if (filterPriority !== 'ALL' && issue.priority !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'updated_desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'priority_high':
          const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'title_asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (!issues || issues.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-16">
          <div className="text-center">
            <div className="bg-zinc-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Issues Reported</h3>
            <p className="text-zinc-400 text-lg">Issues will appear here when reported by users or team members.</p>
          </div>
        </div>
      </div>
    );
  }

  const openIssues = issues.filter(issue => issue.status === 'OPEN');
  const closedIssues = issues.filter(issue => issue.status === 'CLOSED');
  const inProgressIssues = issues.filter(issue => issue.status === 'IN_PROGRESS');
  const criticalIssues = issues.filter(issue => issue.priority === 'CRITICAL');

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Open Issues</p>
              <p className="text-3xl font-bold text-red-400">{openIssues.length}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">In Progress</p>
              <p className="text-3xl font-bold text-yellow-400">{inProgressIssues.length}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Resolved</p>
              <p className="text-3xl font-bold text-green-400">{closedIssues.length}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Critical</p>
              <p className="text-3xl font-bold text-orange-400">{criticalIssues.length}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Issue Tracker
          </h1>
          <p className="text-zinc-400 mb-6">Report bugs, request features, or track known issues</p>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-zinc-400">Status:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-zinc-400">Priority:</label>
                <select 
                  value={filterPriority} 
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-zinc-400">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="updated_desc">Recently Updated</option>
                <option value="priority_high">Priority (High to Low)</option>
                <option value="title_asc">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAndSortedIssues.map((issue) => (
            <div key={issue.id} className="bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl ${issue.status === 'OPEN' ? 'bg-red-500' : issue.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-green-500'} flex items-center justify-center shadow-lg`}>
                      {getStatusIcon(issue.status)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
                          <span className="text-lg">{getPriorityIcon(issue.priority)}</span>
                        </div>
                        <p className="text-zinc-300 text-base mb-4 leading-relaxed line-clamp-2">{issue.description}</p>
                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
                            {issue.priority}
                          </span>
                          <span className="text-sm text-zinc-500 bg-black/30 px-3 py-1 rounded-lg">
                            by {issue.reporterName || 'Anonymous'}
                          </span>
                          {(issue._count?.comments || 0) > 0 && (
                            <span className="text-sm text-zinc-400 bg-black/30 px-3 py-1 rounded-lg flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>{issue._count?.comments || 0}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right text-sm text-zinc-500">
                          <div className="bg-black/30 px-3 py-1 rounded-lg mb-2">Created {relativeTime(issue.createdAt)}</div>
                          <div className="bg-black/30 px-3 py-1 rounded-lg">Updated {relativeTime(issue.updatedAt)}</div>
                        </div>
                        {(issue._count?.comments || 0) > 0 && (
                          <button
                            onClick={() => toggleIssueExpansion(issue.id)}
                            className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1 rounded-lg transition-colors duration-200 flex items-center space-x-1"
                          >
                            <span>{expandedIssues.has(issue.id) ? 'Hide' : 'Show'} Comments</span>
                            <svg className={`w-3 h-3 transition-transform duration-200 ${expandedIssues.has(issue.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {expandedIssues.has(issue.id) && commentsMap[issue.id] && commentsMap[issue.id].length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comments ({commentsMap[issue.id].length})
                    </h4>
                    <div className="space-y-4">
                      {commentsMap[issue.id].map((comment) => (
                        <div key={comment.id} className="bg-black/20 rounded-lg p-4 border border-white/5">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                              {comment.user.avatar ? (
                                <Image
                                  src={comment.user.avatar}
                                  alt={comment.user.username}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full"
                                  unoptimized
                                />
                              ) : (
                                comment.user.name?.charAt(0)?.toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm font-semibold text-white">{comment.user.name || comment.user.username}</p>
                                <span className="text-xs text-zinc-500">{relativeTime(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedIssues.length === 0 && issues.length > 0 && (
          <div className="text-center py-16">
            <div className="bg-zinc-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Issues Match Your Filters</h3>
            <p className="text-zinc-500">Try adjusting your filters to see more issues.</p>
          </div>
        )}
      </div>
    </div>
  );
} 


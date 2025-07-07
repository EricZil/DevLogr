'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import Image from 'next/image';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'BUG' | 'FEATURE_REQUEST' | 'IMPROVEMENT' | 'QUESTION';
  reporterName: string;
  reporterEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  }
}

interface IssueManagerProps {
  projectId: string;
}



const getStatusColor = (status: Issue['status']) => {
  switch (status) {
    case 'OPEN': return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'IN_PROGRESS': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'CLOSED': return 'text-green-400 bg-green-500/20 border-green-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

const getPriorityColor = (priority: Issue['priority']) => {
  switch (priority) {
    case 'CRITICAL': return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'HIGH': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'LOW': return 'text-green-400 bg-green-500/20 border-green-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

const getCategoryColor = (category: Issue['category']) => {
  switch (category) {
    case 'BUG': return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'FEATURE_REQUEST': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'IMPROVEMENT': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'QUESTION': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

const getStatusIcon = (status: Issue['status']) => {
  switch (status) {
    case 'OPEN':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'IN_PROGRESS':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'CLOSED':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const getPriorityIcon = (priority: Issue['priority']) => {
  switch (priority) {
    case 'CRITICAL': return '🔴';
    case 'HIGH': return '🟠';
    case 'MEDIUM': return '🟡';
    case 'LOW': return '🟢';
    default: return '⚪';
  }
};

const getCategoryIcon = (category: Issue['category']) => {
  switch (category) {
    case 'BUG': return '🐛';
    case 'FEATURE_REQUEST': return '✨';
    case 'IMPROVEMENT': return '🔧';
    case 'QUESTION': return '❓';
    default: return '📝';
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

export default function IssueManager({ projectId }: IssueManagerProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [comment, setComment] = useState('');
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [, setLoadingComments] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const { success, error } = useNotification();

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const token = api.getAccessToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=issues`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (res.ok) {
        const responseData = await res.json();
        if (responseData.success && responseData.data) {
          setIssues(responseData.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const fetchComments = async (issueId: string) => {
    try {
      setLoadingComments(true);
      const token = api.getAccessToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues?id=${issueId}&action=comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (res.ok) {
        const responseData = await res.json();
        if (responseData.success && responseData.data) {
          setCommentsMap(prev => ({ ...prev, [issueId]: responseData.data }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const updateIssue = async (id: string, fields: Partial<Issue>) => {
    try {
      const token = api.getAccessToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(fields),
      });

      if (res.ok) {
        success('Issue updated successfully');
        fetchIssues();
      } else {
        error('Failed to update issue');
      }
    } catch (err) {
      console.error(err);
      error('Error updating issue');
    }
  };

  const addComment = async () => {
    if (!selectedIssue || !comment.trim()) return;
    try {
      const token = api.getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues?id=${selectedIssue.id}&action=comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ content: comment.trim() }),
      });

      if (res.ok) {
        success('Comment added successfully');
        setComment('');
        fetchComments(selectedIssue.id);
        setSelectedIssue(null);
      } else {
        error('Failed to add comment');
      }
    } catch (err) {
      console.error(err);
      error('Error adding comment');
    }
  };

  const toggleIssueExpansion = (issueId: string) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
        if (!commentsMap[issueId]) {
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
      if (filterCategory !== 'ALL' && issue.category !== filterCategory) return false;
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

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-zinc-400 text-lg">Loading issues...</p>
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-16">
        <div className="text-center">
          <div className="bg-zinc-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Issues Found</h3>
          <p className="text-zinc-400 text-lg">Issues will appear here when users report them.</p>
        </div>
      </div>
    );
  }

  const openIssues = issues.filter(issue => issue.status === 'OPEN');
  const closedIssues = issues.filter(issue => issue.status === 'CLOSED');
  const inProgressIssues = issues.filter(issue => issue.status === 'IN_PROGRESS');
  const criticalIssues = issues.filter(issue => issue.priority === 'CRITICAL');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Issue Management
          </h1>
          <p className="text-zinc-400 mb-6">Manage and respond to user-reported issues</p>
          
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

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-zinc-400">Category:</label>
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="ALL">All Categories</option>
                  <option value="BUG">Bug</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                  <option value="IMPROVEMENT">Improvement</option>
                  <option value="QUESTION">Question</option>
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
                          <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                        </div>
                        <p className="text-zinc-300 text-base mb-4 leading-relaxed">{issue.description}</p>
                        
                        <div className="flex items-center space-x-3 flex-wrap gap-2 mb-4">
                          <select
                            value={issue.status}
                            onChange={(e) => updateIssue(issue.id, { status: e.target.value as Issue['status'] })}
                            className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                          <select
                            value={issue.priority}
                            onChange={(e) => updateIssue(issue.id, { priority: e.target.value as Issue['priority'] })}
                            className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                          <select
                            value={issue.category}
                            onChange={(e) => updateIssue(issue.id, { category: e.target.value as Issue['category'] })}
                            className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="BUG">Bug</option>
                            <option value="FEATURE_REQUEST">Feature Request</option>
                            <option value="IMPROVEMENT">Improvement</option>
                            <option value="QUESTION">Question</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
                            {issue.priority}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(issue.category)}`}>
                            {issue.category.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-zinc-500 bg-black/30 px-3 py-1 rounded-lg">
                            by {issue.reporterName || 'Anonymous'}
                            {issue.reporterEmail && (
                              <a href={`mailto:${issue.reporterEmail}`} className="ml-1 text-blue-400 hover:text-blue-300 underline">
                                {issue.reporterEmail}
                              </a>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right text-sm text-zinc-500">
                          <div className="bg-black/30 px-3 py-1 rounded-lg mb-2">Created {relativeTime(issue.createdAt)}</div>
                          <div className="bg-black/30 px-3 py-1 rounded-lg">Updated {relativeTime(issue.updatedAt)}</div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              if (!commentsMap[issue.id]) {
                                fetchComments(issue.id);
                              }
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1 rounded-lg transition-colors duration-200"
                          >
                            Add Comment
                          </button>
                          {commentsMap[issue.id] && commentsMap[issue.id].length > 0 && (
                            <button
                              onClick={() => toggleIssueExpansion(issue.id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1 rounded-lg transition-colors duration-200 flex items-center space-x-1"
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
                                <Image src={comment.user.avatar} alt={comment.user.username} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
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

      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl p-8 space-y-6">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl ${selectedIssue.status === 'OPEN' ? 'bg-red-500' : selectedIssue.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-green-500'} flex items-center justify-center shadow-lg`}>
                {getStatusIcon(selectedIssue.status)}
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Add Comment</h4>
                <p className="text-zinc-400 text-sm">Responding to: {selectedIssue.title}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Your Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Type your response here..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedIssue(null)} 
                className="px-6 py-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={addComment} 
                disabled={!comment.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Comment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
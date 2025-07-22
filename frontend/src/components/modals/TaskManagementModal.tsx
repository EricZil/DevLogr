'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Task } from '@/types';

const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  let html = markdown;
  
  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre class="bg-black/40 border border-white/10 rounded-lg p-4 overflow-x-auto my-4"><code class="text-green-400 text-sm font-mono">${code.trim()}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });
  
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const index = inlineCodes.length;
    inlineCodes.push(`<code class="bg-black/40 text-green-400 px-1.5 py-0.5 rounded text-sm font-mono">${code}</code>`);
    return `__INLINE_CODE_${index}__`;
  });
  
  html = html.replace(/^#{6}\s+(.+)$/gm, '<h6 class="text-sm font-bold text-zinc-300 mt-4 mb-2">$1</h6>');
  html = html.replace(/^#{5}\s+(.+)$/gm, '<h5 class="text-base font-bold text-zinc-300 mt-4 mb-2">$1</h5>');
  html = html.replace(/^#{4}\s+(.+)$/gm, '<h4 class="text-lg font-bold text-zinc-200 mt-4 mb-2">$1</h4>');
  html = html.replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-xl font-bold text-zinc-100 mt-6 mb-3">$1</h3>');
  html = html.replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-6 mb-4">$1</h2>');
  html = html.replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-3xl font-bold text-white mt-8 mb-4">$1</h1>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold text-white"><em class="italic">$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="italic text-zinc-300">$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del class="line-through text-zinc-400">$1</del>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-blue-500/50 pl-4 py-2 my-4 bg-blue-500/10 text-zinc-300 italic">$1</blockquote>');
  html = html.replace(/^---$/gm, '<hr class="border-t border-white/20 my-6" />');
  html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li class="text-zinc-300 mb-1">$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="text-zinc-300 mb-1">$1</li>');
  html = html.replace(/((<li class="text-zinc-300 mb-1">[^<]+<\/li>\s*)+)/g, '<ul class="list-disc list-inside space-y-1 my-4 ml-4">$1</ul>');
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });
  inlineCodes.forEach((code, index) => {
    html = html.replace(`__INLINE_CODE_${index}__`, code);
  });
  
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inParagraph = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    if (!line) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      continue;
    }
    
    const isBlockElement = /^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/.test(line) || line.includes('</h') || line.includes('</ul>') || line.includes('</ol>') || line.includes('</blockquote>') || line.includes('</pre>');
    
    if (isBlockElement) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push(line);
    } else {
      if (!inParagraph) {
        processedLines.push('<p class="text-zinc-300 leading-relaxed mb-4">');
        inParagraph = true;
      }
      
      if (nextLine && !nextLine.startsWith('<')) {
        processedLines.push(line + '<br />');
      } else {
        processedLines.push(line);
      }
    }
  }
  
  if (inParagraph) {
    processedLines.push('</p>');
  }
  
  html = processedLines.join('\n')
    .replace(/<p class="[^"]*">\s*<\/p>/g, '')
    .replace(/<br \/>\s*<\/p>/g, '</p>')
    .replace(/(<\/[^>]+>)\s*<br \/>/g, '$1');
  
  return html;
};

interface TaskManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdated: () => void;
}

export default function TaskManagementModal({ 
  isOpen, 
  onClose, 
  task,
  onTaskUpdated
}: TaskManagementModalProps) {
  const [updatedTask, setUpdatedTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'details'>('overview');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    if (task) {
      setUpdatedTask({ ...task });
      setEditedTitle(task.title);
    }
  }, [task]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return '🚨';
      case 'HIGH': return '🔥';
      case 'MEDIUM': return '⚡';
      case 'LOW': return '🌱';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'LOW': return 'text-green-400 bg-green-500/10 border-green-500/30';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'TODO': return '📋';
      case 'IN_PROGRESS': return '🚀';
      case 'IN_REVIEW': return '👀';
      case 'DONE': return '✅';
      case 'CANCELLED': return '❌';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'TODO': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'IN_REVIEW': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'DONE': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'CANCELLED': return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim() || !updatedTask) return;
    
    try {
      const token = api.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks?id=${updatedTask.id}&action=subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newSubtaskTitle.trim()
        })
      });

      if (response.ok) {
        const newSubtask = await response.json();
        setUpdatedTask(prev => prev ? {
          ...prev,
          subtasks: [...prev.subtasks, newSubtask]
        } : null);
        setNewSubtaskTitle('');
        showToast('Subtask added successfully!', 'success');
        onTaskUpdated();
      } else {
        showToast('Failed to add subtask', 'error');
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
      showToast('An error occurred', 'error');
    }
  };

  const toggleSubtask = async (subtaskId: string) => {
    if (!updatedTask) return;

    const subtask = updatedTask.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    try {
      const token = api.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/subtasks?id=${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          completed: !subtask.completed
        })
      });

      if (response.ok) {
        setUpdatedTask(prev => prev ? {
          ...prev,
          subtasks: prev.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          )
        } : null);
        showToast('Subtask updated!', 'success');
        onTaskUpdated();
      } else {
        showToast('Failed to update subtask', 'error');
      }
    } catch (error) {
      console.error('Failed to update subtask:', error);
      showToast('An error occurred', 'error');
    }
  };

  const removeSubtask = async (subtaskId: string) => {
    if (!updatedTask) return;

    try {
      const token = api.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/subtasks?id=${subtaskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        setUpdatedTask(prev => prev ? {
          ...prev,
          subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
        } : null);
        showToast('Subtask removed!', 'success');
        onTaskUpdated();
      } else {
        showToast('Failed to remove subtask', 'error');
      }
    } catch (error) {
      console.error('Failed to remove subtask:', error);
      showToast('An error occurred', 'error');
    }
  };

  const updateTaskStatus = async (newStatus: Task['status']) => {
    if (!updatedTask) return;

    try {
      setIsUpdating(true);
      const token = api.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks?id=${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (response.ok) {
        setUpdatedTask(prev => prev ? { ...prev, status: newStatus } : null);
        showToast('Task status updated!', 'success');
        onTaskUpdated();
      } else {
        showToast('Failed to update task status', 'error');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTaskTitle = async () => {
    if (!updatedTask || !editedTitle.trim() || editedTitle === updatedTask.title) {
      setIsEditingTitle(false);
      setEditedTitle(updatedTask?.title || '');
      return;
    }

    try {
      setIsUpdating(true);
      const token = api.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks?id=${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editedTitle.trim()
        })
      });

      if (response.ok) {
        setUpdatedTask(prev => prev ? { ...prev, title: editedTitle.trim() } : null);
        setIsEditingTitle(false);
        showToast('Task title updated!', 'success');
        onTaskUpdated();
      } else {
        showToast('Failed to update task title', 'error');
        setEditedTitle(updatedTask.title);
      }
    } catch (error) {
      console.error('Failed to update task title:', error);
      showToast('An error occurred', 'error');
      setEditedTitle(updatedTask.title);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTaskPriority = async (newPriority: Task['priority']) => {
    if (!updatedTask || newPriority === updatedTask.priority) return;

    try {
      setIsUpdating(true);
      const token = api.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks?id=${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          priority: newPriority
        })
      });

      if (response.ok) {
        setUpdatedTask(prev => prev ? { ...prev, priority: newPriority } : null);
        showToast('Task priority updated!', 'success');
        onTaskUpdated();
      } else {
        showToast('Failed to update task priority', 'error');
      }
    } catch (error) {
      console.error('Failed to update task priority:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateTaskTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditedTitle(updatedTask?.title || '');
    }
  };

  if (!isOpen || !updatedTask) return null;

  const completedSubtasks = updatedTask.subtasks.filter(st => st.completed).length;
  const totalSubtasks = updatedTask.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 backdrop-blur-md p-1 sm:p-2 lg:p-4 pt-32 sm:pt-36 lg:pt-40">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 rounded-2xl w-full max-w-6xl max-h-[calc(100vh-12rem)] flex flex-col shadow-2xl overflow-hidden"
          style={{
            minHeight: 'min(500px, calc(100vh - 14rem))',
            zoom: '1',
            transform: 'scale(1)'
          }}
        >
          <div className="relative border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-black/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getStatusColor(updatedTask.status)}`}>
                  <span className="text-xl">{getStatusIcon(updatedTask.status)}</span>
                </div>
                <div className="flex-1">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={updateTaskTitle}
                      onKeyDown={handleTitleKeyPress}
                      className="text-xl sm:text-2xl font-bold text-white bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-400 w-full"
                      autoFocus
                      disabled={isUpdating}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-white line-clamp-1">{updatedTask.title}</h2>
                      <button
                        onClick={() => setIsEditingTitle(true)}
                        className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit task title"
                      >
                        <svg className="w-4 h-4 text-zinc-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 text-xs sm:text-sm mt-1">
                    <span className={`px-2 py-1 rounded-full border ${getPriorityColor(updatedTask.priority)}`}>
                      {getPriorityIcon(updatedTask.priority)} {updatedTask.priority}
                    </span>
                    <span className="text-zinc-400">
                      {updatedTask.milestone?.title}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex mt-6 space-x-1 bg-black/30 p-1 rounded-xl border border-white/10">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'subtasks', label: `Subtasks (${totalSubtasks})`, icon: '📋' },
                { id: 'details', label: 'Details', icon: '📝' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm sm:text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex">
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6">
                  {activeTab === 'overview' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-400 text-sm font-medium">Status</span>
                            <span className="text-xl">{getStatusIcon(updatedTask.status)}</span>
                          </div>
                          <p className="text-white font-semibold">{updatedTask.status.replace('_', ' ')}</p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-green-400 text-sm font-medium">Subtasks</span>
                            <span className="text-xl">📋</span>
                          </div>
                          <p className="text-white font-semibold">{completedSubtasks}/{totalSubtasks} Complete</p>
                          <div className="w-full bg-black/30 rounded-full h-2 mt-2">
                            <div 
                              className="h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${subtaskProgress}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-400 text-sm font-medium">Priority</span>
                            <span className="text-xl">{getPriorityIcon(updatedTask.priority)}</span>
                          </div>
                          <p className="text-white font-semibold">{updatedTask.priority}</p>
                        </div>
                      </div>

                      {updatedTask.description && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                          <div className="p-4 bg-black/20 border border-white/10 rounded-xl">
                            <div 
                              className="prose prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: markdownToHtml(updatedTask.description) }}
                            />
                          </div>
                        </div>
                      )}

                      {totalSubtasks > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Recent Subtasks</h3>
                          <div className="space-y-2">
                            {updatedTask.subtasks.slice(0, 3).map((subtask) => (
                              <div
                                key={subtask.id}
                                className="flex items-center space-x-3 p-3 bg-black/20 border border-white/10 rounded-xl"
                              >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  subtask.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-zinc-500'
                                }`}>
                                  {subtask.completed && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="flex-1 text-sm text-zinc-300">{subtask.title}</span>
                              </div>
                            ))}
                            {totalSubtasks > 3 && (
                              <button
                                onClick={() => setActiveTab('subtasks')}
                                className="w-full p-3 text-blue-400 hover:text-blue-300 text-sm border border-blue-500/30 rounded-xl hover:bg-blue-500/10 transition-all"
                              >
                                View all {totalSubtasks} subtasks →
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'subtasks' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                          className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                          placeholder="Add a new subtask..."
                        />
                        <button
                          onClick={addSubtask}
                          disabled={!newSubtaskTitle.trim()}
                          className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                        >
                          Add
                        </button>
                      </div>

                      <div className="space-y-3">
                        {totalSubtasks === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-zinc-700 rounded-xl">
                            <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-zinc-400 mb-1">No subtasks yet</h4>
                            <p className="text-zinc-500 text-xs">Break down this task into smaller pieces</p>
                          </div>
                        ) : (
                          updatedTask.subtasks.map((subtask) => (
                            <motion.div
                              key={subtask.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-3 p-4 bg-black/20 border border-white/10 rounded-xl group hover:bg-black/30 transition-all"
                            >
                              <button
                                onClick={() => toggleSubtask(subtask.id)}
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                  subtask.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-zinc-500 hover:border-green-500'
                                }`}
                              >
                                {subtask.completed && (
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <span className="flex-1 text-zinc-300 font-medium">
                                {subtask.title}
                              </span>
                              <button
                                onClick={() => removeSubtask(subtask.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'details' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Task Information</h3>
                          <div className="space-y-3">
                            <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
                              <span className="text-zinc-400 text-sm">Created</span>
                              <p className="text-white font-medium">{new Date(updatedTask.createdAt).toLocaleDateString()}</p>
                            </div>
                            {updatedTask.dueDate && (
                              <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
                                <span className="text-zinc-400 text-sm">Due Date</span>
                                <p className="text-white font-medium">{new Date(updatedTask.dueDate).toLocaleDateString()}</p>
                              </div>
                            )}
                            {updatedTask.estimatedHours && (
                              <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
                                <span className="text-zinc-400 text-sm">Estimated Hours</span>
                                <p className="text-white font-medium">{updatedTask.estimatedHours}h</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Activity</h3>
                          <div className="space-y-3">
                            <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
                              <span className="text-zinc-400 text-sm">Comments</span>
                              <p className="text-white font-medium">{updatedTask._count.comments}</p>
                            </div>
                            <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
                              <span className="text-zinc-400 text-sm">Time Entries</span>
                              <p className="text-white font-medium">{updatedTask._count.timeEntries}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="w-80 border-l border-white/10 bg-black/20 backdrop-blur-sm overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">Update Priority</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => updateTaskPriority(priority)}
                          disabled={updatedTask.priority === priority || isUpdating}
                          className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                            updatedTask.priority === priority
                              ? `${getPriorityColor(priority)} ring-2 ring-blue-500/50`
                              : 'border-white/10 bg-black/20 hover:border-white/20'
                          }`}
                        >
                          <span className="text-xl mb-1">{getPriorityIcon(priority)}</span>
                          <span className="text-xs font-medium text-white">{priority}</span>
                          {updatedTask.priority === priority && (
                            <svg className="w-3 h-3 mt-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">Update Status</label>
                    <div className="space-y-2">
                      {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateTaskStatus(status)}
                          disabled={updatedTask.status === status || isUpdating}
                          className={`w-full flex items-center p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                            updatedTask.status === status
                              ? `${getStatusColor(status)} ring-2 ring-blue-500/50`
                              : 'border-white/10 bg-black/20 hover:border-white/20'
                          }`}
                        >
                          <span className="text-lg mr-3">{getStatusIcon(status)}</span>
                          <span className="text-sm font-medium text-white">
                            {status.replace('_', ' ')}
                          </span>
                          {updatedTask.status === status && (
                            <svg className="w-4 h-4 ml-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3">Progress Overview</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Subtasks</span>
                        <span className="text-white font-medium">{Math.round(subtaskProgress)}%</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-2">
                        <div 
                          className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${subtaskProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-zinc-400">
                        {completedSubtasks} of {totalSubtasks} subtasks complete
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 p-4 sm:p-6 bg-black/20 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4 text-sm text-zinc-400">
                <span>Last updated: {new Date(updatedTask.createdAt).toLocaleDateString()}</span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-black/30 border border-white/10 text-white rounded-xl font-medium hover:bg-black/50 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="fixed top-4 right-4 z-[10000]"
            >
              <div className={`px-6 py-4 rounded-xl shadow-lg backdrop-blur-lg border ${
                toast.type === 'success' 
                  ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">{toast.message}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
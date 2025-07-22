'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Milestone } from '@/types';
import RichTextEditor from '@/components/shared/ui/RichTextEditor';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  milestones: Milestone[];
  selectedMilestone?: string | null;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface NewTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  estimatedHours: string;
  dueDate: string;
  milestoneId: string;
  subtasks: Subtask[];
}

export default function AddTaskModal({ 
  isOpen, 
  onClose, 
  onTaskCreated, 
  milestones, 
  selectedMilestone
}: AddTaskModalProps) {
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    estimatedHours: '',
    dueDate: '',
    milestoneId: selectedMilestone || '',
    subtasks: []
  });
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'advanced'>('details');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (selectedMilestone) {
      setNewTask(prev => ({ ...prev, milestoneId: selectedMilestone }));
    }
  }, [selectedMilestone]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPriorityIcon = (priority: NewTask['priority']) => {
    switch (priority) {
      case 'URGENT': return '🚨';
      case 'HIGH': return '🔥';
      case 'MEDIUM': return '⚡';
      case 'LOW': return '🌱';
    }
  };

  const getPriorityColor = (priority: NewTask['priority']) => {
    switch (priority) {
      case 'URGENT': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'LOW': return 'text-green-400 bg-green-500/10 border-green-500/30';
    }
  };

  const getStatusIcon = (status: NewTask['status']) => {
    switch (status) {
      case 'TODO': return '📋';
      case 'IN_PROGRESS': return '🚀';
      case 'IN_REVIEW': return '👀';
      case 'DONE': return '✅';
      case 'CANCELLED': return '❌';
    }
  };

  const getStatusColor = (status: NewTask['status']) => {
    switch (status) {
      case 'TODO': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'IN_REVIEW': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'DONE': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'CANCELLED': return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    
    setNewTask(prev => ({ 
      ...prev, 
      subtasks: [...prev.subtasks, newSubtask] 
    }));
    setNewSubtaskTitle('');
  };

  const removeSubtask = (subtaskId: string) => {
    setNewTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
    }));
  };

  const toggleSubtask = (subtaskId: string) => {
    setNewTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  const createTask = async () => {
    if (!newTask.title.trim() || !newTask.milestoneId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setIsCreating(true);
      const token = api.getAccessToken();
      
      const taskData = {
        ...newTask,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : null,
        dueDate: newTask.dueDate || null,
        subtasks: newTask.subtasks.map(st => ({
          title: st.title,
          completed: st.completed
        }))
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/milestones?id=${newTask.milestoneId}&action=tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify(taskData),
        }
      );

      if (response.ok) {
        setNewTask({
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'TODO',
          estimatedHours: '',
          dueDate: '',
          milestoneId: selectedMilestone || '',
          subtasks: []
        });
        setActiveTab('details');
        showToast('Task created successfully!', 'success');
        onTaskCreated();
        setTimeout(() => onClose(), 1000);
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to create task', 'error');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'TODO',
        estimatedHours: '',
        dueDate: '',
        milestoneId: selectedMilestone || '',
        subtasks: []
      });
      setActiveTab('details');
      setNewSubtaskTitle('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-1 sm:p-2 lg:p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 rounded-2xl w-full max-w-7xl max-h-[98vh] flex flex-col shadow-2xl overflow-hidden"
          style={{ 
            minHeight: 'min(600px, 85vh)',
            aspectRatio: '16/10',
            zoom: '1',
            transform: 'scale(1)'
          }}
        >
          <div className="relative border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-black/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Create New Task</h2>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                    Build something amazing, step by step
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isCreating}
                className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex mt-6 space-x-1 bg-black/30 p-1 rounded-xl border border-white/10">
              {[
                { id: 'details', label: 'Details', icon: '📝' },
                { id: 'subtasks', label: 'Subtasks', icon: '📋' },
                { id: 'advanced', label: 'Advanced', icon: '⚙️' }
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
                  {activeTab === 'details' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-zinc-300 mb-2">Task Title *</label>
                        <input
                          type="text"
                          value={newTask.title}
                          onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-base font-medium"
                          placeholder="Enter a clear, actionable task title..."
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-zinc-300 mb-2">Description</label>
                        <RichTextEditor
                          value={newTask.description}
                          onChange={(value) => setNewTask(prev => ({ ...prev, description: value }))}
                          placeholder="Describe the task requirements, acceptance criteria, and any additional context..."
                          minHeight="200px"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-zinc-300 mb-2">Milestone *</label>
                          <select
                            value={newTask.milestoneId}
                            onChange={(e) => setNewTask(prev => ({ ...prev, milestoneId: e.target.value }))}
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-sm"
                          >
                            <option value="">Select milestone</option>
                            {milestones.map((milestone) => (
                              <option key={milestone.id} value={milestone.id}>
                                {milestone.title} ({milestone.progress}%)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-zinc-300 mb-2">Estimated Hours</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={newTask.estimatedHours}
                              onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: e.target.value }))}
                              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all pr-12"
                              placeholder="e.g., 4.5"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 text-sm">
                              hrs
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-zinc-300 mb-2">Due Date</label>
                          <input
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {newTask.milestoneId && (
                        <div className="p-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                              <div className="text-white font-semibold text-sm">
                                {milestones.find(m => m.id === newTask.milestoneId)?.title}
                              </div>
                            </div>
                            <div className="text-xs text-zinc-400">
                              {(milestones.find(m => m.id === newTask.milestoneId)?.tasks || []).length} existing tasks
                            </div>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${milestones.find(m => m.id === newTask.milestoneId)?.progress || 0}%` }}
                            />
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
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white">Subtasks</h3>
                          <span className="text-sm text-zinc-400 bg-zinc-800/50 px-3 py-1 rounded-full">
                            {newTask.subtasks.length} subtasks
                          </span>
                        </div>
                        <p className="text-zinc-400 text-sm mb-4">Break down your task into smaller, manageable pieces</p>

                        <div className="flex space-x-3 mb-4">
                          <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                            className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                            placeholder="Add a subtask..."
                          />
                          <button
                            onClick={addSubtask}
                            disabled={!newSubtaskTitle.trim()}
                            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                          >
                            Add
                          </button>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {newTask.subtasks.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-zinc-700 rounded-xl">
                              <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                              <h4 className="text-sm font-semibold text-zinc-400 mb-1">No subtasks yet</h4>
                              <p className="text-zinc-500 text-xs">Break down your task for better organization</p>
                            </div>
                          ) : (
                            newTask.subtasks.map((subtask, index) => (
                              <motion.div
                                key={subtask.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center space-x-3 p-3 bg-black/20 border border-white/10 rounded-xl group hover:bg-black/30 transition-all"
                              >
                                <button
                                  onClick={() => toggleSubtask(subtask.id)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                    subtask.completed
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-zinc-500 hover:border-green-500'
                                  }`}
                                >
                                  {subtask.completed && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <span className="flex-1 text-sm text-zinc-300">
                                  {index + 1}. {subtask.title}
                                </span>
                                <button
                                  onClick={() => removeSubtask(subtask.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded transition-all"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="w-80 border-l border-white/10 bg-black/20 backdrop-blur-sm overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Task Settings</h3>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">Priority Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((priority) => (
                        <label 
                          key={priority} 
                          className={`relative flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                            newTask.priority === priority
                              ? `${getPriorityColor(priority)} ring-2`
                              : 'border-white/10 bg-black/20 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="priority"
                            value={priority}
                            checked={newTask.priority === priority}
                            onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as NewTask['priority'] }))}
                            className="sr-only"
                          />
                          <span className="text-xl mb-1">{getPriorityIcon(priority)}</span>
                          <span className="text-xs font-medium text-white">{priority}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">Initial Status</label>
                    <div className="space-y-2">
                      {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] as const).map((status) => (
                        <label 
                          key={status} 
                          className={`relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                            newTask.status === status
                              ? `${getStatusColor(status)} ring-2`
                              : 'border-white/10 bg-black/20 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status}
                            checked={newTask.status === status}
                            onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value as NewTask['status'] }))}
                            className="sr-only"
                          />
                          <span className="text-lg mr-3">{getStatusIcon(status)}</span>
                          <span className="text-sm font-medium text-white">
                            {status.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {activeTab === 'advanced' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-xl">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Advanced Features</h4>
                        <p className="text-xs text-zinc-400">Additional task settings and configurations will be available here in future updates.</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 p-4 sm:p-6 bg-black/20 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 text-sm text-zinc-400">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${newTask.title.trim() ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span>Title</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${newTask.milestoneId ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span>Milestone</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${newTask.subtasks.length > 0 ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                  <span>{newTask.subtasks.length} Subtasks</span>
                </div>
              </div>
              <div className="flex space-x-3 w-full sm:w-auto">
                <button
                  onClick={handleClose}
                  disabled={isCreating}
                  className="flex-1 sm:flex-none px-6 py-3 bg-black/30 border border-white/10 text-white rounded-xl font-medium hover:bg-black/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={createTask}
                  disabled={!newTask.title.trim() || !newTask.milestoneId || isCreating}
                  className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                >
                  {isCreating ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
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
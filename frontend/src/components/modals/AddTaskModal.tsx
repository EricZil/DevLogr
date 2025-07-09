'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Milestone } from '@/types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  milestones: Milestone[];
  selectedMilestone?: string | null;
}

interface NewTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  estimatedHours: string;
  dueDate: string;
  milestoneId: string;
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
    milestoneId: selectedMilestone || (milestones.length > 0 ? milestones[0].id : '')
  });
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (selectedMilestone) {
      setNewTask(prev => ({ ...prev, milestoneId: selectedMilestone }));
    }
  }, [selectedMilestone]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPriorityColor = (priority: NewTask['priority']) => {
    switch (priority) {
      case 'URGENT': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'HIGH': return 'text-orange-500 bg-orange-500/20 border-orange-500/30';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'LOW': return 'text-green-500 bg-green-500/20 border-green-500/30';
    }
  };

  const getStatusColor = (status: NewTask['status']) => {
    switch (status) {
      case 'TODO': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'IN_REVIEW': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'DONE': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'CANCELLED': return 'text-red-400 bg-red-500/20 border-red-500/30';
    }
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.title.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    if (!newTask.milestoneId) {
      showToast('Please select a milestone', 'error');
      return;
    }

    setIsCreating(true);

    try {
      const token = api.getAccessToken();
      
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || null,
        priority: newTask.priority,
        status: newTask.status,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : null,
        dueDate: newTask.dueDate || null
      };

      console.log('Creating task with status:', taskData.status);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/milestones?id=${newTask.milestoneId}&action=tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        setNewTask({
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'TODO',
          estimatedHours: '',
          dueDate: '',
          milestoneId: selectedMilestone || (milestones.length > 0 ? milestones[0].id : '')
        });
        
        showToast('Task created successfully!', 'success');
        onTaskCreated();
        onClose();
      } else {
        const errorText = await response.text();
        console.error('Failed to create task:', response.status, errorText);
        showToast('Failed to create task', 'error');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      estimatedHours: '',
      dueDate: '',
      milestoneId: selectedMilestone || (milestones.length > 0 ? milestones[0].id : '')
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        >
          <div className="border-b border-white/10 px-8 py-6 bg-black/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Task</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Add a new task to your project
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2.5 hover:bg-white/10 rounded-lg transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">Task Title *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-5 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all text-lg font-medium"
                    placeholder="Enter task title..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full px-5 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all resize-none"
                    placeholder="Describe the task requirements, acceptance criteria, and any additional details..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">Estimated Hours</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newTask.estimatedHours}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: e.target.value }))}
                      className="w-full px-5 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                      placeholder="e.g., 4.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">Due Date</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-5 py-4 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-80 border-l border-white/10 p-8 bg-black/20 backdrop-blur-sm overflow-y-auto">
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-white">Task Properties</h3>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-4">Milestone *</label>
                  <select
                    value={newTask.milestoneId}
                    onChange={(e) => setNewTask(prev => ({ ...prev, milestoneId: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-all"
                  >
                    <option value="">Select a milestone</option>
                    {milestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title} ({milestone.progress}%)
                      </option>
                    ))}
                  </select>
                  {newTask.milestoneId && (
                    <div className="mt-3 p-3 bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="text-white font-semibold">
                          {milestones.find(m => m.id === newTask.milestoneId)?.title}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {(milestones.find(m => m.id === newTask.milestoneId)?.tasks || []).length} existing tasks
                      </div>
                      <div className="mt-3 w-full bg-black/30 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${milestones.find(m => m.id === newTask.milestoneId)?.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-4">Status</label>
                  <div className="space-y-3">
                    {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'].map((status) => (
                      <label key={status} className="flex items-center space-x-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-all">
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={newTask.status === status}
                          onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value as NewTask['status'] }))}
                          className="w-4 h-4 text-blue-500 bg-transparent border-2 border-zinc-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
                        />
                        <span className={`text-sm px-3 py-2 rounded-lg border font-medium transition-all ${getStatusColor(status as NewTask['status'])}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-4">Priority</label>
                  <div className="space-y-3">
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                      <label key={priority} className="flex items-center space-x-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-all">
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={newTask.priority === priority}
                          onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as NewTask['priority'] }))}
                          className="w-4 h-4 text-blue-500 bg-transparent border-2 border-zinc-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
                        />
                        <span className={`text-sm px-3 py-2 rounded-lg border font-medium transition-all ${getPriorityColor(priority as NewTask['priority'])}`}>
                          {priority}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 p-6 bg-black/10 backdrop-blur-sm">
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-black/30 border border-white/10 text-white rounded-xl font-medium hover:bg-black/50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                disabled={!newTask.title.trim() || !newTask.milestoneId || isCreating}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
              >
                {isCreating ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </motion.div>

        {toast && (
          <div className="fixed top-4 right-4 z-[10000]">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`px-6 py-4 rounded-xl shadow-lg ${
                toast.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}
            >
              {toast.message}
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
} 
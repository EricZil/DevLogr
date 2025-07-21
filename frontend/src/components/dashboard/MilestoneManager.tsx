'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';

import { useNotification } from '@/contexts/NotificationContext';
import { Milestone, Task } from '@/types';

const EnterpriseKanban = dynamic(
  () => import('@/components/dashboard/kanban/EnterpriseKanban'),
  { ssr: false }
);

const AddTaskModal = dynamic(
  () => import('@/components/modals/AddTaskModal'),
  { ssr: false }
);

const TaskManagementModal = dynamic(
  () => import('@/components/modals/TaskManagementModal'),
  { ssr: false }
);

interface MilestoneStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  averageProgress: number;
}

interface MilestoneManagerProps {
  projectId: string;
}

export default function MilestoneManager({ projectId }: MilestoneManagerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const { success, error } = useNotification();

  const fetchMilestones = useCallback(async () => {
    try {
      const token = api.getAccessToken();
      if (!token) {
        console.log('No access token available for fetching milestones');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=milestones`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setMilestones(result.data);
        } else {
          console.error('Invalid milestones response format:', result);
          setMilestones([]);
        }
      } else {
        console.error('Failed to fetch milestones:', response.status, response.statusText);
        setMilestones([]);
      }
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchStats = useCallback(async () => {
    try {
      const token = api.getAccessToken();
      if (!token) {
        console.log('No access token available for fetching stats');
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=milestones&subaction=stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          console.error('Invalid stats response format:', result);
        }
      } else {
        console.error('Failed to fetch stats:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [projectId]);

  const fetchAllTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const token = api.getAccessToken();
      if (!token) {
        console.log('No access token available for fetching tasks');
        setLoadingTasks(false);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setAllTasks(result.data);
        } else {
          console.error('Invalid tasks response format:', result);
          setAllTasks([]);
        }
      } else {
        console.error('Failed to fetch tasks:', response.status, response.statusText);
        setAllTasks([]);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setAllTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMilestones();
    fetchStats();
    fetchAllTasks();
  }, [projectId, fetchMilestones, fetchStats, fetchAllTasks]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchMilestones();
      fetchStats();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchMilestones, fetchStats]);

  const fetchMilestoneTasks = async (milestoneId: string) => {
    try {
      setLoadingTasks(true);
      const token = api.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/milestones?id=${milestoneId}&action=tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setTasks(result.data);
        } else {
          console.error('Invalid milestone tasks response format:', result);
          setTasks([]);
        }
      } else {
        console.error('Failed to fetch milestone tasks:', response.status, response.statusText);
        setTasks([]);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: Task['status']) => {
    const originalTask = [...tasks, ...allTasks].find(task => task.id === taskId);
    const originalStatus = originalTask?.status;
    
    if (!originalStatus) {
      error('Task not found');
      return;
    }

    const updateTaskStatus = (taskList: Task[]) =>
      taskList.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      );

    setTasks(updateTaskStatus);
    setAllTasks(updateTaskStatus);

    try {
      performance.mark('task-update-start');
      
      const token = api.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks?id=${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      performance.mark('task-update-end');
      performance.measure('task-update-duration', 'task-update-start', 'task-update-end');
      
      const measure = performance.getEntriesByName('task-update-duration')[0];
      console.log(`Task update took: ${measure.duration.toFixed(2)}ms`);

      if (response.ok) {
        success('Task status updated!');
      } else {
        const rollbackTaskStatus = (taskList: Task[]) =>
          taskList.map(task =>
            task.id === taskId
              ? { ...task, status: originalStatus }
              : task
          );
        
        setTasks(rollbackTaskStatus);
        setAllTasks(rollbackTaskStatus);
        error('Failed to update task status');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      
      const rollbackTaskStatus = (taskList: Task[]) =>
        taskList.map(task =>
          task.id === taskId
            ? { ...task, status: originalStatus }
            : task
        );
      
      setTasks(rollbackTaskStatus);
      setAllTasks(rollbackTaskStatus);
      error('Network error occurred');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskUpdated = () => {
    if (selectedMilestone) {
      fetchMilestoneTasks(selectedMilestone.id);
    } else {
      fetchAllTasks();
    }
  };

  const handleCreateTask = () => {
    setIsAddTaskModalOpen(true);
  };

  const handleTaskCreated = () => {
    if (selectedMilestone) {
      fetchMilestoneTasks(selectedMilestone.id);
    } else {
      fetchAllTasks();
    }
  };

  const handleMilestoneSelect = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    fetchMilestoneTasks(milestone.id);
  };

  const handleShowAllTasks = () => {
    setSelectedMilestone(null);
    fetchAllTasks();
  };

  const createMilestone = async () => {
    if (!newMilestone.title.trim()) {
      error('Milestone title is required');
      return;
    }

    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newMilestone.title,
          description: newMilestone.description || null,
          dueDate: newMilestone.dueDate || null
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setNewMilestone({ title: '', description: '', dueDate: '' });
        setIsCreating(false);
        success('Milestone created successfully!');
        fetchMilestones();
        fetchStats();
      } else {
        console.error('API Error:', data);
        error(data.message || data.error || 'Failed to create milestone');
      }
    } catch (err) {
      console.error('Failed to create milestone:', err);
      error('Network error occurred');
    }
  };

  const updateMilestone = async (milestone: Milestone) => {
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/milestones?id=${milestone.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: milestone.title,
          description: milestone.description,
          dueDate: milestone.dueDate,
          progress: milestone.progress
        })
      });

      if (response.ok) {
        setEditingMilestone(null);
        success('Milestone updated successfully!');
        fetchMilestones();
        fetchStats();
      } else {
        error('Failed to update milestone');
      }
    } catch (err) {
      console.error('Failed to update milestone:', err);
      error('An error occurred');
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/milestones?id=${milestoneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        success('Milestone deleted successfully!');
        fetchMilestones();
        fetchStats();
      } else {
        error('Failed to delete milestone');
      }
    } catch (err) {
      console.error('Failed to delete milestone:', err);
      error('An error occurred');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string | null, completedAt: string | null) => {
    if (!dueDate || completedAt) return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (milestone: Milestone) => {
    if (milestone.completedAt) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (isOverdue(milestone.dueDate, milestone.completedAt)) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (milestone.progress > 0) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  };

  const getStatusText = (milestone: Milestone) => {
    if (milestone.completedAt) return 'Completed';
    if (isOverdue(milestone.dueDate, milestone.completedAt)) return 'Overdue';
    if (milestone.progress > 0) return 'In Progress';
    return 'Not Started';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs font-medium mb-0.5">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs font-medium mb-0.5">Completed</p>
                <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              </div>
              <div className="bg-green-500/20 p-2 rounded-lg">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs font-medium mb-0.5">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs font-medium mb-0.5">Overdue</p>
                <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
              </div>
              <div className="bg-red-500/20 p-2 rounded-lg">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs font-medium mb-0.5">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-400">{stats.averageProgress}%</p>
              </div>
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px] w-[calc(100vw-16rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-8rem)] -mr-[calc(50vw-8rem)]">
        <div className="w-[350px] bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center">
              <span className="text-xl mr-2">🎯</span>
              <h3 className="text-lg font-bold text-white">Milestones</h3>
            </div>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              + New
            </button>
          </div>

          <div className="p-3 border-b border-white/10">
            <button
              onClick={handleShowAllTasks}
              className={`px-3 py-1.5 rounded-lg text-xs mr-2 transition-all w-full ${
                selectedMilestone === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              All Tasks
            </button>
          </div>

          {isCreating && (
            <div className="p-3 border-b border-white/10 bg-black/30">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all duration-300 text-sm"
                  placeholder="Milestone title"
                  required
                />
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all duration-300 resize-none text-sm"
                  placeholder="Description (optional)"
                />
                <input
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all duration-300 text-sm"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewMilestone({ title: '', description: '', dueDate: '' });
                    }}
                    className="px-3 py-1.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-all duration-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createMilestone}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-xs"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {milestones.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-zinc-800/50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-1">No Milestones Yet</h3>
                <p className="text-zinc-500 text-xs">Create your first milestone</p>
              </div>
            ) : (
              milestones.map((milestone) => (
                <div 
                  key={milestone.id}
                  className={`bg-black/30 rounded-lg p-3 border transition-all cursor-pointer ${
                    selectedMilestone?.id === milestone.id 
                      ? 'border-blue-500/50 bg-blue-500/10' 
                      : 'border-white/5 hover:border-white/20'
                  }`}
                  onClick={() => handleMilestoneSelect(milestone)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">{milestone.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(milestone)}`}>
                          {getStatusText(milestone)}
                        </span>
                      </div>
                      
                      {milestone.description && (
                        <p className="text-zinc-400 text-xs mb-2 line-clamp-1">{milestone.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-3 text-xs text-zinc-500">
                        <span>Due: {formatDate(milestone.dueDate)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMilestone(milestone);
                        }}
                        className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition-all duration-300"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMilestone(milestone.id);
                        }}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-all duration-300"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Progress</span>
                      <span className="text-white font-medium">{milestone.progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800/50 rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          milestone.completedAt 
                            ? 'bg-green-500' 
                            : isOverdue(milestone.dueDate, milestone.completedAt)
                              ? 'bg-red-500'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600'
                        }`}
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex-1 bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <div className="flex items-center">
                <span className="text-xl mr-2">📋</span>
                <h3 className="text-lg font-bold text-white">Task Board</h3>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                {selectedMilestone 
                  ? `Tasks for milestone: ${selectedMilestone.title}` 
                  : 'All project tasks'}
              </p>
            </div>
            <button
              onClick={handleCreateTask}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center space-x-1 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Task</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {loadingTasks ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <EnterpriseKanban
                tasks={selectedMilestone ? tasks : allTasks}
                onTaskMove={handleTaskMove}
                onTaskClick={handleTaskClick}
              />
            )}
          </div>
        </div>
      </div>

      {editingMilestone && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Edit Milestone</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editingMilestone.title}
                  onChange={(e) => setEditingMilestone({...editingMilestone, title: e.target.value})}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea
                  value={editingMilestone.description || ''}
                  onChange={(e) => setEditingMilestone({...editingMilestone, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all duration-300 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={editingMilestone.dueDate ? editingMilestone.dueDate.split('T')[0] : ''}
                    onChange={(e) => setEditingMilestone({...editingMilestone, dueDate: e.target.value})}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingMilestone.progress}
                    onChange={(e) => setEditingMilestone({...editingMilestone, progress: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setEditingMilestone(null)}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateMilestone(editingMilestone);
                    setEditingMilestone(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        milestones={milestones}
        selectedMilestone={selectedMilestone?.id || null}
      />

      <TaskManagementModal
        isOpen={isTaskModalOpen}
        task={selectedTask}
        onClose={() => {
          setSelectedTask(null);
          setIsTaskModalOpen(false);
        }}
        onTaskUpdated={handleTaskUpdated}
      />

    </div>
  );
} 
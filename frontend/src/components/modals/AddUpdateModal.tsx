'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Update {
  id: string;
  title: string;
  content: string;
  type: 'PROGRESS' | 'MILESTONE' | 'FEATURE' | 'BUGFIX' | 'ANNOUNCEMENT' | 'RELEASE';
  images?: string[] | null;
  createdAt: string;
}

interface AddUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCreated: () => void;
  projectId: string;
}

const UPDATE_TYPES: Update['type'][] = ['PROGRESS', 'MILESTONE', 'FEATURE', 'BUGFIX', 'ANNOUNCEMENT', 'RELEASE'];

export default function AddUpdateModal({ 
  isOpen, 
  onClose, 
  onUpdateCreated, 
  projectId 
}: AddUpdateModalProps) {
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    content: '',
    type: 'PROGRESS' as Update['type']
  });
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getTypeIcon = (type: Update['type']) => {
    switch (type) {
      case 'PROGRESS': return '📈';
      case 'MILESTONE': return '🎯';
      case 'FEATURE': return '✨';
      case 'BUGFIX': return '🐛';
      case 'ANNOUNCEMENT': return '📢';
      case 'RELEASE': return '🚀';
    }
  };

  const getTypeColor = (type: Update['type']) => {
    switch (type) {
      case 'PROGRESS': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'MILESTONE': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'FEATURE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'BUGFIX': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'ANNOUNCEMENT': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'RELEASE': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  const createUpdate = async () => {
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setIsCreating(true);
      const token = api.getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=updates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify(newUpdate),
        }
      );

      if (response.ok) {
        setNewUpdate({ title: '', content: '', type: 'PROGRESS' });
        showToast('Update created successfully!', 'success');
        onUpdateCreated();
        setTimeout(() => onClose(), 1000);
      } else {
        showToast('Failed to create update', 'error');
      }
    } catch (error) {
      console.error('Failed to create update:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setNewUpdate({ title: '', content: '', type: 'PROGRESS' });
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
          className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 rounded-2xl w-full max-w-6xl max-h-[98vh] flex flex-col shadow-2xl overflow-hidden"
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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📝</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Create New Update</h2>
                  <p className="text-zinc-400 text-sm">
                      Share your project&apos;s progress, milestones, features, and more.
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
                { id: 'content', label: 'Content', icon: '📝' },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
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
                  {activeTab === 'content' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-zinc-300 mb-2">Update Title *</label>
                        <input
                          type="text"
                          value={newUpdate.title}
                          onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-base font-medium"
                          placeholder="What's new in your project?"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-zinc-300 mb-2">Update Content *</label>
                        <textarea
                          value={newUpdate.content}
                          onChange={(e) => setNewUpdate(prev => ({ ...prev, content: e.target.value }))}
                          rows={12}
                          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                          placeholder="Describe what you've accomplished, what you're working on, or any important announcements..."
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">Advanced Settings</h4>
                        <p className="text-xs text-zinc-400">Additional settings for image attachments and advanced formatting will be available here in future updates.</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="w-80 border-l border-white/10 bg-black/20 backdrop-blur-sm overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Update Type</h3>

                  <div className="space-y-2 mb-6">
                    {UPDATE_TYPES.map((type) => (
                      <label 
                        key={type} 
                        className={`relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          newUpdate.type === type
                            ? `${getTypeColor(type)} ring-2 ring-blue-500/50`
                            : 'border-white/10 bg-black/20 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="updateType"
                          value={type}
                          checked={newUpdate.type === type}
                          onChange={(e) => setNewUpdate(prev => ({ ...prev, type: e.target.value as Update['type'] }))}
                          className="sr-only"
                        />
                        <span className="text-lg mr-3">{getTypeIcon(type)}</span>
                        <span className="text-sm font-medium text-white">
                          {type.replace('_', ' ')}
                        </span>
                        {newUpdate.type === type && (
                          <svg className="w-4 h-4 ml-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="p-4 bg-gradient-to-br from-zinc-800/50 to-black/50 border border-white/10 rounded-xl">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-2">
                      {getTypeIcon(newUpdate.type)} {newUpdate.type}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {newUpdate.type === 'PROGRESS' && 'Share development progress, work completed, or current status updates.'}
                      {newUpdate.type === 'MILESTONE' && 'Announce major milestones achieved or important project targets reached.'}
                      {newUpdate.type === 'FEATURE' && 'Introduce new features, capabilities, or enhancements to your project.'}
                      {newUpdate.type === 'BUGFIX' && 'Document bug fixes, issues resolved, or stability improvements.'}
                      {newUpdate.type === 'ANNOUNCEMENT' && 'Make important announcements, policy changes, or general communications.'}
                      {newUpdate.type === 'RELEASE' && 'Announce new releases, versions, or major deployments.'}
                    </p>
                  </div>

                  {(newUpdate.title || newUpdate.content) && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-zinc-300 mb-3">Preview</h4>
                      <div className="p-4 bg-black/30 border border-white/10 rounded-xl">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-8 h-8 rounded-lg ${getTypeColor(newUpdate.type)} flex items-center justify-center`}>
                            <span className="text-sm">{getTypeIcon(newUpdate.type)}</span>
                          </div>
                          <div>
                            <h5 className="text-white font-medium text-sm line-clamp-1">
                              {newUpdate.title || 'Update Title'}
                            </h5>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(newUpdate.type)}`}>
                              {newUpdate.type}
                            </span>
                          </div>
                        </div>
                        <p className="text-zinc-400 text-xs line-clamp-3">
                          {newUpdate.content || 'Update content will appear here...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 p-4 sm:p-6 bg-black/20 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 text-sm text-zinc-400">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${newUpdate.title.trim() ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span>Title</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${newUpdate.content.trim() ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span>Content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{newUpdate.type}</span>
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
                  onClick={createUpdate}
                  disabled={!newUpdate.title.trim() || !newUpdate.content.trim() || isCreating}
                  className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                >
                  {isCreating ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Publish Update'
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
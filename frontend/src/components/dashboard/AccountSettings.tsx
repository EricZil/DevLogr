'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

interface User {
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
}

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function AccountSettings({ isOpen, onClose, user }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
      });
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await api.updateProfile(formData);
      if (response.success) {
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(response.message || 'Failed to update profile', 'error');
      }
    } catch {
      showToast('An error occurred while updating profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'Delete') {
      showToast('Please type "Delete" to confirm', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await api.deleteAccount();
      if (response.success) {
        showToast('Account deleted successfully', 'success');
        window.location.href = '/';
      } else {
        showToast(response.message || 'Failed to delete account', 'error');
      }
    } catch {
      showToast('An error occurred while deleting account', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          
          <div className="flex items-center justify-between p-8 border-b border-white/10 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Account Settings
              </h2>
              <p className="text-gray-400 mt-2">Manage your profile and preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex">
            <div className="w-72 p-8 border-r border-white/10 bg-gradient-to-b from-gray-900/50 to-gray-800/50">
              <nav className="space-y-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-left transition-all duration-200 group ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform duration-200">{tab.icon}</span>
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 p-8">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Profile Information</h3>
                    <p className="text-gray-400 mb-8">Update your account details and public profile</p>
                    
                    {/* Profile Picture Section */}
                    <div className="flex items-center space-x-8 mb-10 p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/20 rounded-2xl">
                      <div className="relative">
                        <Image
                          src={user?.avatar || `https://www.gravatar.com/avatar/000000?d=mp&s=120`}
                          alt="Profile"
                          width={120}
                          height={120}
                          className="w-30 h-30 rounded-2xl border-2 border-blue-500/30 object-cover shadow-lg"
                          unoptimized
                        />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-900">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">Profile Photo</h4>
                        <p className="text-gray-400 mt-1">
                          Your profile picture is automatically synced from your social login provider.
                        </p>
                        <div className="flex items-center space-x-2 mt-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 text-sm font-medium">Synced from social provider</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-200 hover:border-gray-500/50"
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Username</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-200 hover:border-gray-500/50"
                          placeholder="Enter your username"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-200 hover:border-gray-500/50"
                          placeholder="Enter your email"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="e.g. San Francisco, CA"
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-200 hover:border-gray-500/50"
                        />
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Website</label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://your-website.com"
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-200 hover:border-gray-500/50"
                        />
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-200 resize-none hover:border-gray-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Security Settings</h3>
                    <p className="text-gray-400 mb-8">Manage your account security and data</p>
                    
                    <div className="p-8 bg-gradient-to-r from-red-500/10 via-red-600/10 to-red-500/10 border border-red-500/30 rounded-2xl">
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-red-400 mb-2">Delete Account</h4>
                          <p className="text-gray-300 mb-6">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Type <span className="text-red-400 font-bold">&quot;Delete&quot;</span> to confirm
                              </label>
                              <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type Delete here"
                                className="w-full max-w-md px-4 py-3 bg-gray-800/50 border border-red-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800/70 transition-all duration-200"
                              />
                            </div>
                            
                            <button
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmText !== 'Delete' || isDeleting}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center space-x-3"
                            >
                              {isDeleting ? (
                                <>
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span>Deleting Account...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete Account Permanently</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <p className="text-sm text-red-300">
                          <strong>Warning:</strong> This will permanently delete:
                        </p>
                        <ul className="text-sm text-gray-300 mt-2 space-y-1 list-disc list-inside">
                          <li>Your account and profile information</li>
                          <li>All your projects and their data</li>
                          <li>Project updates, milestones, and tasks</li>
                          <li>User feedback and issues</li>
                          <li>Custom domains and settings</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-8 border-t border-white/10 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
            <button
              onClick={onClose}
              className="px-8 py-3 text-gray-400 hover:text-white transition-colors font-semibold"
            >
              Cancel
            </button>
            
            {activeTab === 'profile' && (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 font-bold shadow-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-4 rounded-xl border backdrop-blur-sm ${
            toast.type === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {toast.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
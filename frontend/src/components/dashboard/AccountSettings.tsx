'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    weeklyDigest: false,
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        avatar: user.avatar || '',
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          
          <div className="flex items-center justify-between p-8 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">Account Settings</h2>
              <p className="text-zinc-400 mt-1">Manage your profile and preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex">
            <div className="w-64 p-6 border-r border-white/10">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 p-8">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
                    
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="relative">
                        <Image
                          src={formData.avatar || 'https://via.placeholder.com/120x120/374151/ffffff?text=Avatar'}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="w-24 h-24 rounded-2xl border border-white/20 object-cover"
                        />
                        <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Profile Photo</h4>
                        <p className="text-zinc-400 text-sm mt-1">JPG, PNG or GIF. Max size 5MB.</p>
                        <button className="text-blue-400 text-sm mt-2 hover:text-blue-300">
                          Upload new photo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="e.g. San Francisco, CA"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Website</label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://your-website.com"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-6">Security Settings</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">New Password</label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold">Two-Factor Authentication</h4>
                          <p className="text-zinc-400 text-sm mt-1">Add an extra layer of security to your account</p>
                        </div>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-6">Notification Preferences</h3>
                    
                    <div className="space-y-6">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser notifications' },
                        { key: 'projectUpdates', label: 'Project Updates', desc: 'Get notified about project changes' },
                        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your week in DevLogr' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                          <div>
                            <h4 className="text-white font-medium">{item.label}</h4>
                            <p className="text-zinc-400 text-sm">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData[item.key as keyof typeof formData] as boolean}
                              onChange={(e) => handleInputChange(item.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-6">Privacy Settings</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Profile Visibility</label>
                        <select
                          value={formData.profileVisibility}
                          onChange={(e) => handleInputChange('profileVisibility', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                        >
                          <option value="public" className="bg-black">Public</option>
                          <option value="private" className="bg-black">Private</option>
                          <option value="friends" className="bg-black">Friends Only</option>
                        </select>
                      </div>

                      {[
                        { key: 'showEmail', label: 'Show Email Address', desc: 'Display your email on public profile' },
                        { key: 'showLocation', label: 'Show Location', desc: 'Display your location on public profile' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                          <div>
                            <h4 className="text-white font-medium">{item.label}</h4>
                            <p className="text-zinc-400 text-sm">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData[item.key as keyof typeof formData] as boolean}
                              onChange={(e) => handleInputChange(item.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-8 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
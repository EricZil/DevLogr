'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Search,
  ChevronDown,
  Settings,
  LogOut,
  BarChart3
} from 'lucide-react';
import { User } from '@/lib/api';

interface DashboardHeaderProps {
  user: User | null;
  onLogout: () => void;
  onAccountSettings: () => void;
  onNewProject: () => void;
}

export default function DashboardHeader({ 
  user, 
  onLogout, 
  onAccountSettings, 
  onNewProject 
}: DashboardHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-black/60 via-zinc-900/60 to-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">DevLogr</h1>
              </div>
            </div>

            <nav className="hidden lg:flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl text-white font-medium hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-200">
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search projects, updates..."
                className="w-96 pl-12 pr-6 py-3 border border-white/10 rounded-2xl bg-zinc-900/50 backdrop-blur-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            <button
              onClick={onNewProject}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg shadow-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">New Project</span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-2xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                  </div>
                  {user?.avatar && (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-2xl object-cover border border-white/20"
                      unoptimized
                    />
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-gradient-to-br from-black/60 via-zinc-900/60 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-3">
                  <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex items-center space-x-4">
                      {user?.avatar && (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-2xl object-cover"
                          unoptimized
                        />
                      )}
                      <div>
                        <p className="text-base font-medium text-white">{user?.name}</p>
                        <p className="text-sm text-zinc-400">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-3">
                    <button
                      onClick={() => {
                        onAccountSettings();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      <span>Account Settings</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        onLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 
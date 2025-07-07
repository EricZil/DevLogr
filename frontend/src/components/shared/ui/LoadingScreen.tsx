import React from 'react';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export default function LoadingScreen({ title = 'Loading', subtitle }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center space-y-6">
        <div className="w-16 h-16 relative mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-spin" />
          <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin" />
        </div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        {subtitle && <p className="text-zinc-400">{subtitle}</p>}
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';

interface SocialOrbProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  color: string;
}

function SocialOrb({ icon, href, label, color }: SocialOrbProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={href}
      className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-125 ${color} border border-zinc-700/50 hover:border-white/20 shadow-lg hover:shadow-2xl`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={label}
    >
      <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-lg ${color}`} />
      
      <div className="relative z-10 text-white group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      
      <div 
        className={`absolute -top-12 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-zinc-700/50 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-zinc-700/50" />
      </div>
    </a>
  );
}

export default function SocialOrbs() {
  const socials = [
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
        </svg>
      ),
      href: '#',
      label: 'Twitter',
      color: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/40 hover:to-blue-600/40'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
        </svg>
      ),
      href: '#',
      label: 'GitHub',
      color: 'bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 hover:from-zinc-500/40 hover:to-zinc-600/40'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      href: '#',
      label: 'LinkedIn',
      color: 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 hover:from-blue-600/40 hover:to-blue-700/40'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.75 16.5l4.25-4.25 4.25 4.25L18.5 15l-5.5-5.5L7.5 15l.25 1.5zM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      ),
      href: '#',
      label: 'Discord',
      color: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/40 hover:to-purple-600/40'
    }
  ];

  return (
    <div className="flex justify-center space-x-6">
      {socials.map((social, index) => (
        <div
          key={index}
          className="animate-float-delayed"
          style={{ animationDelay: `${index * 0.2}s` }}
        >
          <SocialOrb {...social} />
        </div>
      ))}
    </div>
  );
} 
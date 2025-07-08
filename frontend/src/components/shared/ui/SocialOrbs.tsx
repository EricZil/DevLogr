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
      target="_blank"
      rel="noopener noreferrer"
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
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      href: 'https://github.com/EricZil/DevLogr',
      label: 'GitHub',
      color: 'bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 hover:from-zinc-500/40 hover:to-zinc-600/40'
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
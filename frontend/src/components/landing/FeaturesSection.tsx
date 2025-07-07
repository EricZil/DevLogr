'use client';

import { useState, useEffect } from 'react';

export default function FeaturesSection() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Public Project Pages",
      description: "Create beautiful, customizable pages for each of your projects with your own subdomain.",
      gradient: "from-purple-500 via-purple-600 to-blue-600",
      borderGradient: "from-purple-500/50 via-purple-400/30 to-blue-500/50",
      glowColor: "purple-500/30",
      stat: "∞ Projects"
    },
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Progress Tracking",
      description: "Log your development milestones, track issues, and visualize your progress over time.",
      gradient: "from-blue-500 via-blue-600 to-cyan-500",
      borderGradient: "from-blue-500/50 via-blue-400/30 to-cyan-500/50",
      glowColor: "blue-500/30",
      stat: "Real-time"
    },
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Feedback Forms",
      description: "Collect feedback from users and collaborators directly on your project pages.",
      gradient: "from-cyan-500 via-teal-500 to-emerald-500",
      borderGradient: "from-cyan-500/50 via-teal-400/30 to-emerald-500/50",
      glowColor: "cyan-500/30",
      stat: "Instant"
    },
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Task Management",
      description: "Organize your work with built-in task lists and project management tools.",
      gradient: "from-emerald-500 via-green-500 to-lime-500",
      borderGradient: "from-emerald-500/50 via-green-400/30 to-lime-500/50",
      glowColor: "emerald-500/30",
      stat: "Organized"
    },
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Issue Reporting",
      description: "Let users report issues and bugs directly, helping you improve your projects.",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      borderGradient: "from-pink-500/50 via-rose-400/30 to-red-500/50",
      glowColor: "pink-500/30",
      stat: "Zero Bugs"
    },
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Lightning Fast",
      description: "Built with modern technologies for blazing fast performance and great user experience.",
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      borderGradient: "from-yellow-500/50 via-orange-400/30 to-red-500/50",
      glowColor: "yellow-500/30",
      stat: "< 100ms"
    }
  ];

  return (
    <section id="features" className="relative py-20 px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Document Progress
            </span>
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Built specifically for developers who want to showcase their work and track their journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-5 group-hover:opacity-15 transition-all duration-700 blur-sm group-hover:blur-none`} />
              <div className={`absolute inset-0 bg-${feature.glowColor} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110`} />
              <div className={`relative bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:rotate-1 group-hover:border-transparent overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.borderGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[1px]`}>
                  <div className="w-full h-full bg-zinc-950/90 rounded-3xl" />
                </div>
                
                 {mounted && (
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                     {[...Array(6)].map((_, i) => (
                       <div
                         key={i}
                         className={`absolute w-1 h-1 bg-gradient-to-r ${feature.gradient} rounded-full animate-pulse`}
                         style={{
                           left: `${20 + (i * 15)}%`,
                           top: `${10 + (i * 12)}%`,
                           animationDelay: `${i * 0.3}s`,
                           animationDuration: `${2 + (i * 0.5)}s`,
                         }}
                       />
                     ))}
                   </div>
                 )}
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.stat}
                  </div>
                  <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-2xl`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                    <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping" />
                    <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-ping" style={{ animationDelay: '0.5s' }} />
                  </div>
                                     <h3 className={`text-2xl font-bold mb-4 text-white transition-all duration-500 ${hoveredCard === index ? 'bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent' : ''}`}>
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 group-hover:text-zinc-200 transition-colors duration-500 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-6 flex items-center text-zinc-500 group-hover:text-white transition-colors duration-300">
                    <span className="text-sm font-medium mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">Learn More</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-bl-3xl opacity-5 group-hover:opacity-20 transition-opacity duration-500`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
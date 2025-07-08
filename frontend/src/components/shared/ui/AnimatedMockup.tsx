'use client';

import { useState, useEffect } from 'react';

export default function AnimatedMockup() {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const projectSteps = [
    { title: "Project Setup", progress: 100, status: "COMPLETED", date: "3 days ago" },
    { title: "Core Development", progress: 85, status: "IN_PROGRESS", date: "In progress" },
    { title: "Feature Implementation", progress: 60, status: "IN_PROGRESS", date: "Active" },
    { title: "Testing & QA", progress: 25, status: "TODO", date: "Upcoming" },
    { title: "Production Release", progress: 0, status: "TODO", date: "Next week" }
  ];

  const tabs = [
    { name: 'Overview', icon: '📊' },
    { name: 'Milestones', icon: '🎯' },
    { name: 'Updates', icon: '📝' },
    { name: 'Issues', icon: '🐛' },
    { name: 'Feedback', icon: '💬' }
  ];

  const milestonesData = [
    { 
      title: 'Backend Infrastructure', 
      description: 'API development and database setup', 
      status: 'COMPLETED', 
      date: '5 days ago', 
      progress: 100,
      tasks: ['Authentication system', 'Project CRUD operations', 'Database schema']
    },
    { 
      title: 'Frontend Dashboard', 
      description: 'User interface and project management', 
      status: 'IN_PROGRESS', 
      date: 'Active', 
      progress: 90,
      tasks: ['Project creation flow', 'Settings page', 'Responsive design']
    },
    { 
      title: 'Public Pages', 
      description: 'Public project showcase pages', 
      status: 'IN_PROGRESS', 
      date: 'Active', 
      progress: 75,
      tasks: ['Project public view', 'Issue reporting', 'Feedback system']
    },
    { 
      title: 'Beta Release', 
      description: 'Production deployment and testing', 
      status: 'TODO', 
      date: 'This week', 
      progress: 30,
      tasks: ['Domain setup', 'SSL configuration', 'Performance optimization']
    }
  ];

  const updatesData = [
    { 
      title: 'Dashboard UI Improvements', 
      content: 'Enhanced the project dashboard with better navigation, responsive design, and real-time status updates. Added comprehensive project management features.',
      date: '4 hours ago',
      type: 'feature',
      author: 'DevLogr Team'
    },
    { 
      title: 'Authentication System Complete', 
      content: 'Implemented secure OAuth authentication with Google. Users can now sign in safely and manage their projects with proper authorization.',
      date: '1 day ago',
      type: 'feature',
      author: 'DevLogr Team'
    },
    { 
      title: 'Public Project Pages', 
      content: 'Launched public project showcase pages where users can share their development journey. Each project gets its own subdomain.',
      date: '2 days ago',
      type: 'feature',
      author: 'DevLogr Team'
    },
    { 
      title: 'Performance Optimizations', 
      content: 'Improved page load times by 60% through code splitting, image optimization, and efficient data fetching strategies.',
      date: '3 days ago',
      type: 'improvement',
      author: 'DevLogr Team'
    }
  ];

  const issuesData = [
    {
      title: 'Mobile responsiveness issues on project settings',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      date: '2 hours ago',
      reporter: 'Beta Tester'
    },
    {
      title: 'Custom domain verification taking too long',
      status: 'OPEN',
      priority: 'MEDIUM',
      date: '5 hours ago',
      reporter: 'User Feedback'
    }
  ];

  const feedbackData = [
    {
      message: 'Love the clean interface! The project dashboard is intuitive and makes tracking progress really easy.',
      rating: 5,
      author: 'Sarah M.',
      date: '1 hour ago'
    },
    {
      message: 'Great concept! Would love to see GitHub integration for automatic updates.',
      rating: 4,
      author: 'Alex K.',
      date: '3 hours ago'
    }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % projectSteps.length);
      setProgress(prev => {
        const newProgress = Math.min(prev + 3, 100);
        return newProgress === 100 ? 0 : newProgress;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [mounted, projectSteps.length]);

  if (!mounted) {
    return (
      <div className="relative max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-700/50 p-8 shadow-2xl">
          <div className="bg-black/90 backdrop-blur-sm rounded-2xl border border-zinc-800/70 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-sm text-zinc-400 font-mono">devlogr.devlogr.space</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto">
      <div className="absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      
      <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/70 to-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-700/50 p-4 lg:p-6 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg hover:scale-125 transition-transform cursor-pointer"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg hover:scale-125 transition-transform cursor-pointer"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg hover:scale-125 transition-transform cursor-pointer"></div>
          </div>
          <div className="flex-1 mx-6">
            <div className="bg-zinc-800/50 rounded-lg px-4 py-1 border border-zinc-700/50">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-zinc-400 font-mono text-sm">devlogr.devlogr.space</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-zinc-700 rounded flex items-center justify-center hover:bg-zinc-600 transition-colors cursor-pointer">
              <svg className="w-3 h-3 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 9.5H17a1 1 0 110 2h-5.586l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="w-6 h-6 bg-zinc-700 rounded flex items-center justify-center hover:bg-zinc-600 transition-colors cursor-pointer">
              <svg className="w-3 h-3 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-2xl border border-zinc-700/70 overflow-hidden shadow-inner">
           
          <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border-b border-zinc-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🚀
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">DevLogr Platform</h1>
                  <p className="text-sm text-zinc-400">Building the future of project showcasing</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full text-sm font-medium">
                  In Development
                </span>
                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-sm font-medium">
                  75% Complete
                </span>
              </div>
            </div>
          </div>
           
          <div className="border-b border-zinc-700 bg-zinc-800/50">
            <div className="flex">
              {tabs.map((tab, index) => (
                <div
                  key={index}
                  className={`px-6 py-3 text-sm font-medium border-r border-zinc-700 cursor-pointer transition-all duration-200 ${
                    index === activeTab 
                      ? 'bg-zinc-900 text-blue-400 border-b-2 border-blue-400 shadow-sm' 
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                  }`}
                  onClick={() => setActiveTab(index)}
                >
                  <span className="flex items-center space-x-2">
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                    {index === activeTab && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 lg:p-6 min-h-[300px] lg:min-h-[350px] bg-gradient-to-br from-zinc-900 to-zinc-800/30">

            {activeTab === 0 && (
              <div>
                <div className="mb-4 lg:mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm lg:text-base font-semibold text-white">Overall Progress</h3>
                    <span className="text-xs lg:text-sm text-zinc-400">75%</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2 lg:h-2.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${75 + progress / 4}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">12</div>
                    <div className="text-xs text-zinc-400">Updates</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400">4</div>
                    <div className="text-xs text-zinc-400">Milestones</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">8</div>
                    <div className="text-xs text-zinc-400">Features</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-400">2</div>
                    <div className="text-xs text-zinc-400">Issues</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm lg:text-base font-semibold text-white mb-3">Recent Activity</h3>
                  {projectSteps.slice(0, 3).map((step, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-2 lg:p-3 rounded-lg border transition-all duration-500 ${
                        index === currentStep 
                          ? 'border-blue-500/50 bg-blue-900/20 shadow-lg shadow-blue-500/10 scale-105' 
                          : 'border-zinc-700 bg-zinc-800/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
                        <div className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full flex-shrink-0 ${
                          step.status === 'COMPLETED' 
                            ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                            : step.status === 'IN_PROGRESS' 
                            ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/30' 
                            : 'bg-zinc-600'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-white text-sm lg:text-base truncate">{step.title}</h4>
                          <p className="text-xs lg:text-sm text-zinc-400">{step.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
                        <div className="w-12 lg:w-16 bg-zinc-700 rounded-full h-1.5 lg:h-2">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              step.status === 'COMPLETED' 
                                ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                                : step.status === 'IN_PROGRESS' 
                                ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
                                : 'bg-zinc-600'
                            }`}
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                        <span className="text-xs lg:text-sm font-medium text-zinc-300 w-8 lg:w-10 text-right">
                          {step.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-4">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Project Milestones</h3>
                {milestonesData.map((milestone, index) => (
                  <div key={index} className="border border-zinc-700 bg-zinc-800/30 rounded-xl p-4 hover:border-zinc-600 transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            milestone.status === 'COMPLETED' 
                              ? 'bg-green-500' 
                              : milestone.status === 'IN_PROGRESS' 
                              ? 'bg-blue-500 animate-pulse' 
                              : 'bg-zinc-600'
                          }`} />
                          <h4 className="font-semibold text-white">{milestone.title}</h4>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3">{milestone.description}</p>
                        <div className="space-y-1">
                          {milestone.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="flex items-center space-x-2 text-xs text-zinc-500">
                              <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-400 mb-2">{milestone.date}</div>
                        <div className="text-sm font-medium text-white">{milestone.progress}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          milestone.status === 'COMPLETED' 
                            ? 'bg-green-500' 
                            : milestone.status === 'IN_PROGRESS' 
                            ? 'bg-blue-500' 
                            : 'bg-zinc-600'
                        }`}
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-4">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Latest Updates</h3>
                {updatesData.map((update, index) => (
                  <div key={index} className="border border-zinc-700 bg-zinc-800/30 rounded-xl p-4 hover:border-zinc-600 transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        update.type === 'feature' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        update.type === 'improvement' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        update.type === 'fix' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {update.type === 'feature' ? '✨' : 
                         update.type === 'improvement' ? '⚡' : 
                         update.type === 'fix' ? '🔧' : '🎨'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{update.title}</h4>
                          <span className="text-xs text-zinc-500">{update.date}</span>
                        </div>
                        <p className="text-sm text-zinc-300 mb-2">{update.content}</p>
                        <div className="text-xs text-zinc-500">by {update.author}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-4">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Open Issues</h3>
                {issuesData.map((issue, index) => (
                  <div key={index} className="border border-zinc-700 bg-zinc-800/30 rounded-xl p-4 hover:border-zinc-600 transition-all duration-300">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white flex-1">{issue.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.priority === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          issue.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {issue.priority}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Reported by {issue.reporter}</span>
                      <span>{issue.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 4 && (
              <div className="space-y-4">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-4">User Feedback</h3>
                {feedbackData.map((feedback, index) => (
                  <div key={index} className="border border-zinc-700 bg-zinc-800/30 rounded-xl p-4 hover:border-zinc-600 transition-all duration-300">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400' : 'text-zinc-600'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-white">{feedback.author}</span>
                      </div>
                      <span className="text-xs text-zinc-500">{feedback.date}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{feedback.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <a 
          href="https://devlogr.devlogr.space/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full font-semibold text-sm lg:text-base hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2"
        >
          <span>🚀 View Live Progress</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
} 
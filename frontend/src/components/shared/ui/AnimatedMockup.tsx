'use client';

import { useState, useEffect } from 'react';

export default function AnimatedMockup() {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const projectSteps = [
    { title: "Project Setup", progress: 100, status: "completed", date: "2 days ago" },
    { title: "UI Design", progress: 100, status: "completed", date: "1 day ago" },
    { title: "Backend API", progress: 75, status: "in-progress", date: "Today" },
    { title: "User Testing", progress: 0, status: "pending", date: "Tomorrow" },
    { title: "Launch Prep", progress: 0, status: "pending", date: "Next week" }
  ];

  const tabs = [
    { name: 'Overview' },
    { name: 'Milestones' },
    { name: 'Updates' }
  ];

  const milestonesData = [
    { 
      title: 'Project Planning', 
      description: 'Define scope and architecture', 
      status: 'completed', 
      date: '3 days ago', 
      progress: 100,
      tasks: ['Requirements gathering', 'Tech stack selection', 'Architecture design']
    },
    { 
      title: 'Core Development', 
      description: 'Build main functionality', 
      status: 'in-progress', 
      date: 'In progress', 
      progress: 80,
      tasks: ['API development', 'Database setup', 'Authentication system']
    },
    { 
      title: 'Testing Phase', 
      description: 'Unit and integration tests', 
      status: 'pending', 
      date: 'Next week', 
      progress: 0,
      tasks: ['Unit tests', 'Integration tests', 'Performance testing']
    },
    { 
      title: 'Documentation', 
      description: 'API docs and user guides', 
      status: 'pending', 
      date: 'Next month', 
      progress: 0,
      tasks: ['API documentation', 'User guides', 'Deployment docs']
    }
  ];

  const updatesData = [
    { 
      title: 'Major Progress Update', 
      content: 'Successfully implemented the core chat functionality with real-time messaging capabilities. Users can now engage in natural conversations.',
      date: '2 hours ago',
      type: 'feature',
      author: 'Alex Chen'
    },
    { 
      title: 'API Integration Complete', 
      content: 'Integrated with OpenAI API for natural language processing. Response times improved by 40% with new caching system.',
      date: '1 day ago',
      type: 'improvement',
      author: 'Alex Chen'
    },
    { 
      title: 'Bug Fix Release', 
      content: 'Fixed critical issue with user authentication flow. All tests now passing successfully.',
      date: '2 days ago',
      type: 'fix',
      author: 'Alex Chen'
    },
    { 
      title: 'UI/UX Enhancements', 
      content: 'Redesigned chat interface with better accessibility and mobile responsiveness. Added dark mode support.',
      date: '3 days ago',
      type: 'design',
      author: 'Alex Chen'
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
        const newProgress = Math.min(prev + 5, 100);
        return newProgress === 100 ? 0 : newProgress;
      });
    }, 2000);

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
            <div className="text-sm text-zinc-400 font-mono">myproject.devlogr.com</div>
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
                <span className="text-zinc-400 font-mono text-sm">myproject.devlogr.com</span>
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
             <div className="mb-4 lg:mb-6">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 lg:mb-3 space-y-2 sm:space-y-0">
                 <h1 className="text-lg lg:text-xl font-bold text-white">AI Chat Bot Project</h1>
                 <div className="flex items-center space-x-2 flex-wrap">
                   <div className="px-2 lg:px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs lg:text-sm font-medium border border-blue-500/30">
                     In Development
                   </div>
                   <div className="px-2 lg:px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs lg:text-sm font-medium border border-green-500/30">
                     67% Complete
                   </div>
                 </div>
               </div>
               <p className="text-sm lg:text-base text-zinc-300">Building a revolutionary AI assistant with natural language processing</p>
             </div>

             {activeTab === 0 && (
               <div>
                 <div className="mb-4 lg:mb-6">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="text-sm lg:text-base font-semibold text-white">Overall Progress</h3>
                     <span className="text-xs lg:text-sm text-zinc-400">67%</span>
                   </div>
                   <div className="w-full bg-zinc-700 rounded-full h-2 lg:h-2.5 overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                       style={{ width: `${progress + 67}%` }}
                     />
                   </div>
                 </div>

                 <div className="space-y-2 lg:space-y-3">
                   <h3 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Project Milestones</h3>
                   {projectSteps.map((step, index) => (
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
                           step.status === 'completed' 
                             ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                             : step.status === 'in-progress' 
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
                               step.status === 'completed' 
                                 ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                                 : step.status === 'in-progress' 
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

                 <div className="mt-4 lg:mt-6 p-2 lg:p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                   <h4 className="font-medium text-white mb-1 lg:mb-2 text-xs lg:text-sm">Recent Activity</h4>
                   <div className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm text-zinc-300">
                     <div className="flex items-center space-x-2">
                       <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                       <span className="flex-1 truncate">Completed API authentication system</span>
                       <span className="text-zinc-500 text-xs hidden sm:inline">• 2 hours ago</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
                       <span className="flex-1 truncate">Started working on user interface</span>
                       <span className="text-zinc-500 text-xs hidden sm:inline">• 5 hours ago</span>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {activeTab === 1 && (
               <div className="space-y-4">
                 <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Detailed Milestones</h3>
                 {milestonesData.map((milestone, index) => (
                   <div key={index} className="border border-zinc-700 bg-zinc-800/30 rounded-xl p-4 hover:border-zinc-600 transition-all duration-300">
                     <div className="flex items-start justify-between mb-3">
                       <div className="flex-1">
                         <div className="flex items-center space-x-3 mb-2">
                           <div className={`w-3 h-3 rounded-full ${
                             milestone.status === 'completed' 
                               ? 'bg-green-500' 
                               : milestone.status === 'in-progress' 
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
                           milestone.status === 'completed' 
                             ? 'bg-green-500' 
                             : milestone.status === 'in-progress' 
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
                 <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Project Updates</h3>
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
           </div>
         </div>
      </div>

       <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
         <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full font-semibold text-sm lg:text-base hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2">
           <span>🎯 Create Your DevLog</span>
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
           </svg>
         </button>
       </div>
    </div>
  );
} 
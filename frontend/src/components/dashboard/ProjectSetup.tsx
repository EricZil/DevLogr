'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface ProjectSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (projectData: Project) => void;
}

interface ProjectData {
  name: string;
  description: string;
  subdomain: string;
  hostingType: 'subdomain' | 'custom';
  customDomain?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  tags: string[];
  icon?: string;
  color?: string;
  githubUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  allowIssues: boolean;
  allowFeedback: boolean;
}

interface Project {
  id: string;
  name: string;
  title: string;
  description: string | null;
  slug: string;
  visibility: string;
  status: string;
  progress: number;
  icon: string | null;
  color: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  allowIssues: boolean;
  allowFeedback: boolean;
  createdAt: string;
  updatedAt: string;
  lastUpdate: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
  _count: {
    updates: number;
    milestones: number;
    issues: number;
    feedback: number;
  };
}

export default function ProjectSetup({ isOpen, onClose, onComplete }: ProjectSetupProps) {
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    subdomain: '',
    hostingType: 'subdomain',
    visibility: 'PUBLIC',
    tags: [],
    allowIssues: true,
    allowFeedback: true
  });
  const [isSubdomainChecking, setIsSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const totalSteps = 5;

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) return;
    
    setIsSubdomainChecking(true);
    try {
      const response = await api.checkSlugAvailability(subdomain);
      
      if (response.success && response.data) {
        setSubdomainAvailable(response.data.available);
      } else {
        console.error('Error checking slug availability:', response.message);
        setSubdomainAvailable(false);
      }
    } catch (error) {
      console.error('Error checking slug availability:', error);
      setSubdomainAvailable(false);
    } finally {
      setIsSubdomainChecking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const debouncedCheckSubdomain = useCallback((subdomain: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setSubdomainAvailable(null);
    setIsSubdomainChecking(false);

    if (!subdomain || subdomain.length < 3) return;

    const timer = setTimeout(() => {
      checkSubdomainAvailability(subdomain);
    }, 500);

    setDebounceTimer(timer);
  }, [debounceTimer]);

  if (!isOpen) return null;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await createProject();
    }
  };

  const createProject = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await api.createProject({
        name: projectData.name,
        description: projectData.description,
        visibility: projectData.visibility,
        tags: projectData.tags,
        allowIssues: projectData.allowIssues,
        allowFeedback: projectData.allowFeedback,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || `Failed to create project`);
      }

      onComplete(response.data as Project);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  };

  const updateProjectName = (name: string) => {
    setProjectData(prev => ({
      ...prev,
      name,
      subdomain: generateSubdomain(name)
    }));
    
    if (name) {
      debouncedCheckSubdomain(generateSubdomain(name));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Let&apos;s start your project</h3>
              <p className="text-zinc-400">Tell us about what you&apos;re building</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => updateProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Description
                </label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what you're building and your goals..."
                  rows={4}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setProjectData(prev => ({ ...prev, visibility: 'PUBLIC' }))}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      projectData.visibility === 'PUBLIC'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-100'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Public</div>
                        <div className="text-xs opacity-70">Anyone can view</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setProjectData(prev => ({ ...prev, visibility: 'PRIVATE' }))}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      projectData.visibility === 'PRIVATE'
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-100'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Private</div>
                        <div className="text-xs opacity-70">Only you can view</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Development Environment</h3>
              <p className="text-zinc-400">Your project will be accessible locally during development</p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500/20 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-blue-100 mb-3">Local Development Setup</h4>
                    <p className="text-blue-200/70 mb-4">
                      During development, your project will be accessible at a local URL. In production, this will become a subdomain or custom domain.
                    </p>
                    
                    {projectData.name && (
                      <div className="bg-black/30 rounded-lg p-4 border border-blue-500/30">
                        <div className="mb-2">
                          <span className="text-sm text-blue-200/70">Your project will be available at:</span>
                        </div>
                        <code className="text-blue-300 font-mono text-sm bg-blue-500/20 px-3 py-2 rounded border border-blue-500/30 inline-block">
                          /projects/{projectData.subdomain || 'your-project'}
                          </code>
                        <div className="mt-3 text-xs text-blue-200/60">
                          • Clean, SEO-friendly URLs<br/>
                          • Fast local development<br/>
                          • Easy to test and iterate
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                  </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  <div>
                    <h5 className="text-amber-100 font-semibold text-sm mb-1">Production Ready</h5>
                    <p className="text-amber-200/70 text-sm">
                      When you&apos;re ready to go live, we&apos;ll automatically set up subdomains and custom domain support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Customize your subdomain</h3>
              <p className="text-zinc-400">Fine-tune your project&apos;s web address</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Subdomain *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={projectData.subdomain}
                    onChange={(e) => {
                      const subdomain = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setProjectData(prev => ({ ...prev, subdomain }));
                      if (subdomain) {
                        debouncedCheckSubdomain(subdomain);
                      }
                    }}
                    placeholder="my-project"
                    className="w-full pl-4 pr-32 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-zinc-400 text-sm">.devlogr.com</span>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    {isSubdomainChecking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-zinc-400">Checking availability...</span>
                      </>
                    ) : subdomainAvailable === true ? (
                      <>
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-emerald-400">Available!</span>
                      </>
                    ) : subdomainAvailable === false ? (
                      <>
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-red-400">Not available</span>
                      </>
                    ) : null}
                  </div>
                  
                  <div className="text-xs text-zinc-500">
                    • Only lowercase letters, numbers, and hyphens allowed<br/>
                    • Must be 3-30 characters long<br/>
                    • Cannot start or end with a hyphen
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-blue-100 font-semibold mb-2">Your project will be live at:</h4>
                    <code className="text-blue-300 font-mono text-lg bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30 inline-block">
                      {projectData.subdomain || 'your-project'}.devlogr.com
                    </code>
                    <p className="text-blue-200/70 text-sm mt-3">
                      Anyone can visit this URL to see your project updates and progress. You can change this later in your project settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Technology Stack & Features</h3>
              <p className="text-zinc-400">Choose your tech stack and configure project features</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Technology Stack
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js',
                    'Node.js', 'Python', 'Java', 'Go', 'Rust', 'PHP',
                    'TypeScript', 'JavaScript', 'C#', 'C++', 'Swift', 'Kotlin',
                    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase',
                    'Tailwind CSS', 'Bootstrap', 'Material UI', 'Chakra UI', 'Styled Components', 'SCSS'
                  ].map((tech) => (
                    <button
                      key={tech}
                      onClick={() => {
                        const newTags = projectData.tags.includes(tech) 
                          ? projectData.tags.filter(t => t !== tech)
                          : [...projectData.tags, tech];
                        setProjectData(prev => ({ ...prev, tags: newTags }));
                      }}
                      className={`p-3 rounded-lg border text-sm transition-all duration-300 ${
                        projectData.tags.includes(tech)
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-100'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Select the technologies you&apos;re using (you can change these later)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Project Icon (Optional)
                </label>
                <div className="grid grid-cols-8 gap-3 mb-3">
                  {['🚀', '💡', '🎯', '⚡', '🔥', '✨', '🎨', '🛠️', '📱', '💻', '🌟', '🎪', '🎵', '🎮', '📊', '🔬'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setProjectData(prev => ({ ...prev, icon: emoji }))}
                      className={`p-3 rounded-lg border text-2xl transition-all duration-300 ${
                        projectData.icon === emoji
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={projectData.icon || ''}
                  onChange={(e) => setProjectData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Or enter custom emoji/icon"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    GitHub Repository (Optional)
                  </label>
                  <input
                    type="url"
                    value={projectData.githubUrl || ''}
                    onChange={(e) => setProjectData(prev => ({ ...prev, githubUrl: e.target.value }))}
                    placeholder="https://github.com/username/repo"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Twitter/X (Optional)
                  </label>
                  <input
                    type="url"
                    value={projectData.twitterUrl || ''}
                    onChange={(e) => setProjectData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                    placeholder="https://twitter.com/username"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Community Features
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projectData.allowIssues}
                      onChange={(e) => setProjectData(prev => ({ ...prev, allowIssues: e.target.checked }))}
                      className="w-5 h-5 text-blue-500 bg-white/10 border border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div>
                      <span className="text-white font-medium">Enable Issue Reporting</span>
                      <p className="text-zinc-400 text-sm">Allow visitors to report bugs and issues</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projectData.allowFeedback}
                      onChange={(e) => setProjectData(prev => ({ ...prev, allowFeedback: e.target.checked }))}
                      className="w-5 h-5 text-blue-500 bg-white/10 border border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div>
                      <span className="text-white font-medium">Enable Feedback Collection</span>
                      <p className="text-zinc-400 text-sm">Allow visitors to leave feedback and suggestions</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Review & Create</h3>
              <p className="text-zinc-400">Double-check your project details</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Project Summary</span>
                </h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-zinc-400">Project Name</span>
                      <p className="text-white font-semibold">{projectData.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-zinc-400">Visibility</span>
                      <div className="flex items-center space-x-2">
                        {projectData.visibility === 'PUBLIC' ? (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        <span className="text-white">{projectData.visibility}</span>
                      </div>
                    </div>
                  </div>
                  
                  {projectData.description && (
                    <div>
                      <span className="text-sm text-zinc-400">Description</span>
                      <p className="text-white">{projectData.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-blue-100 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Development Access</span>
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-blue-200/70">Your project will be accessible at:</span>
                    <div className="mt-2">
                      <code className="text-blue-300 font-mono text-lg bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30 inline-block">
                        /projects/{projectData.subdomain}
                      </code>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-blue-200">Fast local development</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-blue-200">SEO-friendly URLs</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-blue-200">Production deployment ready</span>
                  </div>
                </div>
              </div>

              {(projectData.tags.length > 0 || projectData.icon || projectData.githubUrl || projectData.twitterUrl) && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-purple-100 mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span>Additional Configuration</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {projectData.icon && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-purple-200">Project Icon:</span>
                        <span className="text-2xl">{projectData.icon}</span>
                      </div>
                    )}
                    
                    {projectData.tags.length > 0 && (
                      <div>
                        <span className="text-sm text-purple-200">Tech Stack:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {projectData.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-purple-500/20 text-purple-200 text-xs rounded border border-purple-500/30">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <svg className={`w-4 h-4 ${projectData.allowIssues ? 'text-emerald-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={projectData.allowIssues ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span className="text-purple-200">Issue Reporting</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className={`w-4 h-4 ${projectData.allowFeedback ? 'text-emerald-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={projectData.allowFeedback ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span className="text-purple-200">Feedback Collection</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-emerald-100 mb-3 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>What happens next?</span>
                </h4>
                
                <ul className="space-y-2 text-emerald-200 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    <span>Your project will be created instantly</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    <span>Your subdomain will be activated immediately</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    <span>You can start logging your first update right away</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return projectData.name.trim().length > 0;
      case 2:
        return true;
      case 3:
        return projectData.subdomain.length >= 3 && subdomainAvailable === true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Create New Project</h2>
              <p className="text-sm text-zinc-400">Step {step} of {totalSteps}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-red-100 font-semibold">Error Creating Project</h4>
                  <p className="text-red-200/70 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {renderStep()}
        </div>

        <div className="sticky bottom-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-3 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed() || isCreating}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCreating && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              <span>
                {step === totalSteps ? (isCreating ? 'Creating...' : 'Create Project') : 'Continue'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
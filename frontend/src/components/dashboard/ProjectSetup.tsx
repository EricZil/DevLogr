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
  slug: string;
  domainType: 'subdomain' | 'custom';
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
  title: string;
  slug: string;
  status: string;
  visibility: string;
}

export default function ProjectSetup({ isOpen, onClose, onComplete }: ProjectSetupProps) {
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    slug: '',
    domainType: 'subdomain',
    visibility: 'PUBLIC',
    tags: [],
    allowIssues: true,
    allowFeedback: true
  });
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isDomainChecking, setIsDomainChecking] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const totalSteps = 5;

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) return;
    
    setIsSlugChecking(true);
    try {
      const response = await api.checkSlugAvailability(slug);
      
      if (response.success && response.data) {
        setSlugAvailable(response.data.available);
      } else {
        console.error('Error checking slug availability:', response.message);
        setSlugAvailable(false);
      }
    } catch (error) {
      console.error('Error checking slug availability:', error);
      setSlugAvailable(false);
    } finally {
      setIsSlugChecking(false);
    }
  };

  const checkCustomDomain = async (domain: string) => {
    if (!domain || !isValidDomain(domain)) return;
    
    setIsDomainChecking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDomainAvailable(true);
    } catch (error) {
      console.error('Error checking domain availability:', error);
      setDomainAvailable(false);
    } finally {
      setIsDomainChecking(false);
    }
  };

  const isValidDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/;
    return domainRegex.test(domain);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const debouncedCheckSlug = useCallback((slug: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setSlugAvailable(null);
    setIsSlugChecking(false);

    if (!slug || slug.length < 3) return;

    const timer = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 500);

    setDebounceTimer(timer);
  }, [debounceTimer]);

  const debouncedCheckDomain = useCallback((domain: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setDomainAvailable(null);
    setIsDomainChecking(false);

    if (!domain || !isValidDomain(domain)) return;

    const timer = setTimeout(() => {
      checkCustomDomain(domain);
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
        customDomain: projectData.domainType === 'custom' ? projectData.customDomain : undefined,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || `Failed to create project`);
      }

      onComplete(response.data as unknown as Project);
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  };

  const updateProjectName = (name: string) => {
    const newSlug = generateSlug(name);
    setProjectData(prev => ({
      ...prev,
      name,
      slug: newSlug
    }));
    
    if (name && projectData.domainType === 'subdomain') {
      debouncedCheckSlug(newSlug);
    }
  };

  const updateSlug = (slug: string) => {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setProjectData(prev => ({ ...prev, slug: cleanSlug }));
    
    if (cleanSlug && projectData.domainType === 'subdomain') {
      debouncedCheckSlug(cleanSlug);
    }
  };

  const updateCustomDomain = (domain: string) => {
    setProjectData(prev => ({ ...prev, customDomain: domain }));
    
    if (domain) {
      debouncedCheckDomain(domain);
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
              <h3 className="text-2xl font-bold text-white mb-2">Choose your domain</h3>
              <p className="text-zinc-400">How do you want visitors to access your project?</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setProjectData(prev => ({ ...prev, domainType: 'subdomain' }));
                  if (projectData.slug) {
                    debouncedCheckSlug(projectData.slug);
                  }
                }}
                className={`w-full p-6 rounded-xl border transition-all duration-300 text-left ${
                  projectData.domainType === 'subdomain'
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    projectData.domainType === 'subdomain' ? 'bg-blue-500/20' : 'bg-white/10'
                  }`}>
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">DevLogr Subdomain</h4>
                    <p className="text-zinc-300 mb-3">
                      Get a free subdomain on our network with instant setup and SSL
                    </p>
                    
                    {projectData.slug && (
                      <div className="bg-black/30 rounded-lg p-3 border border-blue-500/30">
                        <code className="text-blue-300 font-mono text-sm">
                          {projectData.slug}.devlogr.space
                        </code>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-3 text-sm">
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Free SSL</span>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Instant Setup</span>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <span>Global CDN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setProjectData(prev => ({ ...prev, domainType: 'custom' }));
                  if (projectData.customDomain) {
                    debouncedCheckDomain(projectData.customDomain);
                  }
                }}
                className={`w-full p-6 rounded-xl border transition-all duration-300 text-left ${
                  projectData.domainType === 'custom'
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    projectData.domainType === 'custom' ? 'bg-purple-500/20' : 'bg-white/10'
                  }`}>
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">Custom Domain</h4>
                    <p className="text-zinc-300 mb-3">
                      Use your own domain for professional branding
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-amber-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Requires DNS setup</span>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Auto SSL</span>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span>Professional</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {projectData.domainType === 'subdomain' ? 'Configure your subdomain' : 'Configure your custom domain'}
              </h3>
              <p className="text-zinc-400">
                {projectData.domainType === 'subdomain' 
                  ? 'Choose your project\'s web address' 
                  : 'Set up your custom domain'}
              </p>
            </div>

            {projectData.domainType === 'subdomain' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Subdomain *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={projectData.slug}
                      onChange={(e) => updateSlug(e.target.value)}
                      placeholder="my-project"
                      className="w-full pl-4 pr-40 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <span className="text-zinc-400 text-sm">.devlogr.space</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      {isSlugChecking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                          <span className="text-zinc-400">Checking availability...</span>
                        </>
                      ) : slugAvailable === true ? (
                        <>
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-emerald-400">Available!</span>
                        </>
                      ) : slugAvailable === false ? (
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
                        {projectData.slug || 'your-project'}.devlogr.space
                      </code>
                      <p className="text-blue-200/70 text-sm mt-3">
                        Anyone can visit this URL to see your project updates and progress. You can change this later in your project settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Your Domain *
                  </label>
                  <input
                    type="text"
                    value={projectData.customDomain || ''}
                    onChange={(e) => updateCustomDomain(e.target.value)}
                    placeholder="myproject.com"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      {isDomainChecking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                          <span className="text-zinc-400">Validating domain...</span>
                        </>
                      ) : domainAvailable === true ? (
                        <>
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-emerald-400">Valid domain format</span>
                        </>
                      ) : domainAvailable === false ? (
                        <>
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-red-400">Invalid domain format</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                                 <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                   <div className="flex items-start space-x-3">
                     <svg className="w-6 h-6 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                     <div>
                       <h4 className="text-amber-100 font-semibold mb-3">Simple DNS Setup</h4>
                       <p className="text-amber-200/70 text-sm mb-4">
                         Just point your domain to our infrastructure and we&apos;ll handle the rest:
                       </p>
                       
                       <div className="bg-black/30 rounded-lg p-4 border border-amber-500/30">
                         <div className="space-y-2 text-sm font-mono">
                           <div className="text-amber-200">
                             <span className="text-amber-400">Type:</span> CNAME
                           </div>
                           <div className="text-amber-200">
                             <span className="text-amber-400">Name:</span> @ (or www)
                           </div>
                           <div className="text-amber-200">
                             <span className="text-amber-400">Value:</span> proxy.devlogr.space
                           </div>
                         </div>
                       </div>
                       
                       <div className="mt-4 space-y-2 text-xs">
                         <div className="flex items-center space-x-2 text-emerald-200">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                           </svg>
                           <span>Automatic verification when DNS propagates</span>
                         </div>
                         <div className="flex items-center space-x-2 text-emerald-200">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                           </svg>
                           <span>SSL certificate auto-generated</span>
                         </div>
                         <div className="flex items-center space-x-2 text-emerald-200">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                           </svg>
                           <span>No additional configuration needed</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
            )}
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

              <div className={`rounded-xl p-6 ${
                projectData.domainType === 'subdomain' 
                  ? 'bg-blue-500/10 border border-blue-500/20' 
                  : 'bg-purple-500/10 border border-purple-500/20'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
                  projectData.domainType === 'subdomain' ? 'text-blue-100' : 'text-purple-100'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>
                    {projectData.domainType === 'subdomain' ? 'DevLogr Subdomain' : 'Custom Domain'}
                  </span>
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <span className={`text-sm ${
                      projectData.domainType === 'subdomain' ? 'text-blue-200/70' : 'text-purple-200/70'
                    }`}>
                      Your project will be accessible at:
                    </span>
                    <div className="mt-2">
                      <code className={`font-mono text-lg px-4 py-2 rounded-lg inline-block ${
                        projectData.domainType === 'subdomain'
                          ? 'text-blue-300 bg-blue-500/20 border border-blue-500/30'
                          : 'text-purple-300 bg-purple-500/20 border border-purple-500/30'
                      }`}>
                        {projectData.domainType === 'subdomain' 
                          ? `${projectData.slug}.devlogr.space`
                          : projectData.customDomain || 'your-domain.com'
                        }
                      </code>
                    </div>
                  </div>
                  
                  {projectData.domainType === 'subdomain' ? (
                    <>
                      <div className="flex items-center space-x-2 text-sm">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-blue-200">Free SSL certificate</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-blue-200">Instant activation</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-blue-200">Global CDN</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 text-sm">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-purple-200">DNS setup required</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-purple-200">Auto SSL certificate</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-purple-200">Professional branding</span>
                      </div>
                    </>
                  )}
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
                    <span>
                      {projectData.domainType === 'subdomain' 
                        ? 'Your subdomain will be activated immediately'
                        : 'You\'ll receive DNS setup instructions'
                      }
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    <span>You can start logging your first update right away</span>
                  </li>
                  {projectData.domainType === 'custom' && (
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                      <span>SSL certificate will be auto-generated after DNS verification</span>
                    </li>
                  )}
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
        if (projectData.domainType === 'subdomain') {
          return projectData.slug.length >= 3 && slugAvailable === true;
        } else {
          return projectData.customDomain && isValidDomain(projectData.customDomain) && domainAvailable === true;
        }
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
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

interface DomainVerificationDetails {
  available: boolean;
  domain?: string;
  reason?: string;
  suggestions?: string[];
  currentStatus?: 'verified' | 'pending' | 'failed' | 'invalid';
  message?: string;
  requiresSetup?: boolean;
  instructions?: Array<{
    type: 'CNAME' | 'A_RECORD';
    name: string;
    value: string;
    ttl: number;
    description: string;
  }>;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

interface ValidationState {
  name: ValidationError[];
  description: ValidationError[];
  slug: ValidationError[];
  customDomain: ValidationError[];
  githubUrl: ValidationError[];
  twitterUrl: ValidationError[];
  websiteUrl: ValidationError[];
  tags: ValidationError[];
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
  const [domainVerification, setDomainVerification] = useState<DomainVerificationDetails | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationState>({
    name: [],
    description: [],
    slug: [],
    customDomain: [],
    githubUrl: [],
    twitterUrl: [],
    websiteUrl: [],
    tags: []
  });

  const totalSteps = 5;

  const validateProjectName = (name: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!name.trim()) {
      errors.push({ field: 'name', message: 'Project name is required', type: 'error' });
      return errors;
    }
    
    if (name.length < 3) {
      errors.push({ field: 'name', message: 'Project name must be at least 3 characters', type: 'error' });
    }
    
    if (name.length > 60) {
      errors.push({ field: 'name', message: 'Project name must be less than 60 characters', type: 'error' });
    }
    
    const invalidChars = /[<>:"\/\\|?*\x00-\x1f]/;
    if (invalidChars.test(name)) {
      errors.push({ field: 'name', message: 'Project name contains invalid characters', type: 'error' });
    }
    
    const reservedNames = ['admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'test', 'staging', 'dev', 'dashboard', 'support', 'help', 'docs', 'blog'];
    if (reservedNames.includes(name.toLowerCase().trim())) {
      errors.push({ field: 'name', message: 'This name is reserved and cannot be used', type: 'error' });
    }
    
    if (name.toLowerCase().includes('devlogr')) {
      errors.push({ field: 'name', message: 'Consider avoiding "devlogr" in your project name for clarity', type: 'warning' });
    }
    
    return errors;
  };

  const validateDescription = (description: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (description.length > 500) {
      errors.push({ field: 'description', message: 'Description must be less than 500 characters', type: 'error' });
    }
    
    if (description.length > 400) {
      errors.push({ field: 'description', message: `${500 - description.length} characters remaining`, type: 'warning' });
    }
    
    const suspiciousPatterns = /(http:\/\/|https:\/\/.*\.(tk|ml|ga|cf))/i;
    if (suspiciousPatterns.test(description)) {
      errors.push({ field: 'description', message: 'Please avoid suspicious URLs in description', type: 'warning' });
    }
    
    return errors;
  };

  const validateSlug = (slug: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!slug.trim()) {
      errors.push({ field: 'slug', message: 'Project slug is required', type: 'error' });
      return errors;
    }
    
    if (slug.length < 3) {
      errors.push({ field: 'slug', message: 'Slug must be at least 3 characters', type: 'error' });
    }
    
    if (slug.length > 30) {
      errors.push({ field: 'slug', message: 'Slug must be less than 30 characters', type: 'error' });
    }
    
    const validSlugPattern = /^[a-z0-9-]+$/;
    if (!validSlugPattern.test(slug)) {
      errors.push({ field: 'slug', message: 'Slug can only contain lowercase letters, numbers, and hyphens', type: 'error' });
    }
    
    if (slug.includes('--') || slug.startsWith('-') || slug.endsWith('-')) {
      errors.push({ field: 'slug', message: 'Slug cannot start/end with hyphen or contain consecutive hyphens', type: 'error' });
    }
    
    const reservedSlugs = ['admin', 'api', 'www', 'dashboard', 'auth', 'login', 'register', 'settings', 'profile', 'help', 'support', 'docs', 'blog', 'about', 'contact', 'terms', 'privacy'];
    if (reservedSlugs.includes(slug.toLowerCase())) {
      errors.push({ field: 'slug', message: 'This slug is reserved', type: 'error' });
    }
    
    return errors;
  };

  const validateUrl = (url: string, type: 'github' | 'website' | 'twitter'): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!url.trim()) return errors;
    
    try {
      const parsedUrl = new URL(url);
      
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.push({ field: `${type}Url`, message: 'URL must use http:// or https://', type: 'error' });
      }
      
      switch (type) {
        case 'github':
          if (!parsedUrl.hostname.includes('github.com')) {
            errors.push({ field: 'githubUrl', message: 'Please enter a valid GitHub URL', type: 'warning' });
          }
          break;
        case 'twitter':
          if (!['twitter.com', 'x.com'].some(domain => parsedUrl.hostname.includes(domain))) {
            errors.push({ field: 'twitterUrl', message: 'Please enter a valid Twitter/X URL', type: 'warning' });
          }
          break;
        case 'website':
          const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
          if (suspiciousTlds.some(tld => parsedUrl.hostname.endsWith(tld))) {
            errors.push({ field: 'websiteUrl', message: 'This domain type may be flagged as suspicious', type: 'warning' });
          }
          break;
      }
    } catch {
      errors.push({ field: `${type}Url`, message: 'Please enter a valid URL', type: 'error' });
    }
    
    return errors;
  };

  const validateTags = (tags: string[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (tags.length > 10) {
      errors.push({ field: 'tags', message: 'Maximum 10 tags allowed', type: 'error' });
    }
    
    const duplicates = tags.filter((tag, index) => tags.indexOf(tag) !== index);
    if (duplicates.length > 0) {
      errors.push({ field: 'tags', message: 'Duplicate tags detected', type: 'warning' });
    }
    
    const longTags = tags.filter(tag => tag.length > 20);
    if (longTags.length > 0) {
      errors.push({ field: 'tags', message: 'Some tags are too long (max 20 characters)', type: 'error' });
    }
    
    return errors;
  };

  const validateDomain = (domain: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!domain.trim()) {
      errors.push({ field: 'customDomain', message: 'Domain is required for custom domain option', type: 'error' });
      return errors;
    }
    
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/;
    if (!domainRegex.test(cleanDomain)) {
      errors.push({ field: 'customDomain', message: 'Invalid domain format', type: 'error' });
      return errors;
    }
    
    if (cleanDomain.includes('localhost') || cleanDomain.includes('127.0.0.1') || cleanDomain.includes('0.0.0.0')) {
      errors.push({ field: 'customDomain', message: 'Cannot use localhost or internal IP addresses', type: 'error' });
    }
    
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.internal', '.local'];
    if (suspiciousTlds.some(tld => cleanDomain.endsWith(tld))) {
      errors.push({ field: 'customDomain', message: 'This domain type may not be suitable for production', type: 'warning' });
    }
    
    if (cleanDomain.length > 253) {
      errors.push({ field: 'customDomain', message: 'Domain name is too long', type: 'error' });
    }
    
    return errors;
  };

  const updateValidation = useCallback(() => {
    const newValidation: ValidationState = {
      name: validateProjectName(projectData.name),
      description: validateDescription(projectData.description),
      slug: validateSlug(projectData.slug),
      customDomain: projectData.domainType === 'custom' && projectData.customDomain 
        ? validateDomain(projectData.customDomain) 
        : [],
      githubUrl: validateUrl(projectData.githubUrl || '', 'github'),
      twitterUrl: validateUrl(projectData.twitterUrl || '', 'twitter'),
      websiteUrl: validateUrl(projectData.websiteUrl || '', 'website'),
      tags: validateTags(projectData.tags)
    };
    
    setValidationErrors(newValidation);
  }, [projectData]);

  useEffect(() => {
    updateValidation();
  }, [updateValidation]);

  const getFieldStatus = (field: keyof ValidationState): 'valid' | 'warning' | 'error' => {
    const errors = validationErrors[field];
    if (errors.some(e => e.type === 'error')) return 'error';
    if (errors.some(e => e.type === 'warning')) return 'warning';
    return 'valid';
  };

  const hasErrors = (fields: (keyof ValidationState)[]): boolean => {
    return fields.some(field => 
      validationErrors[field].some(error => error.type === 'error')
    );
  };

  const getValidationSummary = () => {
    const allFields: (keyof ValidationState)[] = ['name', 'description', 'slug', 'customDomain', 'githubUrl', 'twitterUrl', 'websiteUrl', 'tags'];
    const totalErrors = allFields.reduce((sum, field) => 
      sum + validationErrors[field].filter(e => e.type === 'error').length, 0
    );
    const totalWarnings = allFields.reduce((sum, field) => 
      sum + validationErrors[field].filter(e => e.type === 'warning').length, 0
    );
    
    return { errors: totalErrors, warnings: totalWarnings };
  };
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

  const checkCustomDomain = useCallback(async (domain: string) => {
    if (!domain || !isValidDomain(domain)) return;
    
    setIsDomainChecking(true);
    try {
      const response = await api.checkDomainAvailability(domain);
      
      if (response.success && response.data) {
        setDomainVerification(response.data);
      } else {
        setDomainVerification({
          available: false,
          reason: response.message || 'Domain check failed',
          suggestions: []
        });
      }
    } catch (error) {
      console.error('Error checking domain availability:', error);
      setDomainVerification({
        available: false,
        reason: 'Network error occurred',
        suggestions: []
      });
    } finally {
      setIsDomainChecking(false);
    }
  }, []);

  const isValidDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/;
    return domainRegex.test(domain);
  };

  const ValidationMessage = ({ field }: { field: keyof ValidationState }) => {
    const errors = validationErrors[field];
    if (errors.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {errors.map((error, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 text-xs ${
              error.type === 'error'
                ? 'text-red-400'
                : error.type === 'warning'
                ? 'text-amber-400'
                : 'text-blue-400'
            }`}
          >
            {error.type === 'error' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {error.type === 'warning' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {error.type === 'info' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{error.message}</span>
          </div>
        ))}
      </div>
    );
  };

  const getInputBorderClass = (field: keyof ValidationState, baseClass: string) => {
    const status = getFieldStatus(field);
    switch (status) {
      case 'error':
        return baseClass.replace('border-white/10', 'border-red-500/50').replace('focus:border-blue-500/50', 'focus:border-red-500');
      case 'warning':
        return baseClass.replace('border-white/10', 'border-amber-500/50').replace('focus:border-blue-500/50', 'focus:border-amber-500');
      default:
        return baseClass;
    }
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

    setDomainVerification(null);
    setIsDomainChecking(false);

    if (!domain || !isValidDomain(domain)) return;
    const timer = setTimeout(() => {
      checkCustomDomain(domain);
    }, 800);

    setDebounceTimer(timer);
  }, [debounceTimer, checkCustomDomain]);

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
    } else {
      setDomainVerification(null);
    }
  };

  const getStatusIcon = (status: 'verified' | 'pending' | 'failed' | 'invalid' | undefined) => {
    switch (status) {
      case 'verified':
        return <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      case 'pending':
        return <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      case 'failed':
      case 'invalid':
        return <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      default:
        return null;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
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
                  className={getInputBorderClass('name', "w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300")}
                />
                <ValidationMessage field="name" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Description
                  <span className="text-zinc-400 font-normal ml-2">
                    ({projectData.description.length}/500 characters)
                  </span>
                </label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what you're building and your goals..."
                  rows={4}
                  className={getInputBorderClass('description', "w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 resize-none")}
                />
                <ValidationMessage field="description" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Project Visibility
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setProjectData(prev => ({ ...prev, visibility: 'PUBLIC' }))}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                      projectData.visibility === 'PUBLIC'
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-white">Public</span>
                    </div>
                    <p className="text-sm text-zinc-300">Anyone can view</p>
                  </button>
                  
                  <button
                    onClick={() => setProjectData(prev => ({ ...prev, visibility: 'PRIVATE' }))}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                      projectData.visibility === 'PRIVATE'
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-semibold text-white">Private</span>
                    </div>
                    <p className="text-sm text-zinc-300">Only you can view</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Choose your domain</h3>
              <p className="text-zinc-400">How do you want people to access your project?</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">DevLogr Subdomain</h4>
                    <p className="text-zinc-300 mb-3">
                      Get started instantly with a free subdomain
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Instant setup</span>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Free SSL</span>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>No setup required</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                disabled={true}
                className="w-full p-6 rounded-xl border transition-all duration-300 text-left bg-gray-500/10 border-gray-500/30 cursor-not-allowed opacity-60"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    projectData.domainType === 'custom' ? 'bg-purple-500/20' : 'bg-white/10'
                  }`}>
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">Custom Domain</h4>
                      <span className="bg-amber-500/20 text-amber-400 text-xs font-medium px-2 py-1 rounded-full border border-amber-500/30">
                        In Development
                      </span>
                    </div>
                    <p className="text-zinc-400 mb-3">
                      Use your own domain for professional branding (Coming soon)
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-amber-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>DNS setup required</span>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Auto SSL</span>
                      </div>
                      <div className="flex items-center space-x-1 text-purple-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
                projectData.domainType === 'subdomain' 
                  ? 'from-blue-500/20 to-cyan-500/20 border-blue-500/20' 
                  : 'from-purple-500/20 to-pink-500/20 border-purple-500/20'
              }`}>
                <svg className={`w-8 h-8 ${
                  projectData.domainType === 'subdomain' ? 'text-blue-400' : 'text-purple-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {projectData.domainType === 'subdomain' ? 'Configure your subdomain' : 'Configure your custom domain'}
              </h3>
              <p className="text-zinc-400">
                {projectData.domainType === 'subdomain' 
                  ? 'Choose your project\'s web address' 
                  : 'Set up your custom domain with real-time verification'}
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
                      className={`w-full pl-4 pr-40 py-4 bg-white/5 border rounded-xl text-white placeholder-zinc-400 focus:outline-none transition-all duration-300 ${
                        getFieldStatus('slug') === 'error'
                          ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/5'
                          : slugAvailable === true 
                          ? 'border-emerald-500/50 focus:border-emerald-500 focus:bg-emerald-500/5' 
                          : slugAvailable === false 
                          ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/5'
                          : 'border-white/10 focus:border-blue-500/50 focus:bg-white/10'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <span className="text-zinc-400 text-sm">.devlogr.space</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <ValidationMessage field="slug" />
                    <div className="flex items-center space-x-2">
                      {isSlugChecking && (
                        <div className="flex items-center space-x-2 text-blue-400">
                          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                          <span className="text-sm">Checking availability...</span>
                        </div>
                      )}
                      {slugAvailable === true && getFieldStatus('slug') !== 'error' && (
                        <div className="flex items-center space-x-2 text-emerald-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">Subdomain is available!</span>
                        </div>
                      )}
                      {slugAvailable === false && (
                        <div className="flex items-center space-x-2 text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">Subdomain is already taken</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-blue-100 mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Preview URL</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-blue-200/70">Your project will be accessible at:</span>
                      <div className="mt-2">
                        <code className="font-mono text-lg px-4 py-2 rounded-lg inline-block text-blue-300 bg-blue-500/20 border border-blue-500/30">
                          {projectData.slug || 'your-project'}.devlogr.space
                        </code>
                      </div>
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
                    className={`w-full px-4 py-4 bg-white/5 border rounded-xl text-white placeholder-zinc-400 focus:outline-none transition-all duration-300 ${
                      getFieldStatus('customDomain') === 'error'
                        ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/5'
                        : domainVerification?.available === true 
                        ? 'border-emerald-500/50 focus:border-emerald-500 focus:bg-emerald-500/5' 
                        : domainVerification?.available === false 
                        ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/5'
                        : 'border-white/10 focus:border-purple-500/50 focus:bg-white/10'
                    }`}
                  />
                  
                  <div className="mt-3 space-y-2">
                    <ValidationMessage field="customDomain" />
                    {isDomainChecking && (
                      <div className="flex items-center space-x-2 text-purple-400">
                        <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                        <span className="text-sm">Checking domain...</span>
                      </div>
                    )}
                    
                    {domainVerification && getFieldStatus('customDomain') !== 'error' && (
                      <div className="space-y-3">
                        <div className={`flex items-center space-x-2 ${
                          domainVerification.available ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {getStatusIcon(domainVerification.currentStatus)}
                          <span className="text-sm">
                            {domainVerification.available 
                              ? domainVerification.message || 'Domain is available'
                              : domainVerification.reason || 'Domain is not available'
                            }
                          </span>
                        </div>
                        
                        {domainVerification.requiresSetup && domainVerification.instructions && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                            <h5 className="text-amber-100 font-medium mb-2">DNS Setup Required</h5>
                            <p className="text-amber-200/70 text-sm mb-3">
                              Add one of these DNS records to your domain:
                            </p>
                            <div className="space-y-2">
                              {domainVerification.instructions.map((instruction, index) => (
                                <div key={index} className="bg-black/20 rounded-lg p-3">
                                  <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div>
                                      <span className="text-zinc-400">Type:</span>
                                      <div className="text-amber-300 font-mono">{instruction.type}</div>
                                    </div>
                                    <div>
                                      <span className="text-zinc-400">Name:</span>
                                      <div className="text-amber-300 font-mono break-all">{instruction.name}</div>
                                    </div>
                                    <div>
                                      <span className="text-zinc-400">Value:</span>
                                      <div className="text-amber-300 font-mono break-all">{instruction.value}</div>
                                    </div>
                                  </div>
                                  <p className="text-amber-200/60 text-xs mt-2">{instruction.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {!domainVerification.available && domainVerification.suggestions && domainVerification.suggestions.length > 0 && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <h5 className="text-blue-100 font-medium mb-2">Suggestions</h5>
                            <div className="flex flex-wrap gap-2">
                              {domainVerification.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => updateCustomDomain(suggestion)}
                                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-purple-100 mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Domain Preview</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-purple-200/70">Your project will be accessible at:</span>
                      <div className="mt-2">
                        <code className="font-mono text-lg px-4 py-2 rounded-lg inline-block text-purple-300 bg-purple-500/20 border border-purple-500/30">
                          {projectData.customDomain || 'your-domain.com'}
                        </code>
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
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Project features</h3>
              <p className="text-zinc-400">Configure your project&apos;s engagement features</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex items-start space-x-4 cursor-pointer">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Issue Tracking</span>
                    </h4>
                    <p className="text-sm text-zinc-400 mb-3">Allow visitors to report bugs and request features</p>
                    <div className="flex items-center space-x-2 text-xs text-zinc-500">
                      <span>• Public issue submission</span>
                      <span>• Issue categorization</span>
                      <span>• Status tracking</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={projectData.allowIssues}
                    onChange={(e) => setProjectData(prev => ({ ...prev, allowIssues: e.target.checked }))}
                  />
                  <div className={`w-14 h-8 flex items-center bg-zinc-700 rounded-full p-1 transition-all duration-300 ${projectData.allowIssues ? 'bg-red-500' : 'bg-zinc-700'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${projectData.allowIssues ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>

                <label className="flex items-start space-x-4 cursor-pointer">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Feedback Collection</span>
                    </h4>
                    <p className="text-sm text-zinc-400 mb-3">Let users share thoughts and suggestions</p>
                    <div className="flex items-center space-x-2 text-xs text-zinc-500">
                      <span>• Anonymous feedback</span>
                      <span>• Rating system</span>
                      <span>• Category filtering</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={projectData.allowFeedback}
                    onChange={(e) => setProjectData(prev => ({ ...prev, allowFeedback: e.target.checked }))}
                  />
                  <div className={`w-14 h-8 flex items-center bg-zinc-700 rounded-full p-1 transition-all duration-300 ${projectData.allowFeedback ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${projectData.allowFeedback ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>Tech Stack (Optional)</span>
                </h4>
                <p className="text-sm text-zinc-400 mb-4">Add tags to showcase your technology stack</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {['React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'TypeScript', 'JavaScript', 'Python', 'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Go', 'Rust', 'Java', 'Spring', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS'].map(tech => (
                      <button
                        key={tech}
                        onClick={() => {
                          const newTags = projectData.tags.includes(tech)
                            ? projectData.tags.filter(t => t !== tech)
                            : [...projectData.tags, tech];
                          setProjectData(prev => ({ ...prev, tags: newTags }));
                        }}
                        className={`px-3 py-2 text-xs rounded-lg border transition-all duration-300 ${
                          projectData.tags.includes(tech)
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                  
                  <ValidationMessage field="tags" />
                  {projectData.tags.length > 0 && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <span className="text-sm text-purple-200 mb-2 block">
                        Selected technologies ({projectData.tags.length}/10):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {projectData.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-purple-500/20 text-purple-200 text-xs rounded border border-purple-500/30 flex items-center space-x-1">
                            <span>{tag}</span>
                            <button
                              onClick={() => {
                                const newTags = projectData.tags.filter(t => t !== tag);
                                setProjectData(prev => ({ ...prev, tags: newTags }));
                              }}
                              className="text-purple-300 hover:text-purple-100"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Project Links (Optional)</span>
                </h4>
                <p className="text-sm text-zinc-400 mb-4">Connect your project to external resources</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      GitHub Repository
                    </label>
                    <input
                      type="url"
                      value={projectData.githubUrl || ''}
                      onChange={(e) => setProjectData(prev => ({ ...prev, githubUrl: e.target.value }))}
                      placeholder="https://github.com/username/repo"
                      className={getInputBorderClass('githubUrl', "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300")}
                    />
                    <ValidationMessage field="githubUrl" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Website/Demo
                    </label>
                    <input
                      type="url"
                      value={projectData.websiteUrl || ''}
                      onChange={(e) => setProjectData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                      placeholder="https://myproject.com"
                      className={getInputBorderClass('websiteUrl', "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300")}
                    />
                    <ValidationMessage field="websiteUrl" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Twitter/X Profile
                    </label>
                    <input
                      type="url"
                      value={projectData.twitterUrl || ''}
                      onChange={(e) => setProjectData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                      placeholder="https://twitter.com/username"
                      className={getInputBorderClass('twitterUrl', "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300")}
                    />
                    <ValidationMessage field="twitterUrl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">What you get with these features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="text-emerald-400 font-medium">Community Engagement</h5>
                    <ul className="space-y-2 text-sm text-zinc-300">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                        <span>Direct user feedback on features</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                        <span>Bug reports from real users</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                        <span>Feature request insights</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-blue-400 font-medium">Project Management</h5>
                    <ul className="space-y-2 text-sm text-zinc-300">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span>Organized issue tracking</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span>Priority management</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span>Public roadmap visibility</span>
                      </li>
                    </ul>
                  </div>
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
        return !hasErrors(['name', 'description']) && projectData.name.trim().length > 0;
      case 2:
        return true;
      case 3:
        if (projectData.domainType === 'subdomain') {
          return !hasErrors(['slug']) && 
                 projectData.slug.length >= 3 && 
                 slugAvailable === true;
        } else {
          return !hasErrors(['customDomain']) && 
                 projectData.customDomain && 
                 isValidDomain(projectData.customDomain) && 
                 domainVerification?.available === true;
        }
      case 4:
        const fieldsToCheck: (keyof ValidationState)[] = ['tags'];
        if (projectData.githubUrl) fieldsToCheck.push('githubUrl');
        if (projectData.twitterUrl) fieldsToCheck.push('twitterUrl');
        if (projectData.websiteUrl) fieldsToCheck.push('websiteUrl');
        
        return !hasErrors(fieldsToCheck);
      case 5:
        const allFields: (keyof ValidationState)[] = ['name', 'description', 'tags'];
        if (projectData.domainType === 'subdomain') {
          allFields.push('slug');
        } else if (projectData.customDomain) {
          allFields.push('customDomain');
        }
        if (projectData.githubUrl) allFields.push('githubUrl');
        if (projectData.twitterUrl) allFields.push('twitterUrl');
        if (projectData.websiteUrl) allFields.push('websiteUrl');
        
        return !hasErrors(allFields) && 
               (projectData.domainType === 'subdomain' ? slugAvailable === true : 
                projectData.domainType === 'custom' ? domainVerification?.available === true : true);
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
          {(() => {
            const summary = getValidationSummary();
            if (summary.errors > 0 || summary.warnings > 0) {
              return (
                <div className="mb-4 flex items-center justify-center space-x-4 text-xs">
                  {summary.errors > 0 && (
                    <div className="flex items-center space-x-1 text-red-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>{summary.errors} error{summary.errors !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {summary.warnings > 0 && (
                    <div className="flex items-center space-x-1 text-amber-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{summary.warnings} warning{summary.warnings !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}
          
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
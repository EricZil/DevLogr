'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface DomainSetupWizardProps {
  projectId: string;
  projectSlug: string;
  currentDomain?: string | null;
  onComplete: (domain: string) => void;
  onCancel: () => void;
}

interface VerificationStatus {
  verified: boolean;
  dns: boolean;
  ssl: boolean;
  error?: string;
  details?: {
    cnameFound: boolean;
    cnameTarget: string;
    ipAddress?: string;
  };
}

export default function DomainSetupWizard({ 
  projectId, 
  projectSlug, 
  currentDomain, 
  onComplete, 
  onCancel 
}: DomainSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [domain, setDomain] = useState(currentDomain || '');
  const [domainType, setDomainType] = useState<'subdomain' | 'root'>('subdomain');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const steps = [
    {
      id: 1,
      title: 'Choose Domain Type',
      description: 'Select the type of custom domain you want to use',
      icon: '🎯'
    },
    {
      id: 2,
      title: 'Enter Domain',
      description: 'Provide your custom domain name',
      icon: '🌐'
    },
    {
      id: 3,
      title: 'Configure DNS',
      description: 'Set up DNS records with your domain provider',
      icon: '⚙️'
    },
    {
      id: 4,
      title: 'Verify & Complete',
      description: 'Verify domain ownership and complete setup',
      icon: '✅'
    }
  ];

  const validateDomain = (inputDomain: string): string[] => {
    const errors: string[] = [];
    
    if (!inputDomain) {
      errors.push('Domain is required');
      return errors;
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}\.?)*[a-zA-Z]{2,}$/;
    if (!domainRegex.test(inputDomain)) {
      errors.push('Invalid domain format');
    }

    if (inputDomain.length > 253) {
      errors.push('Domain is too long (max 253 characters)');
    }

    const reservedDomains = ['localhost', 'example.com', 'test.com', 'devlogr.space'];
    if (reservedDomains.some(reserved => inputDomain.includes(reserved))) {
      errors.push('Cannot use reserved domains');
    }

    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
    if (suspiciousTlds.some(tld => inputDomain.endsWith(tld))) {
      errors.push('This TLD may have limitations');
    }

    return errors;
  };

  const verifyDomain = async (domainToVerify: string) => {
    setIsVerifying(true);
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?action=check-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ domain: domainToVerify })
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          setVerificationStatus(responseData.data);
          return responseData.data;
        }
      }
      
      setVerificationStatus({
        verified: false,
        dns: false,
        ssl: false,
        error: 'Failed to verify domain'
      });
      return null;
    } catch (error) {
      console.error('Domain verification failed:', error);
      setVerificationStatus({
        verified: false,
        dns: false,
        ssl: false,
        error: 'Network error during verification'
      });
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  const submitDomainConfiguration = async () => {
    setIsSubmitting(true);
    try {
      const token = api.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=domain`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ customDomain: domain })
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          onComplete(domain);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to configure domain:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (domain) {
      const errors = validateDomain(domain);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  }, [domain]);

  useEffect(() => {
    if (domain && validationErrors.length === 0 && (currentStep === 3 || currentStep === 4)) {
      const timer = setTimeout(() => {
        verifyDomain(domain);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [domain, validationErrors, currentStep]);

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return domainType !== null;
      case 2:
        return domain && validationErrors.length === 0;
      case 3:
        return true;
      case 4:
        return verificationStatus?.verified || false;
      default:
        return false;
    }
  };

  const getDnsInstructions = () => {
    if (!domain) return null;

    const isSubdomain = domain.includes('.');
    const recordName = isSubdomain ? domain.split('.')[0] : '@';
    
    return {
      type: 'CNAME',
      name: recordName,
      value: 'proxy.devlogr.space',
      ttl: '3600'
    };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-black/90 via-zinc-900/90 to-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Domain Setup Wizard</h2>
            <p className="text-zinc-400">Configure a custom domain for your project in just a few steps</p>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= step.id 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'bg-zinc-800 border-zinc-600 text-zinc-400'
                }`}>
                  {currentStep > step.id ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-lg">{step.icon}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-0.5 mx-4 transition-all duration-300 ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-zinc-600'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">{steps[currentStep - 1].title}</h3>
            <p className="text-zinc-400">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        <div className="min-h-[400px] mb-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h4 className="text-lg font-semibold text-white mb-2">What type of domain would you like to use?</h4>
                <p className="text-zinc-400">Choose the option that best fits your needs</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setDomainType('subdomain')}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    domainType === 'subdomain'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-600 bg-zinc-800/50 hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">🌐</span>
                    <h5 className="text-lg font-semibold text-white">Subdomain</h5>
                  </div>
                  <p className="text-sm text-zinc-300 mb-4">
                    Use a subdomain of your existing website (e.g., project.yoursite.com)
                  </p>
                  <div className="space-y-2 text-xs text-zinc-500">
                    <div className="flex items-center">
                      <span className="text-emerald-400 mr-2">✓</span>
                      <span>Easy to set up</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-emerald-400 mr-2">✓</span>
                      <span>Keeps main domain intact</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-emerald-400 mr-2">✓</span>
                      <span>Perfect for project showcases</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setDomainType('root')}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    domainType === 'root'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-zinc-600 bg-zinc-800/50 hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">🏠</span>
                    <h5 className="text-lg font-semibold text-white">Root Domain</h5>
                  </div>
                  <p className="text-sm text-zinc-300 mb-4">
                    Use your entire domain for this project (e.g., myproject.com)
                  </p>
                  <div className="space-y-2 text-xs text-zinc-500">
                    <div className="flex items-center">
                      <span className="text-emerald-400 mr-2">✓</span>
                      <span>Professional appearance</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-emerald-400 mr-2">✓</span>
                      <span>Better for branding</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-emerald-400 mr-2">✓</span>
                      <span>Ideal for main projects</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h4 className="text-lg font-semibold text-white mb-2">Enter Your Custom Domain</h4>
                <p className="text-zinc-400">
                  {domainType === 'subdomain' 
                    ? 'Enter the full subdomain you want to use (e.g., project.yoursite.com)'
                    : 'Enter your root domain (e.g., myproject.com)'
                  }
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    {domainType === 'subdomain' ? 'Subdomain' : 'Root Domain'}
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                    placeholder={domainType === 'subdomain' ? 'project.yoursite.com' : 'myproject.com'}
                    className={`w-full bg-black/40 border rounded-xl px-4 py-4 text-white text-lg placeholder-zinc-500 focus:ring-2 transition-all ${
                      validationErrors.length > 0 
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-white/20 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  
                  {validationErrors.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {validationErrors.map((error, index) => (
                        <p key={index} className="text-red-400 text-sm flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {error}
                        </p>
                      ))}
                    </div>
                  )}

                  {domain && validationErrors.length === 0 && (
                    <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                      <p className="text-emerald-400 text-sm mb-2">✓ Domain looks good!</p>
                      <p className="text-zinc-300 text-sm">
                        Your project will be available at: <code className="text-emerald-400">https://{domain}</code>
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-700/50">
                  <h5 className="font-semibold text-white mb-3">
                    {domainType === 'subdomain' ? 'Subdomain Examples:' : 'Root Domain Examples:'}
                  </h5>
                  <div className="space-y-2 text-sm text-zinc-400">
                    {domainType === 'subdomain' ? (
                      <>
                        <p>• <code>portfolio.yourname.com</code></p>
                        <p>• <code>app.startup.io</code></p>
                        <p>• <code>demo.company.org</code></p>
                      </>
                    ) : (
                      <>
                        <p>• <code>myawesome.app</code></p>
                        <p>• <code>coolproject.dev</code></p>
                        <p>• <code>startup.io</code></p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h4 className="text-lg font-semibold text-white mb-2">Configure DNS Records</h4>
                <p className="text-zinc-400">Add these DNS records to your domain provider to connect your domain</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/20">
                  <h5 className="font-semibold text-white mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    Domain Configuration for: <code className="ml-2 text-blue-400">{domain}</code>
                  </h5>
                  
                  {getDnsInstructions() && (
                    <div className="bg-black/40 rounded-lg p-4 border border-blue-500/20">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wide">Record Type</label>
                          <div className="flex items-center space-x-2">
                            <code className="text-blue-400 font-semibold">{getDnsInstructions()?.type}</code>
                            <button
                              onClick={() => navigator.clipboard.writeText(getDnsInstructions()?.type || '')}
                              className="p-1 text-zinc-400 hover:text-white transition-colors"
                              title="Copy"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wide">Name/Host</label>
                          <div className="flex items-center space-x-2">
                            <code className="text-white font-mono">{getDnsInstructions()?.name}</code>
                            <button
                              onClick={() => navigator.clipboard.writeText(getDnsInstructions()?.name || '')}
                              className="p-1 text-zinc-400 hover:text-white transition-colors"
                              title="Copy"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wide">Value/Target</label>
                          <div className="flex items-center space-x-2">
                            <code className="text-white font-mono">{getDnsInstructions()?.value}</code>
                            <button
                              onClick={() => navigator.clipboard.writeText(getDnsInstructions()?.value || '')}
                              className="p-1 text-zinc-400 hover:text-white transition-colors"
                              title="Copy"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-900/20 rounded-xl p-6 border border-amber-500/20">
                  <h5 className="font-semibold text-white mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    Setup Instructions
                  </h5>
                  <ol className="space-y-3 text-sm text-zinc-300">
                    <li className="flex items-start">
                      <span className="bg-amber-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                      <div>
                        <strong>Go to your domain provider&apos;s DNS settings</strong>
                        <p className="text-zinc-400 mt-1">Common providers: Namecheap, GoDaddy, Cloudflare, Google Domains</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-amber-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                      <div>
                        <strong>Add a new CNAME record</strong>
                        <p className="text-zinc-400 mt-1">Copy the values from the configuration box above</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-amber-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                      <div>
                        <strong>Save the DNS record</strong>
                        <p className="text-zinc-400 mt-1">Changes may take 5-30 minutes to take effect</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-amber-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                      <div>
                        <strong>Continue to verification</strong>
                        <p className="text-zinc-400 mt-1">We&apos;ll check if everything is configured correctly</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="text-xs text-zinc-500 space-y-2">
                    <p className="flex items-center">
                      <span className="mr-2">💡</span>
                      <strong>Tip:</strong> DNS changes can take up to 24 hours to propagate globally
                    </p>
                    <p className="flex items-center">
                      <span className="mr-2">🔒</span>
                      <strong>SSL:</strong> HTTPS certificates are automatically provisioned after verification
                    </p>
                    <p className="flex items-center">
                      <span className="mr-2">📞</span>
                      <strong>Help:</strong> Check your domain provider&apos;s documentation for adding CNAME records
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h4 className="text-lg font-semibold text-white mb-2">Verify Domain & Complete Setup</h4>
                <p className="text-zinc-400">We&apos;ll check if your DNS records are configured correctly</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-500/20">
                  <h5 className="font-semibold text-white mb-4 flex items-center">
                    <span className="mr-2">🔍</span>
                    Verifying: <code className="ml-2 text-purple-400">{domain}</code>
                  </h5>
                  
                  <div className="flex items-center justify-center mb-6">
                    <button
                      onClick={() => verifyDomain(domain)}
                      disabled={isVerifying}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                    >
                      {isVerifying ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Verifying Domain...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Verify Domain</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {verificationStatus && (
                  <div className={`rounded-xl p-6 border ${
                    verificationStatus.verified 
                      ? 'bg-emerald-900/20 border-emerald-500/20' 
                      : 'bg-red-900/20 border-red-500/20'
                  }`}>
                    <h5 className="font-semibold text-white mb-4 flex items-center">
                      <span className="mr-2">{verificationStatus.verified ? '✅' : '❌'}</span>
                      Verification Results
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                        <span className="text-zinc-300">DNS Resolution</span>
                        <span className={`flex items-center font-medium ${
                          verificationStatus.dns ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {verificationStatus.dns ? '✓ Working' : '✗ Failed'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                        <span className="text-zinc-300">SSL Certificate</span>
                        <span className={`flex items-center font-medium ${
                          verificationStatus.ssl ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {verificationStatus.ssl ? '✓ Active' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>

                    {verificationStatus.error && (
                      <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/20 mb-4">
                        <p className="text-red-400 text-sm font-medium mb-2">Verification Error:</p>
                        <p className="text-red-300 text-sm">{verificationStatus.error}</p>
                      </div>
                    )}

                    {verificationStatus.verified ? (
                      <div className="bg-emerald-900/30 rounded-lg p-4 border border-emerald-500/20">
                        <p className="text-emerald-400 text-sm font-medium mb-2">🎉 Domain Successfully Verified!</p>
                        <p className="text-emerald-300 text-sm">
                          Your domain is properly configured and ready to use. SSL certificate will be automatically provisioned.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-500/20">
                        <p className="text-amber-400 text-sm font-medium mb-2">⏳ Verification Pending</p>
                        <p className="text-amber-300 text-sm mb-3">
                          Domain verification failed. This is usually because DNS changes haven&apos;t propagated yet.
                        </p>
                        <div className="text-xs text-amber-200 space-y-1">
                          <p>• DNS changes can take 5-30 minutes to take effect</p>
                          <p>• Double-check your CNAME record is correctly configured</p>
                          <p>• Try the verification again in a few minutes</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/50">
                  <p className="text-zinc-400 text-sm">
                    <strong>Don&apos;t worry!</strong> Your project is still accessible at:
                  </p>
                  <code className="text-blue-400 text-sm mt-1 block">https://{projectSlug}.devlogr.space</code>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <button
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                onCancel();
              }
            }}
            className="px-6 py-3 text-zinc-400 hover:text-white border border-zinc-600 hover:border-zinc-500 rounded-xl transition-all duration-200"
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={submitDomainConfiguration}
                disabled={isSubmitting || !verificationStatus?.verified}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
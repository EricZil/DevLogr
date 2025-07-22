'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';

interface DomainVerificationStatusProps {
  projectId: string;
  onVerificationChange?: (verified: boolean) => void;
}

interface DomainStatus {
  customDomain: string | null;
  domainVerified: boolean;
  sslEnabled: boolean;
  hasCustomDomain: boolean;
  verificationDetails: {
    dnsResolved: boolean;
    pointsToProxy: boolean;
    hasCloudflare: boolean;
    sslAvailable: boolean;
    lastChecked: string;
  } | null;
  instructions: Array<{
    type: 'CNAME' | 'A_RECORD';
    name: string;
    value: string;
    ttl: number;
    description: string;
  }> | null;
  publicUrl: string;
}

export default function DomainVerificationStatus({ 
  projectId, 
  onVerificationChange 
}: DomainVerificationStatusProps) {
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      alert(`Error: ${message}`);
    }
  };

  const fetchDomainStatus = async () => {
    try {
      const response = await api.getDomainVerificationStatus(projectId);
      if (response.success && response.data) {
        setDomainStatus(response.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch domain status:', error);
      showToast('Failed to load domain status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!domainStatus?.customDomain) return;
    
    setIsVerifying(true);
    try {
      const response = await api.verifyProjectDomain(projectId);
      if (response.success && response.data) {
        const wasVerified = domainStatus.domainVerified;
        await fetchDomainStatus();
        
        if (response.data.verified && !wasVerified) {
          showToast('Domain verified successfully!', 'success');
          onVerificationChange?.(true);
        } else if (!response.data.verified) {
          showToast(response.data.message || 'Domain verification pending', 'warning');
        }
      }
    } catch (error) {
      console.error('Domain verification failed:', error);
      showToast('Failed to verify domain', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'success');
  };



  const getStatusBadge = (verified: boolean, hasCustomDomain: boolean) => {
    if (!hasCustomDomain) {
      return <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">Using Subdomain</span>;
    }
    if (verified) {
      return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Verified</span>;
    }
    return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">Unverified</span>;
  };

  useEffect(() => {
    fetchDomainStatus();
  }, [projectId, fetchDomainStatus]);

  useEffect(() => {
    if (domainStatus?.hasCustomDomain && !domainStatus.domainVerified) {
      const interval = setInterval(fetchDomainStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [domainStatus?.hasCustomDomain, domainStatus?.domainVerified, fetchDomainStatus]);

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-white">Domain Status</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  if (!domainStatus) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-white">Domain Status</h3>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-red-200">Failed to load domain status. Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-white">Domain Status</h3>
        </div>
        {getStatusBadge(domainStatus.domainVerified, domainStatus.hasCustomDomain)}
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Public URL:</span>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                {domainStatus.publicUrl}
              </code>
              <button
                onClick={() => window.open(domainStatus.publicUrl, '_blank')}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {domainStatus.hasCustomDomain && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Custom Domain:</span>
              <code className="text-sm bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                {domainStatus.customDomain}
              </code>
            </div>
          )}
        </div>

        <div className="border-t border-white/10"></div>

        {domainStatus.hasCustomDomain && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Verification Status</h4>
              <button
                onClick={fetchDomainStatus}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-zinc-300 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {domainStatus.verificationDetails && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {domainStatus.verificationDetails.dnsResolved ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-zinc-300">DNS Resolved</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {domainStatus.verificationDetails.pointsToProxy ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-zinc-300">Points to Proxy</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {domainStatus.verificationDetails.sslAvailable ? (
                    <Shield className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-zinc-300">SSL Available</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {domainStatus.sslEnabled ? (
                    <Zap className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm text-zinc-300">SSL Enabled</span>
                </div>
              </div>
            )}

            <div className="text-xs text-zinc-400">
              Last checked: {new Date(lastRefresh).toLocaleString()}
            </div>

            {!domainStatus.domainVerified && (
              <button
                onClick={handleVerifyDomain}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Verify Domain
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {domainStatus.instructions && domainStatus.instructions.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-white/10"></div>
            <div>
              <h4 className="text-sm font-medium text-white mb-3">DNS Configuration Required</h4>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <p className="text-yellow-200 text-sm">
                    Configure your DNS settings with your domain provider to point to our servers.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {domainStatus.instructions.map((instruction, index) => (
                  <div key={index} className="border border-white/10 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-white/10 text-white text-xs rounded border border-white/20">
                        {instruction.type}
                      </span>
                      <span className="text-xs text-zinc-400">
                        TTL: {instruction.ttl}s
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-300">Name:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                            {instruction.name}
                          </code>
                          <button
                            onClick={() => copyToClipboard(instruction.name, 'Name')}
                            className="p-1 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-300">Value:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                            {instruction.value}
                          </code>
                          <button
                            onClick={() => copyToClipboard(instruction.value, 'Value')}
                            className="p-1 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-zinc-400">
                      {instruction.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {domainStatus.hasCustomDomain && !domainStatus.domainVerified && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="text-yellow-200 text-sm">
                  <strong>Limited Access:</strong> Some features like Milestones and Updates are restricted until your custom domain is verified.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
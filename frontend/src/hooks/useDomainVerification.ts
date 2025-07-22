'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface DomainVerificationStatus {
  hasCustomDomain: boolean;
  domainVerified: boolean;
  customDomain?: string;
  sslEnabled?: boolean;
  lastChecked?: string;
  verificationDetails?: {
    dnsResolved: boolean;
    pointsToProxy: boolean;
    hasCloudflare: boolean;
    sslAvailable: boolean;
    lastChecked: string;
  };
}

interface UseDomainVerificationOptions {
  projectId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onStatusChange?: (status: DomainVerificationStatus) => void;
}

export function useDomainVerification({
  projectId,
  autoRefresh = true,
  refreshInterval = 30000,
  onStatusChange
}: UseDomainVerificationOptions) {
  const [status, setStatus] = useState<DomainVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await api.getDomainVerificationStatus(projectId);
      
      if (response.success && response.data) {
        const newStatus: DomainVerificationStatus = {
          hasCustomDomain: !!response.data.customDomain,
          domainVerified: response.data.domainVerified || false,
          customDomain: response.data.customDomain || undefined,
          sslEnabled: response.data.sslEnabled || false,
          lastChecked: new Date().toISOString(),
          verificationDetails: response.data.verificationDetails || undefined
        };
        
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      } else {
        const defaultStatus: DomainVerificationStatus = {
          hasCustomDomain: false,
          domainVerified: true,
          lastChecked: new Date().toISOString()
        };
        setStatus(defaultStatus);
        onStatusChange?.(defaultStatus);
      }
    } catch (err) {
      console.error('Failed to fetch domain status:', err);
      setError('Failed to check domain status');
      
      const defaultStatus: DomainVerificationStatus = {
        hasCustomDomain: false,
        domainVerified: true,
        lastChecked: new Date().toISOString()
      };
      setStatus(defaultStatus);
      onStatusChange?.(defaultStatus);
    } finally {
      setLoading(false);
    }
  }, [projectId, onStatusChange]);

  const verifyDomain = useCallback(async () => {
    if (!status?.hasCustomDomain || isVerifying) return;
    
    try {
      setIsVerifying(true);
      setError(null);
      
      const response = await api.verifyProjectDomain(projectId);
      
      if (response.success && response.data) {
        const updatedStatus: DomainVerificationStatus = {
          ...status,
          domainVerified: response.data.verified,
          lastChecked: new Date().toISOString(),
          verificationDetails: response.data.details
        };
        
        setStatus(updatedStatus);
        onStatusChange?.(updatedStatus);
        
        return {
          success: true,
          verified: response.data.verified,
          message: response.data.message
        };
      } else {
        setError(response.message || 'Verification failed');
        return {
          success: false,
          verified: false,
          message: response.message || 'Verification failed'
        };
      }
    } catch (err) {
      console.error('Domain verification failed:', err);
      setError('Verification request failed');
      return {
        success: false,
        verified: false,
        message: 'Verification request failed'
      };
    } finally {
      setIsVerifying(false);
    }
  }, [projectId, status, isVerifying, onStatusChange]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh || !status?.hasCustomDomain || status?.domainVerified) {
      return;
    }

    const interval = setInterval(() => {
      fetchStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, status, fetchStatus]);

  useEffect(() => {
    return () => {
    };
  }, []);

  return {
    status,
    loading,
    error,
    isVerifying,
    verifyDomain,
    refresh,
    needsVerification: status?.hasCustomDomain && !status?.domainVerified,
    isRestricted: status?.hasCustomDomain && !status?.domainVerified,
    canAccessFeatures: !status?.hasCustomDomain || status?.domainVerified
  };
}

export type { DomainVerificationStatus, UseDomainVerificationOptions };
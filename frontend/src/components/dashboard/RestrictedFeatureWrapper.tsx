'use client';

import { ReactNode } from 'react';
import { useDomainVerification } from '@/hooks/useDomainVerification';

interface RestrictedFeatureWrapperProps {
  projectId: string;
  featureName: string;
  children: ReactNode;
  className?: string;
}

export default function RestrictedFeatureWrapper({
  projectId,
  featureName,
  children,
  className = ""
}: RestrictedFeatureWrapperProps) {
  const { status, loading, canAccessFeatures } = useDomainVerification({
    projectId,
    autoRefresh: true,
    refreshInterval: 30000
  });

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (canAccessFeatures) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-red-900/20 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="bg-amber-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-amber-500/20">
            <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            {featureName} Temporarily Restricted
          </h3>
          <div className="space-y-4 text-zinc-300 mb-8">
            <p className="text-lg">
              Your custom domain <span className="text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">{status?.customDomain}</span> needs to be verified before you can access {featureName.toLowerCase()}.
            </p>
            <p className="text-sm">
              This restriction ensures that all project features work correctly with your custom domain configuration.
            </p>
          </div>
          <div className="bg-black/40 rounded-xl p-6 border border-amber-500/20 mb-8">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Domain Verification Required
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Custom Domain:</span>
                <span className="text-white font-mono">{status?.customDomain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Status:</span>
                <span className="flex items-center space-x-1 text-amber-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Pending Verification</span>
                </span>
              </div>
              {status?.lastChecked && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Last Checked:</span>
                  <span className="text-zinc-300 text-xs">
                    {new Date(status.lastChecked).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/20 mb-8">
            <h4 className="text-lg font-semibold text-white mb-4">Next Steps</h4>
            <ol className="text-left space-y-3 text-sm text-zinc-300">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Go to <strong className="text-white">Project Settings</strong> and navigate to the <strong className="text-white">Custom Domain</strong> section</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Follow the DNS configuration instructions to point your domain to DevLogr</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Click <strong className="text-white">Verify Domain</strong> once DNS changes have propagated</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Return here once verification is complete to access all features</span>
              </li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = `${window.location.origin}/dashboard/projects/${projectId}?tab=settings`}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Go to Domain Settings
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 border border-white/20 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Refresh Status
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-amber-500/20">
            <p className="text-xs text-zinc-500">
              💡 <strong>Tip:</strong> DNS changes can take up to 24 hours to propagate. If you&apos;ve just updated your DNS records, please wait a few minutes before trying to verify.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import ParticleField from '@/components/shared/ui/ParticleField';

export default function AuthPage() {
  const handleSocialLogin = (provider: 'google' | 'github') => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/oauth?provider=${provider}&action=auth`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <ParticleField />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10"></div>
      
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="mb-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to DevLogr</span>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-700/50 p-8 shadow-2xl">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-3">
              Welcome to DevLogr
            </h1>
            <p className="text-zinc-400 text-lg">
              Sign in with your social account to start your development journey
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center space-x-4 bg-gradient-to-r from-white/5 to-white/10 border border-zinc-600/50 rounded-2xl py-4 px-6 text-white hover:from-white/10 hover:to-white/15 hover:border-zinc-500/50 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-lg font-semibold">Continue with Google</span>
            </button>

            <button 
              onClick={() => handleSocialLogin('github')}
              className="w-full flex items-center justify-center space-x-4 bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-zinc-600/50 rounded-2xl py-4 px-6 text-white hover:from-gray-800/60 hover:to-gray-700/60 hover:border-zinc-500/50 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-lg font-semibold">Continue with GitHub</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 
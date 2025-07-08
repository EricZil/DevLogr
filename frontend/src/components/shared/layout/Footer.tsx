import AnimatedWaves from '@/components/shared/ui/AnimatedWaves';
import SocialOrbs from '@/components/shared/ui/SocialOrbs';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <AnimatedWaves />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
      <div className="relative z-10 py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="mb-8">
              <span className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                DevLogr
              </span>
              <p className="text-xl text-zinc-300 mt-4 max-w-2xl mx-auto">
                The future of developer progress tracking. Built by developers, for developers.
              </p>
            </div>
            
            <SocialOrbs />
          </div>
          
          <div className="text-center mb-16">
            <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-white mb-4">Track Our Progress</h3>
              <p className="text-zinc-300 mb-6 max-w-2xl mx-auto">
                DevLogr is eating its own dog food! Follow the development of this platform in real-time on our public project page.
              </p>
              <a 
                href="https://devlogr.devlogr.space/" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                <span>View DevLogr Project</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
          <div className="border-t border-zinc-800/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
              <div className="text-zinc-500 mb-4 md:mb-0">
                <p>&copy; 2025 DevLogr. Built with ❤️ for Summer of Making 2025.</p>
                <p className="text-sm mt-1">Empowering developers worldwide</p>
              </div>
              <div className="flex space-x-6 text-zinc-400">
                <a 
                  href="https://github.com/EricZil/DevLogr" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Open Source</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />
    </footer>
  );
} 
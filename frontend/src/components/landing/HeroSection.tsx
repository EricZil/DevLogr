import ParticleField from '@/components/shared/ui/ParticleField';
import TypingEffect from '@/components/shared/ui/TypingEffect';
import AnimatedMockup from '@/components/shared/ui/AnimatedMockup';

export default function HeroSection() {
  const typingWords = ['DevLogs', 'Progress', 'Projects', 'Journey', 'Dreams'];

  return (
    <section className="relative pt-20 pb-20 px-2 lg:px-4 overflow-hidden min-h-screen flex items-center">
      <ParticleField />

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10"></div>
      <div className="relative max-w-[95vw] mx-auto z-10 w-full px-4 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-32 items-center">
          <div className="space-y-8 lg:pr-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Share Your{" "}
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                <TypingEffect words={typingWords} />
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-zinc-300 leading-relaxed">
              Create beautiful public project pages, track your progress, and inspire other developers with your journey.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/auth" 
                className="bg-gradient-to-r from-white via-zinc-100 to-zinc-200 text-black px-8 py-4 rounded-xl font-semibold text-lg hover:from-zinc-100 hover:to-zinc-300 transition-all duration-300 hover:scale-105 shadow-2xl text-center"
              >
                Start Your DevLog
              </a>
              <a 
                href="https://devlogr.devlogr.space/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="border border-zinc-600 bg-zinc-900/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:border-zinc-500 hover:bg-zinc-800/50 transition-all duration-300 hover:scale-105 shadow-xl text-center"
              >
                View Live Example
              </a>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
              <div className="flex items-center space-x-3 text-zinc-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Real-time updates</span>
              </div>
              <div className="flex items-center space-x-3 text-zinc-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Public showcase</span>
              </div>
              <div className="flex items-center space-x-3 text-zinc-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Progress tracking</span>
              </div>
              <div className="flex items-center space-x-3 text-zinc-300">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Developer community</span>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-8">
            <div className="lg:scale-100 lg:origin-center">
              <AnimatedMockup />
            </div>
            
            <div className="absolute -top-4 -left-4 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-purple-500 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 -left-6 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" style={{ animationDelay: '2s' }}></div>
          </div>
          
        </div>
      </div>
    </section>
  );
} 
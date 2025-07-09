import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 dock-float">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-full px-8 py-4 shadow-2xl shadow-black/50 nav-glow hover:shadow-purple-500/20 transition-all duration-500">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              DevLogr
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a 
              href="#features" 
              className="text-zinc-300 hover:text-white transition-all duration-300 hover:scale-105 px-3 py-2 rounded-full hover:bg-zinc-800/50"
            >
              Features
            </a>
          </div>
          <div className="flex items-center space-x-3">
          <Link href="/auth">
            <button className="bg-gradient-to-r from-white to-zinc-200 text-black px-6 py-2 rounded-full font-medium hover:from-zinc-100 hover:to-zinc-300 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-white/20">
              Get Started
            </button>
              </Link>
          </div>
          <div className="md:hidden">
            <button className="text-zinc-300 hover:text-white transition-all duration-300 p-2 rounded-full hover:bg-zinc-800/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 
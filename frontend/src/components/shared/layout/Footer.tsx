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
          
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Features</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Pricing</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Templates</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Examples</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">About</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Blog</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Careers</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Documentation</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">API Reference</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Guides</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Community</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Help Center</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Contact</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Status</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex space-x-6 text-zinc-400 mb-4 md:mb-0">
                <a href="#" className="hover:text-white transition-all duration-300 hover:scale-105">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-all duration-300 hover:scale-105">Terms of Service</a>
                <a href="#" className="hover:text-white transition-all duration-300 hover:scale-105">Cookie Policy</a>
              </div>
              <div className="text-zinc-500 text-center md:text-right">
                <p>&copy; 2025 DevLogr. Built with ❤️ for Summer of Making 2025.</p>
                <p className="text-sm mt-1">Empowering developers worldwide</p>
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
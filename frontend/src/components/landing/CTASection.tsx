export default function CTASection() {
  return (
    <section className="relative py-20 px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/15 via-blue-900/10 to-transparent"></div>
      
      <div className="absolute top-10 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <div className="relative max-w-4xl mx-auto text-center z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Start Your{" "}
          <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            DevLog Journey?
          </span>
        </h2>
        <p className="text-xl text-zinc-300 mb-8">
          Join thousands of developers sharing their progress and building in public.
        </p>
        <button className="bg-gradient-to-r from-white via-zinc-100 to-zinc-200 text-black px-12 py-4 rounded-xl font-semibold text-lg hover:from-zinc-100 hover:to-zinc-300 transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/25">
          Create Your First Project
        </button>
      </div>
    </section>
  );
} 
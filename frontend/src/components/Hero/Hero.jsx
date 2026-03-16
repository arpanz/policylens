import { ArrowRight, FileText, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const StarField = () => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const newStars = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      animationDelay: `${Math.random() * 4}s`,
      opacity: Math.random() * 0.5 + 0.1
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden dark:block transition-opacity duration-1000">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-cyan-100 animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.animationDelay,
            opacity: star.opacity,
            boxShadow: `0 0 ${Math.random() * 4 + 2}px rgba(34, 211, 238, 0.8)`
          }}
        />
      ))}
    </div>
  );
};

export default function Hero({ onGetStarted }) {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
      
      {/* --- BACKGROUND ATMOSPHERE --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand-teal/5 dark:bg-transparent rounded-full blur-[120px] pointer-events-none transition-colors duration-700 z-0" />
      <StarField />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-cyan-500/0 dark:bg-cyan-500/10 rounded-[100%] blur-[150px] pointer-events-none transition-colors duration-1000 z-0" />
      <div className="absolute top-1/4 right-[-10%] w-[800px] h-[800px] bg-white/0 dark:bg-[#e0f2fe]/5 rounded-[100%] blur-[120px] pointer-events-none transition-colors duration-1000 z-0" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-transparent dark:from-[#1a1210]/40 to-transparent pointer-events-none z-0" />

      {/* --- CONTENT --- */}
      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* LEFT SIDE: Copy */}
        <div className="max-w-xl text-center lg:text-left z-20">
          <h1 className="text-6xl sm:text-7xl lg:text-[80px] font-bold leading-[1.05] tracking-tight mb-6 text-gray-900 dark:text-[#f0f9ff] transition-colors duration-400">
            One-click <br />
            for <span className="text-gray-400 dark:text-cyan-200/80">Policy</span> <br />
            Defense.
          </h1>
          
          <p className="font-nav text-lg font-light text-gray-600 dark:text-cyan-100/60 leading-relaxed mb-10 transition-colors duration-400 mx-auto lg:mx-0 max-w-md">
            Dive into automated document analysis, where innovative AI technology meets legal expertise. Get answers instantly.
          </p>

          <button 
            onClick={onGetStarted}
            className="bg-brand-teal hover:bg-brand-teal-hover dark:bg-[#e0f2fe] dark:hover:bg-white text-white dark:text-[#0c0908] font-bold px-8 py-3.5 rounded-full transition-all flex items-center justify-center gap-2.5 mx-auto lg:mx-0 shadow-lg shadow-brand-teal/20 dark:shadow-cyan-500/20"
          >
            Get Started 
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* RIGHT SIDE: Animated UI & FLOATING PDF DOCUMENTS */}
        <div className="relative h-[650px] flex items-center justify-center w-full">
          
          {/* Main Back Card */}
          <div className="absolute right-16 top-28 z-10 w-72 bg-white dark:bg-[#15100e]/80 backdrop-blur-md border border-gray-200 dark:border-cyan-900/30 rounded-3xl p-6 shadow-2xl animate-float-delayed transition-colors duration-400">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 rounded bg-brand-teal dark:bg-cyan-950 flex items-center justify-center text-white dark:text-cyan-400 text-xs font-bold">P</div>
               <div>
                 <div className="text-sm font-bold text-gray-900 dark:text-cyan-50">Compliance Check</div>
                 <div className="text-xs text-gray-500 dark:text-cyan-200/50">policy_v2.pdf</div>
               </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-cyan-200/50 mb-1">Total Risks Found</div>
            <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-cyan-100 mb-4">3 Warnings</div>
          </div>

          {/* Main Front Card */}
          <div className="absolute right-40 top-44 z-30 w-64 bg-brand-teal dark:bg-[#0c0908]/90 backdrop-blur-xl border border-transparent dark:border-cyan-800/40 rounded-3xl p-6 shadow-2xl dark:shadow-cyan-900/20 animate-float-smooth transition-colors duration-400">
             <div className="text-white/80 dark:text-cyan-200/60 text-xs mb-1">Status</div>
             <div className="text-white dark:text-cyan-50 text-xl font-bold mb-6">Scan Complete</div>
             
             <div className="space-y-3 mb-6">
                <div className="bg-white/10 dark:bg-cyan-900/30 p-2.5 rounded-lg border border-white/5 dark:border-cyan-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-white dark:text-cyan-100 text-xs font-semibold">Key Finding</span>
                  </div>
                  <p className="text-white/80 dark:text-cyan-100/70 text-[10px] leading-relaxed">
                    Termination clause extends to 90 days. standard is 30 days.
                  </p>
                </div>
                
                <div className="bg-white/10 dark:bg-cyan-900/30 p-2.5 rounded-lg border border-white/5 dark:border-cyan-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-white dark:text-cyan-100 text-xs font-semibold">Obligation</span>
                  </div>
                  <p className="text-white/80 dark:text-cyan-100/70 text-[10px] leading-relaxed">
                    Quarterly audits required starting Q3 2026.
                  </p>
                </div>
             </div>

             <div className="flex justify-between items-center border-t border-white/10 dark:border-cyan-900/40 pt-4 mt-2">
               <div className="text-white/90 dark:text-cyan-100/80 text-[11px] font-medium">Auto-Sync Insights</div>
               <div className="w-8 h-4 bg-white/30 dark:bg-cyan-700/50 rounded-full relative">
                 <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
               </div>
             </div>
          </div>

          {/* PDF 1: Top Left */}
          <div className="absolute left-0 top-10 z-20 w-44 bg-white/95 dark:bg-[#15100e]/95 backdrop-blur-md border border-gray-100 dark:border-cyan-900/30 p-4 rounded-2xl shadow-xl animate-float-fast transition-colors duration-400 transform -rotate-3">
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                  <FileText className="text-blue-500 dark:text-blue-400" size={16} />
                  <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Legal_v1.pdf</span>
               </div>
               <span className="text-[9px] font-medium text-blue-500 flex items-center gap-1">
                 <Loader size={10} className="animate-spin" />
                 Parsing...
               </span>
             </div>
             <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-blue-500 dark:bg-blue-400 rounded-full" />
                  </div>
                  <span className="text-[8px] text-gray-500">45%</span>
                </div>
                <div className="h-1 w-4/6 bg-gray-100 dark:bg-slate-800 rounded-full" />
             </div>
          </div>

          {/* PDF 2: Far Right Edge */}
          <div className="absolute right-[-10px] top-1/4 z-0 w-36 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md border border-gray-100 dark:border-cyan-900/20 p-3 rounded-xl shadow-lg animate-float-slow transition-colors duration-400 transform rotate-6">
             <div className="flex justify-between items-center mb-2">
               <span className="text-[9px] font-bold text-gray-700 dark:text-cyan-100">Summary.pdf</span>
               <span className="text-[8px] text-brand-teal dark:text-cyan-500">Extracting...</span>
             </div>
             <div className="space-y-1.5 mt-2">
                <div className="text-[7px] text-gray-400 dark:text-gray-500">Locating key clauses</div>
                <div className="h-1 w-full bg-brand-teal/20 dark:bg-cyan-900/50 rounded-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full w-[70%] bg-brand-teal dark:bg-cyan-600 rounded-full" />
                </div>
             </div>
          </div>

          {/* PDF 3: Middle Left */}
          <div className="absolute left-[-90px] top-1/2 -translate-y-1/2 z-40 w-48 bg-white/95 dark:bg-[#15100e]/95 backdrop-blur-md border border-green-100 dark:border-green-900/30 p-4 rounded-2xl shadow-2xl animate-float-delayed transition-colors duration-400">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="text-green-500 dark:text-green-400" size={14} />
                  <span className="text-xs font-bold text-gray-900 dark:text-cyan-50">Contract_Final</span>
                </div>
                <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">Safe</span>
             </div>
             <div className="mt-3">
                <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1.5">No liabilities detected.</div>
                <div className="flex gap-1">
                  <div className="h-6 w-1/3 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-900/30 flex items-center justify-center text-[8px] text-green-600 dark:text-green-400 font-medium">Clear</div>
                  <div className="h-6 w-1/3 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-900/30 flex items-center justify-center text-[8px] text-green-600 dark:text-green-400 font-medium">Valid</div>
                  <div className="h-6 w-1/3 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-900/30 flex items-center justify-center text-[8px] text-green-600 dark:text-green-400 font-medium">Signed</div>
                </div>
             </div>
          </div>

          {/* PDF 4: Bottom Right */}
          <div className="absolute right-0 bottom-24 z-40 w-40 bg-white/95 dark:bg-[#120e0c]/95 backdrop-blur-md border border-red-100 dark:border-red-900/30 p-4 rounded-2xl shadow-xl animate-float-smooth transition-colors duration-400 transform -rotate-6">
             <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="text-red-500" size={14} />
                  <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Risk_Report</span>
                </div>
             </div>
             <div className="mt-2 space-y-1">
                <div className="text-[9px] text-red-500 font-medium">! Missing signatures</div>
                <div className="text-[9px] text-red-500 font-medium">! Clause 3.1 conflict</div>
             </div>
          </div>

          {/* PDF 5: Bottom Center/Left */}
          <div className="absolute left-1/4 bottom-10 z-20 w-40 bg-white/90 dark:bg-[#15100e]/90 backdrop-blur-md border border-gray-100 dark:border-cyan-900/30 p-3.5 rounded-xl shadow-lg animate-float-fast transition-colors duration-400 transform rotate-3">
            <div className="absolute inset-0 bg-white/50 dark:bg-[#15100e]/50 border border-gray-100 dark:border-cyan-900/30 rounded-xl transform -rotate-6 -z-10 translate-y-1 translate-x-1" />
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-1.5">
                 <FileText className="text-purple-500 dark:text-purple-400" size={12} />
                 <span className="text-[10px] font-bold text-gray-700 dark:text-cyan-100">NDA_Template</span>
               </div>
               <span className="text-[8px] text-purple-500 dark:text-purple-400 font-medium">Reviewing</span>
             </div>
             <div className="space-y-1.5">
               <div className="text-[8px] text-gray-600 dark:text-gray-400">Confidentiality terms</div>
               <div className="flex items-center gap-1.5">
                 <div className="h-1 flex-1 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                   <div className="h-full w-[60%] bg-purple-500 dark:bg-purple-400 rounded-full" />
                 </div>
                 <span className="text-[8px] text-gray-500">60%</span>
               </div>
             </div>
          </div>

          {/* PDF 6: Top Center */}
          <div className="absolute left-1/3 top-16 z-0 w-32 bg-white/60 dark:bg-[#15100e]/60 backdrop-blur-sm border border-gray-100 dark:border-cyan-900/20 p-3 rounded-lg shadow animate-float-smooth transition-colors duration-400 opacity-70">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">Index.pdf</span>
               <span className="text-[7px] text-gray-400">Draft</span>
             </div>
             <div className="space-y-1">
               <div className="text-[7px] text-gray-500 dark:text-gray-400">Table of Contents</div>
               <div className="h-0.5 w-full bg-gray-300 dark:bg-slate-600 rounded-full" />
               <div className="h-0.5 w-3/4 bg-gray-300 dark:bg-slate-600 rounded-full" />
               <div className="h-0.5 w-2/3 bg-gray-300 dark:bg-slate-600 rounded-full" />
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
import React, { useState, useEffect } from 'react';
import { Moon, Sun, X, Info, Mail } from 'lucide-react';
import logo from '../../assets/pla.png';
// Adding our custom fonts specifically for the modals
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap';

export default function Navbar({ isDark, toggleTheme, hideNavLinks }) {
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: FONT_LINK });
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  // Scrolls to the hero section; falls back to top if #hero not found
  const handleHomeClick = (e) => {
    e.preventDefault();
    const hero = document.getElementById('hero');
    if (hero) {
      hero.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveModal(null);
  };

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <nav className="w-full h-20 px-6 md:px-10 flex items-center justify-between bg-white dark:bg-[#0c0908] border-b border-gray-100 dark:border-[#231a15] transition-colors duration-300 z-40 relative">
        
        {/* LEFT: Logo */}
<div className="flex items-center gap-3 cursor-pointer z-10" onClick={handleHomeClick}>
  <img
    src={logo}
    alt="PolicyLens"
    className="h-8 w-auto object-contain rounded-lg"
  />
  <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-cyan-50">
    PolicyLens
  </span>
</div>


        {/* CENTER: Nav Links - Conditionally Rendered */}
        {!hideNavLinks && (
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-10 font-nav">
            <button 
              onClick={handleHomeClick}
              className="text-gray-500 dark:text-cyan-100/50 hover:text-brand-teal dark:hover:text-cyan-200 font-semibold text-[13px] tracking-[0.2em] uppercase transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => setActiveModal('about')}
              className="text-gray-500 dark:text-cyan-100/50 hover:text-brand-teal dark:hover:text-cyan-200 font-semibold text-[13px] tracking-[0.2em] uppercase transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => setActiveModal('contact')}
              className="text-gray-500 dark:text-cyan-100/50 hover:text-brand-teal dark:hover:text-cyan-200 font-semibold text-[13px] tracking-[0.2em] uppercase transition-colors"
            >
              Contact
            </button>
          </div>
        )}

        {/* RIGHT: Theme Toggle Button */}
        <div className="flex items-center gap-4 z-10">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1310] border border-gray-200 dark:border-[#2a1f1a] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

      </nav>

      {/* ── MODALS OVERLAY ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeModal}>
          
          {/* ABOUT MODAL */}
          {activeModal === 'about' && (
            <div 
              className="relative w-full max-w-md p-8 rounded-3xl border shadow-2xl bg-white dark:bg-[#15100d] border-gray-200 dark:border-[#2a1f1a] animate-[slideUp_0.3s_ease-out]"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={closeModal} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
                  <Info size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  About PolicyLens AI
                </h2>
              </div>
              
              <p className="leading-relaxed text-gray-600 dark:text-gray-300" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px' }}>
                PolicyLens is an advanced AI-powered legal document analyzer. Powered by IRIS, our proprietary engine, it scans complex contracts, NDAs, and policy documents to instantly identify high-risk clauses, indemnification liabilities, and unusual termination terms.
              </p>
            </div>
          )}

          {/* CONTACT MODAL */}
          {activeModal === 'contact' && (
            <div 
              className="relative w-full max-w-md p-8 rounded-3xl border shadow-2xl bg-white dark:bg-[#15100d] border-gray-200 dark:border-[#2a1f1a] animate-[slideUp_0.3s_ease-out]"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={closeModal} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <Mail size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Contact Us
                </h2>
              </div>
              
              <div className="flex flex-col gap-3">
                {[
                  { dept: 'General Inquiries', email: 'hello@policylens.ai' },
                  { dept: 'Enterprise Sales', email: 'sales@policylens.ai' },
                  { dept: 'Technical Support', email: 'support@policylens.ai' },
                  { dept: 'Legal Team', email: 'legal@policylens.ai' }
                ].map((contact, index) => (
                  <div key={index} className="flex flex-col p-3.5 rounded-xl border bg-gray-50 border-gray-100 dark:bg-[#1a1310] dark:border-[#2a1f1a]">
                    <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                      {contact.dept}
                    </span>
                    <a href={`mailto:${contact.email}`} className="font-medium text-brand-teal dark:text-cyan-400 hover:underline transition-all" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {contact.email}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Animation class for the modals */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
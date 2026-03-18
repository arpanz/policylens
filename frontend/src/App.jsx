import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Footer from "./components/Footer/Footer";
import Login from "./components/Auth/Login";
import UploadModal from "./components/Dashboard/UploadModal";
import Dboard from "./components/Dashboard/Dboard";
import Chatbot from "./components/Dashboard/Chatbot";

export default function App() {
  const [isDark,           setIsDark]           = useState(false);
  const [appState,         setAppState]         = useState('home');
  const [userName,         setUserName]         = useState('');
  const [initialPolicyId,  setInitialPolicyId]  = useState(null);

  useEffect(() => {
    console.log("Current App State:", appState);
  }, [appState]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navigateTo = (newState) => {
    window.history.pushState({ appState: newState }, '', `#${newState}`);
    setAppState(newState);
  };

  useEffect(() => {
    window.history.replaceState({ appState: 'home' }, '', '#home');
    const handlePopState = (e) => {
      const state = e.state?.appState || 'home';
      setAppState(state);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const handleUploadComplete = (_file, policyId) => {
    // UploadModal already completed the upload — store the policyId so Dboard
    // can call fetchSummary on mount, then navigate to dashboard.
    console.log("Upload finished! Routing to Dboard with policyId:", policyId);
    setInitialPolicyId(policyId);
    navigateTo('dboard');
  };

  // 1. DASHBOARD ROUTE
  if (appState === 'dboard' || appState === 'dashboard') {
    return (
      <Dboard
        isDark={isDark}
        toggleTheme={toggleTheme}
        userName={userName}
        initialPolicyId={initialPolicyId}
        onLogout={() => {
          setUserName('');
          setInitialPolicyId(null);
          navigateTo('home');
        }}
        onTriggerUpload={() => navigateTo('upload')}
        onOpenIris={() => navigateTo('chatbot')}
      />
    );
  }

  // 2. CHATBOT ROUTE
  if (appState === 'chatbot') {
    return (
      <div className="relative min-h-screen">
        <button
          onClick={() => navigateTo('dboard')}
          style={{
            position: 'absolute', top: '24px', left: '24px', zIndex: 50,
            padding: '10px 20px', borderRadius: '12px', fontWeight: 500, cursor: 'pointer',
            background: isDark ? '#1D1D24' : '#ffffff',
            color: isDark ? '#f0f9ff' : '#111827',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          ← Back to Dashboard
        </button>
        <Chatbot isDark={isDark} />
      </div>
    );
  }

  // 3. LOGIN ROUTE
  if (appState === 'login') {
    return (
      <Login
        onLoginSuccess={(user) => {
          setUserName(user?.name || '');
          navigateTo('dboard');
        }}
        onGoogleSuccess={(user) => {
          setUserName(user?.name || 'Google User');
          navigateTo('dboard');
        }}
        onSignupSuccess={(user) => {
          setUserName(user?.name || '');
          navigateTo('upload');
        }}
        onBack={() => navigateTo('home')}
      />
    );
  }

  // 4. HOME & UPLOAD ROUTES
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-[#0c0908] transition-colors duration-300">
      <Navbar
        isDark={isDark}
        toggleTheme={toggleTheme}
        hideNavLinks={appState !== 'home'}
        onHome={() => navigateTo('home')}
      />

      <main className="flex-grow flex flex-col relative pt-20">
        {appState === 'home' && (
          <Hero onGetStarted={() => navigateTo('login')} />
        )}
        {appState === 'upload' && (
          <UploadModal
            onUploadComplete={handleUploadComplete}
            onCancel={() => navigateTo('home')}
          />
        )}
      </main>

      {appState === 'home' && <Footer />}
    </div>
  );
}
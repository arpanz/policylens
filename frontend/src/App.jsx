import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Footer from "./components/Footer/Footer";
import Login from "./components/Auth/Login";
import UploadModal from "./components/Dashboard/UploadModal";
import Dboard from "./components/Dashboard/Dboard"; // This is the new dashboard
import Chatbot from "./components/Dashboard/Chatbot"; // This is the AI chat

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [appState, setAppState] = useState('home');
  const [uploadedFile, setUploadedFile] = useState(null);

  // Debugging: Watch state changes in your browser console
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

  const handleUploadComplete = (file) => {
    console.log("Upload finished! Routing to Dboard...");
    setUploadedFile(file);
    // Force the state to 'dboard'
    navigateTo('dboard'); 
  };

  // 1. DASHBOARD ROUTE (The new UI)
  if (appState === 'dboard' || appState === 'dashboard') {
    return (
      <Dboard
        file={uploadedFile}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onLogout={() => {
          setUploadedFile(null);
          navigateTo('home');
        }}
        onTriggerUpload={() => navigateTo('upload')}
        onOpenIris={() => navigateTo('chatbot')}
      />
    );
  }

  // 2. CHATBOT ROUTE (The IRIS chat)
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
        <Chatbot file={uploadedFile} isDark={isDark} />
      </div>
    );
  }

  // 3. LOGIN ROUTE
  if (appState === 'login') {
    return (
      <Login
        onLoginSuccess={() => navigateTo('upload')}
        onNavigateSignup={() => {}}
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

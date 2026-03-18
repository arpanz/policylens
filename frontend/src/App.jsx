import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Footer from "./components/Footer/Footer";
import Login from "./components/Auth/Login";
import UploadModal from "./components/Dashboard/UploadModal";
import Dboard from "./components/Dashboard/Dboard";
import Chatbot from "./components/Dashboard/Chatbot";
import { supabase } from "./supabaseClient";
import { isPersonalEmailAllowed, PERSONAL_EMAIL_ERROR } from "./utils/personalEmail";

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [appState, setAppState] = useState('home');
  const [userName, setUserName] = useState('');
  const [authError, setAuthError] = useState('');
  const [initialPolicyId, setInitialPolicyId] = useState(null);

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
    const redirectToLogin = () => {
      window.history.replaceState({ appState: 'login' }, '', '#login');
      setAppState('login');
    };

    const enforcePersonalEmailOnly = async (session) => {
      const email = session?.user?.email || session?.email || '';
      if (!email) return false;

      if (!isPersonalEmailAllowed(email)) {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        setUserName('');
        setAuthError(PERSONAL_EMAIL_ERROR);
        redirectToLogin();
        return true;
      }

      setAuthError('');
      return false;
    };

    const syncSession = async (session) => {
      const blocked = await enforcePersonalEmailOnly(session);
      if (blocked || !session?.user?.email) return;

      const nextName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email.split('@')[0];

      setUserName(nextName || '');
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    void supabase.auth.getSession().then(({ data }) => syncSession(data.session));

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const initialState = window.location.hash.replace('#', '') || 'home';
    window.history.replaceState({ appState: initialState }, '', `#${initialState}`);
    setAppState(initialState);
    const handlePopState = (e) => {
      const state = e.state?.appState || 'home';
      setAppState(state);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const handleUploadComplete = (policyId) => {
    // UploadModal already completed the upload — just navigate to dashboard.
    // We store the received policy_id so Dboard knows which policy to open automatically.
    console.log("Upload finished! Routing to Dboard with policy:", policyId);
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
        forcedError={authError}
        onLoginSuccess={(user) => {
          setAuthError('');
          setUserName(user?.name || '');
          navigateTo('dboard');
        }}
        onGoogleSuccess={(user) => {
          setAuthError('');
          setUserName(user?.name || 'Google User');
          navigateTo('dboard');
        }}
        onSignupSuccess={(user) => {
          setAuthError('');
          setUserName(user?.name || '');
          navigateTo('upload');
        }}
        onBack={() => {
          setAuthError('');
          navigateTo('home');
        }}
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

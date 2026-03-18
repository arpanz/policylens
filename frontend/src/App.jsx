import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Footer from "./components/Footer/Footer";
import Login from "./components/Auth/Login";
import UploadModal from "./components/Dashboard/UploadModal";
import Dboard from "./components/Dashboard/Dboard";
import Chatbot from "./components/Dashboard/Chatbot";
import { fetchApi } from "./api";
import { supabase } from "./supabaseClient";
import { isPersonalEmailAllowed, PERSONAL_EMAIL_ERROR } from "./utils/personalEmail";

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [appState, setAppState] = useState('home');
  const [userName, setUserName] = useState('');
  const [authError, setAuthError] = useState('');
  const [initialPolicyId, setInitialPolicyId] = useState(null);
  const [isAuthResolving, setIsAuthResolving] = useState(() => {
    const hash = window.location.hash || '';
    const hasOAuthFragment = hash.includes('access_token=') || hash.includes('refresh_token=');
    const hasOAuthIntent = localStorage.getItem('oauth_redirect_intent') === 'google';
    return hasOAuthFragment || hasOAuthIntent;
  });
  const lastOAuthSyncKey = useRef('');

  const getRouteFromHash = (rawHash) => {
    const knownRoutes = new Set(['home', 'login', 'upload', 'dboard', 'dashboard', 'chatbot']);
    if (!rawHash) return 'home';

    const hash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    const firstFragment = hash.split('#')[0];
    if (knownRoutes.has(firstFragment)) return firstFragment;

    if (hash.includes('access_token=')) return 'login';
    return 'home';
  };

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

    const redirectToDashboard = () => {
      window.history.replaceState({ appState: 'dboard' }, '', '#dboard');
      setAppState('dboard');
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

    const syncSession = async (session, event = 'INITIAL_SESSION') => {
      if (!session?.user?.email) {
        if (event === 'SIGNED_OUT') {
          lastOAuthSyncKey.current = '';
          setUserName('');
        }
        return;
      }

      const blocked = await enforcePersonalEmailOnly(session);
      if (blocked) return;

      const nextName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email.split('@')[0];

      try {
        const syncKey = `${session.user.id}:${session.access_token || ''}`;
        if (lastOAuthSyncKey.current !== syncKey) {
          const data = await fetchApi('/auth/google', {
            method: 'POST',
            body: {
              email: session.user.email,
              name: nextName,
            },
          });

          if (!data?.token) {
            throw new Error('No backend auth token received from OAuth login.');
          }

          localStorage.setItem('token', data.token);
          lastOAuthSyncKey.current = syncKey;
        }
      } catch (err) {
        console.error('OAuth session sync failed:', err);
        localStorage.removeItem('token');
        await supabase.auth.signOut();
        setUserName('');
        setAuthError('Google sign-in failed on server sync. Please try again.');
        redirectToLogin();
        return;
      }

      setUserName(nextName || '');

      const currentHash = window.location.hash || '';
      const currentState = getRouteFromHash(currentHash);
      const fromOAuthCallback = currentHash.includes('access_token=') || currentHash.includes('refresh_token=');
      const oauthIntent = localStorage.getItem('oauth_redirect_intent') === 'google';

      if (currentState === 'login' || fromOAuthCallback || oauthIntent) {
        localStorage.removeItem('oauth_redirect_intent');
        redirectToDashboard();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void syncSession(session, event).finally(() => {
        setIsAuthResolving(false);
      });
    });

    void supabase.auth.getSession()
      .then(({ data }) => syncSession(data.session))
      .finally(() => {
        setIsAuthResolving(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const hash = window.location.hash || '';
    const hasOAuthFragment = hash.includes('access_token=') || hash.includes('refresh_token=');
    const hasOAuthIntent = localStorage.getItem('oauth_redirect_intent') === 'google';
    const initialState = (hasOAuthFragment || hasOAuthIntent) ? 'login' : getRouteFromHash(hash);

    // Keep OAuth fragment untouched initially so Supabase can parse and persist session.
    if (!hasOAuthFragment && !hasOAuthIntent) {
      window.history.replaceState({ appState: initialState }, '', `#${initialState}`);
    }

    setAppState(initialState);

    const handlePopState = (e) => {
      const state = e.state?.appState || getRouteFromHash(window.location.hash || '');
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

  if (isAuthResolving) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark ? '#0c0908' : '#f9fafb',
          color: isDark ? '#ecfeff' : '#111827',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          letterSpacing: 0.2,
        }}
      >
        Completing sign-in...
      </div>
    );
  }

  // 1. DASHBOARD ROUTE
  if (appState === 'dboard' || appState === 'dashboard') {
    return (
      <Dboard
        isDark={isDark}
        toggleTheme={toggleTheme}
        userName={userName}
        initialPolicyId={initialPolicyId}
        onLogout={async () => {
          localStorage.removeItem('token');
          localStorage.removeItem('oauth_redirect_intent');
          lastOAuthSyncKey.current = '';
          setAuthError('');
          setUserName('');
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.error('Sign out error:', err);
          }
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
            onCancel={() => navigateTo('dboard')}
          />
        )}
      </main>

      {appState === 'home' && <Footer />}
    </div>
  );
}

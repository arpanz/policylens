// src/components/Dashboard/Dboard.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Clock, X, FileText, AlertTriangle, CheckCircle2,
  Shield, DollarSign, Calendar, Info, Trash2, Eye, FilePlus,
  Home, Aperture, Sun, Moon, Menu, BadgeCheck, Banknote,
  RefreshCw, Send, Loader2
} from 'lucide-react';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';

const KEYFRAMES = `
  @keyframes cb-slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cb-db { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
  @keyframes cb-pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .cb-db1{animation:cb-db 1.2s infinite 0ms}
  .cb-db2{animation:cb-db 1.2s infinite 150ms}
  .cb-db3{animation:cb-db 1.2s infinite 300ms}
  .cb-msg{animation:cb-slideUp .25s cubic-bezier(0.16,1,0.3,1)}
  .spin-anim{animation:spin 1s linear infinite}
  .fade-in{animation:fadeIn .3s cubic-bezier(0.16,1,0.3,1)}
  .skeleton{animation:shimmer 1.4s infinite linear; background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size:400px 100%;}
  .skeleton-dark{animation:shimmer 1.4s infinite linear; background:linear-gradient(90deg,#1a1310 25%,#231a15 50%,#1a1310 75%); background-size:400px 100%;}
  .cb-scrollbar::-webkit-scrollbar{width:5px}
  .cb-scrollbar::-webkit-scrollbar-thumb{border-radius:5px}
`;

const LIGHT = {
  pageBg:'#ffffff', cardBg:'#ffffff', cardBorder:'#e5e7eb',
  cardShadow:'0 12px 32px -4px rgba(0,0,0,.07)',
  t1:'#111827', t2:'#374151', t3:'#6b7280',
  acc:'#0d9488', accHover:'#0f766e',
  accGrad:'linear-gradient(135deg,#0d9488,#14b8a6)',
  headerBg:'#f9fafb', headerBorder:'#e5e7eb',
  msgAreaBg:'#ffffff',
  msgUserBg:'linear-gradient(135deg,#0d9488,#14b8a6)',
  msgUserShadow:'0 4px 14px rgba(13,148,136,.25)',
  msgUserText:'#ffffff', msgAiBg:'#f3f4f6', msgAiText:'#111827',
  inputBg:'#f9fafb', inputBorder:'#e5e7eb', inputFocus:'#0d9488', inputText:'#111827',
  sendActive:'linear-gradient(135deg,#0d9488,#14b8a6)', sendDisabled:'#e5e7eb',
  statusDot:'#10b981', statusGlow:'0 0 6px #10b981', onlineText:'#6b7280',
  scrollThumb:'#d1d5db',
  sidebarBg:'#f9fafb',
  navActiveBg:'rgba(13,148,136,0.1)', navActiveClr:'#0d9488', navActiveBrd:'rgba(13,148,136,0.2)',
  navHoverBg:'#f3f4f6', accBg:'rgba(13,148,136,0.07)',
  redBg:'rgba(239,68,68,0.07)',   redClr:'#dc2626', redBrd:'rgba(239,68,68,0.18)',
  greenBg:'rgba(16,185,129,0.07)', greenClr:'#059669', greenBrd:'rgba(16,185,129,0.18)',
  amberBg:'rgba(245,158,11,0.07)', amberClr:'#d97706', amberBrd:'rgba(245,158,11,0.18)',
  badgeBg:'rgba(13,148,136,0.09)', badgeClr:'#0d9488',
  divider:'#f3f4f6',
};

const DARK = {
  pageBg:'#0c0908', cardBg:'#15100d', cardBorder:'#2a1f1a',
  cardShadow:'0 12px 40px -4px rgba(0,0,0,.6)',
  t1:'#ecfeff', t2:'rgba(207,250,254,.7)', t3:'rgba(207,250,254,.4)',
  acc:'#22d3ee', accHover:'#67e8f9',
  accGrad:'linear-gradient(135deg,#0e7490,#22d3ee)',
  headerBg:'#080605', headerBorder:'#231a15',
  msgAreaBg:'#15100d',
  msgUserBg:'#e0f2fe',
  msgUserShadow:'0 4px 14px rgba(34,211,238,.15)',
  msgUserText:'#0c0908', msgAiBg:'#1a1310', msgAiText:'#ecfeff',
  inputBg:'#080605', inputBorder:'#231a15', inputFocus:'#22d3ee', inputText:'#ecfeff',
  sendActive:'#e0f2fe', sendDisabled:'#1a1310',
  statusDot:'#10b981', statusGlow:'0 0 6px rgba(16,185,129,.4)', onlineText:'rgba(207,250,254,.4)',
  scrollThumb:'#2a1f1a',
  sidebarBg:'#080605',
  navActiveBg:'rgba(34,211,238,0.08)', navActiveClr:'#22d3ee', navActiveBrd:'rgba(34,211,238,0.2)',
  navHoverBg:'rgba(255,255,255,0.03)', accBg:'rgba(34,211,238,0.07)',
  redBg:'rgba(239,68,68,0.07)',   redClr:'#f87171', redBrd:'rgba(239,68,68,0.18)',
  greenBg:'rgba(16,185,129,0.07)', greenClr:'#34d399', greenBrd:'rgba(16,185,129,0.18)',
  amberBg:'rgba(245,158,11,0.07)', amberClr:'#fbbf24', amberBrd:'rgba(245,158,11,0.18)',
  badgeBg:'rgba(34,211,238,0.08)', badgeClr:'#22d3ee',
  divider:'#1a1310',
};

import { fetchApi, streamApi } from '../../api';

export default function Dboard({ file, isDark: initDark = true }) {
  const [dark,           setDark]           = useState(initDark);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [activeTab,      setActiveTab]      = useState('home');
  const [history,        setHistory]        = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isDragging,     setIsDragging]     = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadPct,      setUploadPct]      = useState(0);
  const [chatOpen,       setChatOpen]       = useState(false);
  const [chatInput,      setChatInput]      = useState('');
  const [isTyping,       setIsTyping]       = useState(false);
  const [chatMessages,   setChatMessages]   = useState([
    {
      id: 1, sender: 'ai',
      text: file
        ? `Hello, I'm IRIS. I've processed "${file.name}". Ask me anything about its clauses, benefits, or exclusions.`
        : "Hello, I'm IRIS. Upload an insurance policy and I'll analyze every clause, benefit, and exclusion for you.",
    },
  ]);

  // ── Refs ──────────────────────────────────────────────────────────────────
  // ONE shared file input for both the upload zone click and the header button
  const fileInputRef    = useRef(null);
  const chatEnd         = useRef(null);
  const summaryPollRef  = useRef(null);
  const isProcessingRef = useRef(false); // guard against duplicate processFile calls

  const T    = dark ? DARK : LIGHT;
  const f    = { fontFamily: "'DM Sans', sans-serif" };
  const syne = { fontFamily: "'Syne', sans-serif" };
  const bbs  = { fontFamily: "'Bebas Neue', cursive" };
  const mono = { fontFamily: "'JetBrains Mono', monospace" };

  // ── Font / keyframes injection ────────────────────────────────────────────
  useEffect(() => {
    const link  = Object.assign(document.createElement('link'),  { rel: 'stylesheet', href: FONT_LINK });
    const style = Object.assign(document.createElement('style'), { textContent: KEYFRAMES });
    document.head.append(link, style);
    return () => { link.remove(); style.remove(); };
  }, []);

  // ── Clear summary poll on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => { if (summaryPollRef.current) clearInterval(summaryPollRef.current); };
  }, []);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // ── Load history on mount ─────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchApi('/policies');
      setHistory(data.map(item => ({
        id:          item.policy_id,
        filename:    item.filename,
        date:        new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        policy_type: 'Detected',
        insurer:     'PolicyLens AI',
        analysis:    null,
      })));
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    // If a file prop was passed (e.g. from a parent route), upload it once
    if (file) processFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Poll for summary (called after ingest is ready) ───────────────────────
  const pollForSummary = useCallback((policy_id) => {
    setSummaryLoading(true);
    setActiveTab('home');
    let attempts = 0;
    const MAX = 20; // 20 × 6s = 2 min max

    if (summaryPollRef.current) clearInterval(summaryPollRef.current);

    summaryPollRef.current = setInterval(async () => {
      attempts++;
      try {
        const data = await fetchApi(`/policies/${policy_id}/summary`);
        if (data && data.summary) {
          clearInterval(summaryPollRef.current);
          setSummaryLoading(false);
          setActiveAnalysis(data.summary);
          setHistory(h => h.map(x => x.id === policy_id ? { ...x, analysis: data.summary } : x));
        }
      } catch {
        // 404 = still generating, keep polling
        if (attempts >= MAX) {
          clearInterval(summaryPollRef.current);
          setSummaryLoading(false);
          console.error('Summary polling timed out for', policy_id);
        }
      }
    }, 6000);
  }, []);

  // ── Fetch summary once (for View button in history) ───────────────────────
  const fetchSummary = useCallback(async (policy_id) => {
    try {
      const data = await fetchApi(`/policies/${policy_id}/summary`);
      if (data && data.summary) {
        setActiveAnalysis(data.summary);
        setActiveTab('home');
        setHistory(h => h.map(x => x.id === policy_id ? { ...x, analysis: data.summary } : x));
      }
    } catch {
      // Not ready yet — start polling
      pollForSummary(policy_id);
    }
  }, [pollForSummary]);

  // ── Process / upload file ─────────────────────────────────────────────────
  // isProcessingRef prevents React StrictMode double-invoke and any other
  // accidental duplicate call from firing two real uploads.
  const processFile = useCallback(async (pickedFile) => {
    if (isProcessingRef.current) return; // GUARD: block duplicate calls
    isProcessingRef.current = true;

    // Reset the shared input so the same file can be picked again later
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    setUploadPct(5);

    try {
      const fd = new FormData();
      fd.append('file', pickedFile);
      const data = await fetchApi('/ingest/upload', { method: 'POST', body: fd });
      const pid = data.policy_id;
      setUploadPct(20);

      const poll = setInterval(async () => {
        try {
          const sData = await fetchApi(`/ingest/status/${pid}`);
          if (sData.progress !== undefined) setUploadPct(sData.progress);
          if (sData.status === 'ready') {
            clearInterval(poll);
            setUploadPct(100);
            setTimeout(() => {
              setUploading(false);
              isProcessingRef.current = false; // release guard after upload finishes
              loadHistory();
              pollForSummary(pid);
            }, 800);
          }
        } catch (e) {
          console.error('[POLL ERROR]', e);
        }
      }, 2000);

    } catch (err) {
      setUploading(false);
      isProcessingRef.current = false; // release on error too
      alert('Upload failed: ' + err.message);
    }
  }, [loadHistory, pollForSummary]);

  // ── Shared handler for the ONE file input's onChange ─────────────────────
  const handleFileInputChange = useCallback((e) => {
    const picked = e.target.files?.[0];
    if (picked) processFile(picked);
  }, [processFile]);

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragOver  = useCallback((e) => { e.preventDefault(); setIsDragging(true);  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop      = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const picked = e.dataTransfer.files?.[0];
    if (picked) processFile(picked);
  }, [processFile]);

  const viewPolicy = useCallback((item) => {
    if (item.analysis) {
      // Already cached locally — render immediately
      setActiveAnalysis(item.analysis);
      setActivePolicyId(item.id);
      setActiveTab('home');
      setChatMessagesMap(prev => {
        if (prev[item.id]) return prev;
        return { ...prev, [item.id]: [makeWelcomeMsg(item.filename)] };
      });
    } else {
      // Not cached — fetch summary from backend
      fetchSummary(item.id);
    }
  }, []);

  // ── Chat send ─────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || isTyping) return;
    const text = chatInput;
    setChatMessages(p => [...p, { id: Date.now(), sender: 'user', text }]);
    setChatInput('');
    setIsTyping(true);

    const pid = activeAnalysis?.policy_id ?? (history.length > 0 ? history[0].id : null);

    try {
      if (!pid) throw new Error('Please upload and analyze a policy first.');

      const aiMsgId = Date.now() + 1;
      setChatMessages(p => [...p, { id: aiMsgId, sender: 'ai', text: '' }]);

      await streamApi('/query/stream', {
        method: 'POST',
        body: { question: text, policy_id: pid },
      }, (token) => {
        setChatMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, text: m.text + token } : m
        ));
      });
    } catch (err) {
      setChatMessages(p => [...p, { id: Date.now() + 2, sender: 'ai', text: err.message || 'Failed to get response.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ════════════════════════ SUB-COMPONENTS ══════════════════════════════════

  const IrisAvatar = ({ size = 40 }) => (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.accGrad, boxShadow: T.msgUserShadow,
    }}>
      <Aperture size={Math.round(size * 0.48)} color={dark ? '#0c0908' : '#ffffff'} />
    </div>
  );

  const NavBtn = ({ id, icon: Icon, label }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 12, padding: sidebarOpen ? '10px 14px' : '10px',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          borderRadius: 12, cursor: 'pointer',
          border: `1px solid ${active ? T.navActiveBrd : 'transparent'}`,
          background: active ? T.navActiveBg : 'transparent',
          color: active ? T.navActiveClr : T.t3,
          ...f, fontSize: 14, fontWeight: 500, transition: 'all .2s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.navHoverBg; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon size={16} style={{ flexShrink: 0 }} />
        {sidebarOpen && <span>{label}</span>}
      </button>
    );
  };

  const Badge = ({ label, variant = 'acc' }) => {
    const map = {
      acc:   [T.badgeBg,  T.badgeClr],
      green: [T.greenBg,  T.greenClr],
      red:   [T.redBg,    T.redClr],
      amber: [T.amberBg,  T.amberClr],
    };
    const [bg, clr] = map[variant] || map.acc;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 10px', borderRadius: 20,
        ...mono, fontSize: 10, fontWeight: 600, background: bg, color: clr,
      }}>{label}</span>
    );
  };

  const InfoCard = ({ icon: Icon, label, value, variant = 'acc' }) => {
    const map = {
      acc:   [T.accBg,   T.acc],
      green: [T.greenBg, T.greenClr],
      amber: [T.amberBg, T.amberClr],
    };
    const [ibg, iclr] = map[variant] || map.acc;
    return (
      <div style={{ borderRadius: 16, padding: '18px 20px', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ibg }}>
            <Icon size={16} style={{ color: iclr }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.t3, margin: '0 0 6px 0' }}>{label}</p>
            <p style={{ ...f, fontSize: 13, lineHeight: 1.65, color: value ? T.t2 : T.t3, margin: 0, fontStyle: value ? 'normal' : 'italic' }}>
              {value || 'Not applicable'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── Skeleton loader ───────────────────────────────────────────────────────
  const SummarySkeleton = () => (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ borderRadius: 20, padding: '26px 30px', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className={dark ? 'skeleton-dark' : 'skeleton'} style={{ height: 42, width: 280, borderRadius: 8 }} />
          <div className={dark ? 'skeleton-dark' : 'skeleton'} style={{ height: 24, width: 80, borderRadius: 20 }} />
        </div>
        <div className={dark ? 'skeleton-dark' : 'skeleton'} style={{ height: 18, width: 200, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ borderRadius: 20, padding: '22px 24px', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
            <div className={dark ? 'skeleton-dark' : 'skeleton'} style={{ height: 14, width: 100, borderRadius: 6, marginBottom: 16 }} />
            {[0, 1, 2, 3].map(j => (
              <div key={j} className={dark ? 'skeleton-dark' : 'skeleton'} style={{ height: 13, width: `${85 - j * 8}%`, borderRadius: 6, marginBottom: 10 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ borderRadius: 16, padding: '18px 20px', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
            <div className={dark ? 'skeleton-dark' : 'skeleton'} style={{ height: 12, width: 80, borderRadius: 6, marginBottom: 10 }} />
            <div className={dark ? 'skeleton-dark' : 'skeleton'} style={{ height: 13, width: '90%', borderRadius: 6 }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <p style={{ ...mono, fontSize: 11, color: T.t3, margin: 0, letterSpacing: 1 }}>
          ⏳ IRIS is generating your policy summary… this takes ~30–40s
        </p>
      </div>
    </div>
  );

  // ── Upload Zone ───────────────────────────────────────────────────────────
  const UploadZone = () => (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFilePicker}
      style={{
        borderRadius: 20, padding: '52px 24px',
        border: `2px dashed ${isDragging ? T.acc : T.cardBorder}`,
        background: isDragging ? T.accBg : T.headerBg,
        cursor: 'pointer', transition: 'all .3s',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, textAlign: 'center',
      }}
    >
      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
          <div className="spin-anim" style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${T.cardBorder}`, borderTopColor: T.acc }} />
          <p style={{ ...syne, fontSize: 15, fontWeight: 600, color: T.t1, margin: 0 }}>Analyzing policy with IRIS…</p>
          <div style={{ width: '100%', maxWidth: 320, height: 4, borderRadius: 4, background: T.cardBorder }}>
            <div style={{ height: '100%', borderRadius: 4, background: T.accGrad, width: `${uploadPct}%`, transition: 'width .15s' }} />
          </div>
          <p style={{ ...mono, fontSize: 11, color: T.t3, margin: 0 }}>{uploadPct}% — Running ML pipeline</p>
        </div>
      ) : (
        <>
          <div style={{ width: 64, height: 64, borderRadius: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accBg, border: `1px solid ${T.cardBorder}` }}>
            <Upload size={28} style={{ color: T.acc }} />
          </div>
          <div>
            <p style={{ ...syne, fontSize: 16, fontWeight: 600, color: T.t1, margin: '0 0 4px 0' }}>Upload your insurance policy</p>
            <p style={{ ...f, fontSize: 13, color: T.t3, margin: 0 }}>Drag & drop or click to browse · PDF, DOC up to 20MB</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); openFilePicker(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 26px',
              borderRadius: 12, border: 'none', background: T.accGrad, cursor: 'pointer',
              color: dark ? '#0c0908' : '#ffffff',
              ...syne, fontSize: 14, fontWeight: 600, boxShadow: T.msgUserShadow, marginTop: 4,
            }}
          >
            <FilePlus size={16} /> Choose File
          </button>
        </>
      )}
    </div>
  );

  // ── Analysis renderer ─────────────────────────────────────────────────────
  const renderAnalysis = (a) => (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ borderRadius: 20, padding: '26px 30px', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ ...bbs, fontSize: 42, letterSpacing: 2, color: T.t1, margin: '0 0 6px 0', lineHeight: 1 }}>{a.policy_name}</h2>
            <p style={{ ...syne, fontSize: 15, fontWeight: 500, color: T.t2, margin: '0 0 4px 0' }}>{a.insurer}</p>
            {a.uin && <p style={{ ...mono, fontSize: 11, color: T.t3, margin: 0 }}>UIN: {a.uin}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge label={a.policy_type} variant="acc" />
            <Badge label="✓ Analyzed" variant="green" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ borderRadius: 20, padding: '22px 24px', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.greenBg }}>
              <CheckCircle2 size={15} style={{ color: T.greenClr }} />
            </div>
            <p style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.t3, margin: 0 }}>Key Benefits</p>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {a.key_benefits.map((b, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: T.greenClr, boxShadow: `0 0 6px ${T.greenClr}55` }} />
                <span style={{ ...f, fontSize: 13, color: T.t2, lineHeight: 1.5 }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ borderRadius: 20, padding: '22px 24px', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.redBg }}>
              <AlertTriangle size={15} style={{ color: T.redClr }} />
            </div>
            <p style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.t3, margin: 0 }}>Exclusions</p>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {a.exclusions.map((excl, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: T.redClr, boxShadow: `0 0 6px ${T.redClr}55` }} />
                <span style={{ ...f, fontSize: 13, color: T.t2, lineHeight: 1.5 }}>{excl}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <InfoCard icon={Shield}     label="Death Benefit"       value={a.death_benefit}    variant="acc"   />
        <InfoCard icon={BadgeCheck} label="Survival / Maturity" value={a.survival_benefit} variant="green" />
        <InfoCard icon={RefreshCw}  label="Surrender Value"     value={a.surrender_value}  variant="amber" />
        <InfoCard icon={Banknote}   label="Loan Facility"       value={a.loan_facility}    variant="acc"   />
        <InfoCard icon={Calendar}   label="Free Look Period"    value={a.free_look_period} variant="green" />
        <InfoCard icon={DollarSign} label="Tax Benefits"        value={a.tax_benefit}      variant="amber" />
      </div>

      <div style={{ borderRadius: 20, padding: '22px 24px', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.amberBg }}>
            <Info size={15} style={{ color: T.amberClr }} />
          </div>
          <p style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.t3, margin: 0 }}>Important Conditions</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {a.important_conditions.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12, background: T.amberBg, border: `1px solid ${T.amberBrd}` }}>
              <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: T.amberClr, flexShrink: 0, marginTop: 1 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ ...f, fontSize: 13, color: T.t2, lineHeight: 1.55 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── History renderer ──────────────────────────────────────────────────────
  const renderHistory = () => (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {history.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.t3, ...f }}>No documents analyzed yet.</div>
      )}
      {history.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderRadius: 18, background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accBg, border: `1px solid ${T.cardBorder}` }}>
            <FileText size={20} style={{ color: T.acc }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...syne, fontSize: 14, fontWeight: 600, color: T.t1, margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...mono, fontSize: 11, color: T.t3 }}>{item.date}</span>
              <span style={{ color: T.cardBorder }}>·</span>
              <Badge label={item.policy_type} variant="acc" />
              <span style={{ color: T.cardBorder }}>·</span>
              <span style={{ ...f, fontSize: 12, color: T.t3 }}>{item.insurer}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => viewPolicy(item)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, cursor:'pointer', border:`1px solid ${T.navActiveBrd}`, background:T.navActiveBg, color:T.navActiveClr, ...f, fontSize:12, fontWeight:500, transition:'all .2s' }}
            >
              <Eye size={13} /> View
            </button>
            <button
              onClick={() => setHistory(h => h.filter(x => x.id !== item.id))}
              style={{ width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${T.cardBorder}`, color: T.t3, transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.redClr; e.currentTarget.style.color = T.redClr; e.currentTarget.style.background = T.redBg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.color = T.t3; e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // ════════════════════════ MAIN RENDER ═════════════════════════════════════
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.pageBg, color: T.t1, ...f, transition: 'background .4s, color .4s' }}>

      {/*
        ONE shared hidden file input — both the upload zone and header button
        call openFilePicker() which triggers this single input. This eliminates
        the duplicate-upload bug caused by having two separate <input> elements.
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* ── SIDEBAR ── */}
      <aside style={{
        flexShrink: 0, display: 'flex', flexDirection: 'column',
        width: sidebarOpen ? 240 : 66,
        background: T.sidebarBg, borderRight: `1px solid ${T.headerBorder}`,
        transition: 'width .3s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px', borderBottom: `1px solid ${T.headerBorder}` }}>
          <IrisAvatar size={38} />
          {sidebarOpen && (
            <div>
              <p style={{ ...bbs, fontSize: 28, letterSpacing: 2, color: T.t1, margin: 0, lineHeight: 1 }}>IRIS</p>
              <p style={{ ...mono, fontSize: 9, color: T.t3, margin: '2px 0 0 0', letterSpacing: 1 }}>POLICY INTELLIGENCE</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              marginLeft: 'auto', width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: `1px solid ${T.cardBorder}`, color: T.t3,
              transition: 'all .2s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.acc; e.currentTarget.style.color = T.acc; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.color = T.t3; }}
          >
            <Menu size={14} />
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavBtn id="home"    icon={Home}  label="Dashboard" />
          <NavBtn id="history" icon={Clock} label="History" />
          {sidebarOpen && activeTab === 'history' && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.analysis) { setActiveAnalysis(item.analysis); setActiveTab('home'); }
                    else { fetchSummary(item.id); }
                  }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1px solid transparent', textAlign: 'left', transition: 'all .2s', width: '100%' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.navHoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <FileText size={13} style={{ color: T.t3, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ ...f, fontSize: 12, fontWeight: 500, color: T.t2, margin: '0 0 3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{item.filename}</p>
                    <p style={{ ...mono, fontSize: 10, color: T.t3, margin: 0 }}>{item.date}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: `1px solid ${T.headerBorder}` }}>
          <button
            onClick={() => setDark(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 12, padding: sidebarOpen ? '10px 14px' : '10px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              borderRadius: 12, cursor: 'pointer',
              background: T.cardBg, border: `1px solid ${T.cardBorder}`,
              color: T.t3, ...f, fontSize: 13, fontWeight: 500,
              boxShadow: T.cardShadow, transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.acc; e.currentTarget.style.color = T.acc; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.color = T.t3; e.currentTarget.style.transform = 'none'; }}
          >
            {dark
              ? <Sun  size={15} style={{ color: '#22d3ee', flexShrink: 0 }} />
              : <Moon size={15} style={{ color: T.acc,    flexShrink: 0 }} />
            }
            {sidebarOpen && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 28px', background: T.headerBg, borderBottom: `1px solid ${T.headerBorder}`, transition: 'background .4s, border-color .4s' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ ...syne, fontSize: 18, fontWeight: 700, color: T.t1, margin: 0 }}>
              {activeTab === 'home' ? 'Policy Analysis' : 'Analysis History'}
            </h1>
            <p style={{ ...mono, fontSize: 11, color: T.t3, margin: '3px 0 0 0' }}>
              {activeTab === 'home'
                ? summaryLoading ? 'Generating summary with IRIS…'
                  : activeAnalysis ? `Viewing: ${activeAnalysis.policy_name}`
                  : 'Upload a policy document to begin'
                : `${history.length} document${history.length !== 1 ? 's' : ''} analyzed`}
            </p>
          </div>
          {/* Header upload button — calls the SAME shared file picker */}
          <button
            onClick={openFilePicker}
            disabled={uploading || summaryLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, cursor: uploading || summaryLoading ? 'not-allowed' : 'pointer',
              background: uploading || summaryLoading ? T.sendDisabled : T.accGrad,
              border: 'none',
              color: dark ? '#0c0908' : '#ffffff',
              ...syne, fontSize: 13, fontWeight: 600, boxShadow: uploading || summaryLoading ? 'none' : T.msgUserShadow, transition: 'all .2s',
              opacity: uploading || summaryLoading ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!uploading && !summaryLoading) e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <FilePlus size={15} /> Upload Policy
          </button>
        </header>

        <div className="cb-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 24, background: T.pageBg, transition: 'background .4s' }}>
          {!activeAnalysis && !summaryLoading && <UploadZone />}

          {activeTab === 'home' && (
            summaryLoading
              ? <SummarySkeleton />
              : activeAnalysis
                ? renderAnalysis(activeAnalysis)
                : (
                  <div className="fade-in" style={{ borderRadius: 24, padding: '72px 24px', textAlign: 'center', background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accGrad, boxShadow: `0 0 40px ${dark ? 'rgba(34,211,238,.2)' : 'rgba(13,148,136,.2)'}` }}>
                      <Aperture size={38} color={dark ? '#0c0908' : '#ffffff'} />
                    </div>
                    <div>
                      <h2 style={{ ...bbs, fontSize: 48, letterSpacing: 2, color: T.t1, margin: '0 0 8px 0', lineHeight: 1 }}>READY TO ANALYZE</h2>
                      <p style={{ ...f, fontSize: 14, color: T.t3, margin: 0, maxWidth: 420 }}>
                        Upload an insurance policy document above. IRIS will extract and structure every clause, benefit, exclusion, and condition for you.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                      {['Policy Details', 'Key Benefits', 'Exclusions', 'Death Benefit', 'Tax & Loans', 'Important Conditions'].map(tag => (
                        <span key={tag} style={{ padding: '6px 14px', borderRadius: 20, background: T.accBg, border: `1px solid ${T.cardBorder}`, ...mono, fontSize: 11, color: T.acc, fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )
          )}
          {activeTab === 'history' && renderHistory()}
        </div>
      </div>

      {/* ── CHAT FAB ── */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 100,
            width: 58, height: 58, borderRadius: 18, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.accGrad,
            boxShadow: `${T.msgUserShadow}, 0 0 30px ${dark ? 'rgba(34,211,238,.3)' : 'rgba(13,148,136,.25)'}`,
            transition: 'transform .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          <Aperture size={26} color={dark ? '#0c0908' : '#ffffff'} />
        </button>
      )}

      {/* ── CHAT PANEL ── */}
      {chatOpen && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 100,
          width: 360, height: 500, display: 'flex', flexDirection: 'column',
          borderRadius: 24, overflow: 'hidden',
          background: T.cardBg, border: `1px solid ${T.cardBorder}`,
          boxShadow: `${T.cardShadow}, 0 0 40px ${dark ? 'rgba(34,211,238,.15)' : 'rgba(13,148,136,.15)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: T.headerBg, borderBottom: `1px solid ${T.headerBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IrisAvatar size={40} />
              <div>
                <p style={{ ...syne, margin: 0, fontSize: 15, fontWeight: 600, color: T.t1 }}>IRIS</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: T.statusDot, boxShadow: T.statusGlow, animation: 'cb-pulse 2s ease-in-out infinite' }} />
                  <span style={{ ...mono, fontSize: 10, color: T.onlineText, fontWeight: 500 }}>System Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              style={{ width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${T.cardBorder}`, color: T.t3, transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.redClr; e.currentTarget.style.color = T.redClr; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.color = T.t3; }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="cb-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, background: T.msgAreaBg }}>
            {chatMessages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className="cb-msg" style={{ display: 'flex', gap: 10, width: '100%', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
                  {!isUser && (
                    <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.msgAiBg, border: `1px solid ${T.cardBorder}` }}>
                      <Aperture size={15} style={{ color: T.acc }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '80%', padding: '12px 16px', fontSize: 13, lineHeight: 1.6,
                    borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    background: isUser ? T.msgUserBg : T.msgAiBg,
                    color: isUser ? T.msgUserText : T.msgAiText,
                    boxShadow: isUser ? T.msgUserShadow : 'none',
                    ...f, transition: 'background .4s, color .4s',
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="cb-msg" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.msgAiBg, border: `1px solid ${T.cardBorder}` }}>
                  <Loader2 size={14} style={{ color: T.acc, animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center', borderRadius: '4px 18px 18px 18px', background: T.msgAiBg }}>
                  <span className="cb-db1" style={{ width: 6, height: 6, borderRadius: '50%', background: T.acc, display: 'inline-block' }} />
                  <span className="cb-db2" style={{ width: 6, height: 6, borderRadius: '50%', background: T.acc, display: 'inline-block' }} />
                  <span className="cb-db3" style={{ width: 6, height: 6, borderRadius: '50%', background: T.acc, display: 'inline-block' }} />
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          <div style={{ padding: '14px 16px 18px', background: T.headerBg, borderTop: `1px solid ${T.headerBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, background: T.inputBg, border: `1px solid ${T.inputBorder}`, transition: 'border-color .2s' }}>
              <input
                type="text" value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendChat(); }}
                placeholder="Ask IRIS about this policy…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: T.inputText, ...f }}
                onFocus={e  => e.target.parentNode.style.borderColor = T.inputFocus}
                onBlur={e   => e.target.parentNode.style.borderColor = T.inputBorder}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || isTyping}
                style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: chatInput.trim() && !isTyping ? T.sendActive : T.sendDisabled,
                  color: dark ? '#0c0908' : '#ffffff',
                  opacity: chatInput.trim() && !isTyping ? 1 : 0.4,
                  boxShadow: chatInput.trim() && !isTyping ? T.msgUserShadow : 'none',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { if (chatInput.trim() && !isTyping) e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <Send size={15} />
              </button>
            </div>
            <p style={{ ...mono, marginTop: 10, textAlign: 'center', fontSize: 10, letterSpacing: 1, color: T.t3 }}>
              IRIS insights are for guidance · Not legal advice
            </p>
          </div>
        </div>
      )}

      <style>{`.cb-scrollbar::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; }`}</style>
    </div>
  );
}

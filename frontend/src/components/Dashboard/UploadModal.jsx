import { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud, FileText, X, ShieldCheck, HelpCircle,
  CheckCircle2, Loader, Cpu, Zap, Lock, Eye, Sun, Moon, AlertTriangle
} from 'lucide-react';
import { fetchApi } from '../../api';

/* ── fonts + keyframes ──────────────────────────────────── */
const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';

const KEYFRAMES = `
  @keyframes um-up    { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
  @keyframes um-scan  { 0%{top:-2px;opacity:0} 4%{opacity:1} 96%{opacity:1} 100%{top:100%;opacity:0} }
  @keyframes um-spin  { to{transform:rotate(360deg)} }
  @keyframes um-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes um-fadeR { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:none} }
  @keyframes um-shim  { 0%{transform:translateX(-120%)} 100%{transform:translateX(320%)} }
  @keyframes um-twinkle{ 0%,100%{opacity:.1;transform:scale(.7)} 50%{opacity:.9;transform:scale(1.3)} }
  @keyframes um-orbit { from{transform:rotate(0deg) translateX(180px) rotate(0deg)}   to{transform:rotate(360deg) translateX(180px) rotate(-360deg)} }
  @keyframes um-orbit2{ from{transform:rotate(120deg) translateX(240px) rotate(-120deg)} to{transform:rotate(480deg) translateX(240px) rotate(-480deg)} }
  @keyframes um-pulse { 0%,100%{opacity:.12;transform:scale(1)} 50%{opacity:.26;transform:scale(1.07)} }
  @keyframes um-sway  { 0%,100%{transform:rotate(-4deg) scale(1)} 50%{transform:rotate(4deg) scale(1.03)} }
  @keyframes um-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }

  .um-card  { animation: um-up   .44s cubic-bezier(.16,1,.3,1) forwards }
  .um-scan  { animation: um-scan 2.6s linear infinite }
  .um-spin  { animation: um-spin 1s  linear infinite }
  .um-float { animation: um-float 4s  ease-in-out infinite }
  .um-fadeR { animation: um-fadeR .3s ease forwards }
  .um-shake { animation: um-shake .4s ease forwards }
  .um-body::-webkit-scrollbar{display:none}
  .um-shim::after {
    content:'';position:absolute;inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);
    animation: um-shim 1.8s ease infinite;
  }
`;

const BARS = Array.from({ length: 44 }, (_, i) =>
  Math.max(5, Math.min(52,
    10 + Math.abs(Math.sin(i * 0.38 + 1.2) * 28) + Math.abs(Math.cos(i * 0.7) * 14)
  ))
);

const STARS = Array.from({ length: 88 }, (_, i) => ({
  x:     ((i * 137.508) % 100).toFixed(2),
  y:     ((i * 97.3)    % 100).toFixed(2),
  r:     (0.5 + (i % 4) * 0.45).toFixed(1),
  delay: ((i * 0.22)    % 3).toFixed(2),
  dur:   (2   + (i % 5) * 0.7).toFixed(1),
}));

const LIGHT = {
  pageBg:'#ffffff', cardBg:'#ffffff', leftPanelBg:'#f9fafb',
  leftBorder:'#e5e7eb', headerBorder:'#e5e7eb', footerBg:'#f9fafb', footerBorder:'#e5e7eb',
  dropZoneBg:'#f9fafb', dropZoneBorder:'#d1fae5', dropZoneDrag:'#ccfbf1', dropZoneDragBorder:'#0d9488',
  chipBg:'#ffffff', chipBorder:'#e5e7eb', stageBg:'#f9fafb', stageBorder:'#e5e7eb',
  stageActiveBg:'#f0fdfa', stageActiveBorder:'#99f6e4',
  cardShadow:'0 0 0 1px rgba(0,0,0,.05), 0 32px 80px rgba(0,0,0,.08)',
  topStrip:'linear-gradient(90deg,#0d9488,#14b8a6,#0d9488)',
  t1:'#111827', t2:'#6b7280', t3:'#9ca3af', t4:'rgba(209,213,219,.8)',
  acc:'#0d9488', acc2:'#14b8a6', accGrad:'linear-gradient(135deg,#0d9488,#14b8a6)',
  brandGrad:'linear-gradient(135deg,#0d9488,#14b8a6)',
  scanBeam:'linear-gradient(90deg,transparent,#0d9488,#5eead4,transparent)', scanGlow:'0 0 12px #0d9488',
  progressBg:'#ccfbf1', progressFill:'linear-gradient(90deg,#0d9488,#14b8a6)',
  pillBg:'rgba(204,251,241,.5)', pillBorder:'rgba(153,246,228,.8)', pillText:'#0f766e',
  pdfBg:'#fee2e2', pdfBorder:'#fecaca', pdfText:'#dc2626',
  toggleBg:'#f3f4f6', toggleBorder:'#e5e7eb', toggleColor:'#0d9488',
  clearBg:'#f9fafb', clearBorder:'#e5e7eb', clearText:'#6b7280', clearHover:'#f3f4f6',
  analyseGrad:'linear-gradient(135deg,#0d9488,#14b8a6)', analyseShadow:'0 6px 20px rgba(13,148,136,.3)', analyseText:'#ffffff',
  disabledBg:'#f3f4f6', disabledText:'#9ca3af',
  iconBg:'#f0fdfa', iconBorder:'#99f6e4', iconColor:'#0d9488',
  waveInactive:'#e5e7eb', waveGrad:'linear-gradient(to top,#0d9488,#5eead4)',
  fileText:'#111827', fileSub:'#9ca3af',
  doneBg:'#f0fdfa', doneBorder:'#99f6e4', doneText:'#0d9488',
  errorText:'#dc2626', errorBg:'#fee2e2',
};

const DARK = {
  pageBg:'#0c0908', cardBg:'#15100d', leftPanelBg:'#080605',
  leftBorder:'rgba(42,31,26,.9)', headerBorder:'rgba(42,31,26,.9)', footerBg:'rgba(8,6,5,.9)', footerBorder:'rgba(42,31,26,.9)',
  dropZoneBg:'rgba(34,211,238,.03)', dropZoneBorder:'rgba(34,211,238,.2)', dropZoneDrag:'rgba(34,211,238,.08)', dropZoneDragBorder:'#22d3ee',
  chipBg:'rgba(34,211,238,.06)', chipBorder:'rgba(42,31,26,.9)', stageBg:'rgba(34,211,238,.03)', stageBorder:'rgba(42,31,26,.9)',
  stageActiveBg:'rgba(34,211,238,.08)', stageActiveBorder:'rgba(34,211,238,.25)',
  cardShadow:'0 0 0 1px rgba(42,31,26,.9), 0 40px 120px rgba(0,0,0,.7)',
  topStrip:'linear-gradient(90deg,#0e7490,#22d3ee,#0e7490)',
  t1:'#ecfeff', t2:'rgba(207,250,254,.6)', t3:'rgba(207,250,254,.35)', t4:'rgba(34,211,238,.2)',
  acc:'#22d3ee', acc2:'#67e8f9', accGrad:'linear-gradient(135deg,#0e7490,#22d3ee)',
  brandGrad:'linear-gradient(135deg,#0e7490,#22d3ee)',
  scanBeam:'linear-gradient(90deg,transparent,#22d3ee,#67e8f9,transparent)', scanGlow:'0 0 14px #22d3ee',
  progressBg:'rgba(34,211,238,.1)', progressFill:'linear-gradient(90deg,#22d3ee,#0ea5e9)',
  pillBg:'rgba(21,94,117,.18)', pillBorder:'rgba(21,94,117,.4)', pillText:'#a5f3fc',
  pdfBg:'rgba(239,68,68,.1)', pdfBorder:'rgba(239,68,68,.25)', pdfText:'#fca5a5',
  toggleBg:'#1a1310', toggleBorder:'#2a1f1a', toggleColor:'#22d3ee',
  clearBg:'rgba(34,211,238,.07)', clearBorder:'rgba(42,31,26,.9)', clearText:'rgba(207,250,254,.6)', clearHover:'rgba(34,211,238,.14)',
  analyseGrad:'#e0f2fe', analyseShadow:'0 6px 24px rgba(34,211,238,.2)', analyseText:'#0c0908',
  disabledBg:'rgba(34,211,238,.06)', disabledText:'rgba(34,211,238,.25)',
  iconBg:'rgba(34,211,238,.08)', iconBorder:'rgba(42,31,26,.9)', iconColor:'#22d3ee',
  waveInactive:'rgba(34,211,238,.12)', waveGrad:'linear-gradient(to top,#22d3ee,#a5f3fc)',
  fileText:'#ecfeff', fileSub:'rgba(34,211,238,.45)',
  doneBg:'rgba(34,211,238,.1)', doneBorder:'rgba(34,211,238,.25)', doneText:'#22d3ee',
  errorText:'#fca5a5', errorBg:'rgba(239,68,68,.15)',
};

function Bracket({ corner, active, T }) {
  const t = corner.includes('top'), l = corner.includes('left');
  const s   = active ? 28 : 14;
  const col = active ? T.acc : T.t4;
  return (
    <div style={{
      position:'absolute', width:s, height:s,
      transition:'all .35s cubic-bezier(.16,1,.3,1)',
      [t ? 'top' : 'bottom']:10, [l ? 'left' : 'right']:10,
      borderTop:    t  ? `2px solid ${col}` : 'none',
      borderBottom: !t ? `2px solid ${col}` : 'none',
      borderLeft:   l  ? `2px solid ${col}` : 'none',
      borderRight:  !l ? `2px solid ${col}` : 'none',
    }} />
  );
}

const STAGES = [
  { icon: Cpu,  label: 'Parse'   },
  { icon: Eye,  label: 'Extract' },
  { icon: Zap,  label: 'Index'   },
  { icon: Lock, label: 'Secure'  },
];

/* ══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function UploadModal({ onUploadComplete, onCancel }) {
  const [drag,       setDrag]       = useState(false);
  const [file,       setFile]       = useState(null);
  const [status,     setStatus]     = useState('idle');
  const [error,      setError]      = useState('');
  const [pct,        setPct]        = useState(0);
  const [stage,      setStage]      = useState(-1);
  const [dark,       setDark]       = useState(false);
  const [backendMsg, setBackendMsg] = useState('');
  const [processedPid, setProcessedPid] = useState(null);

  const fileRef    = useRef(null);
  const dragCounter = useRef(0);
  const stageRef   = useRef(-1);

  // ── FIX 1: guard — prevents onUploadComplete firing more than once ──
  const completedRef = useRef(false);

  // ── FIX 2: stable ref to the latest onUploadComplete prop.
  //    Keeping this OUT of effect dependency arrays is what stops the
  //    triple-upload: App.jsx re-creates handleUploadComplete on every
  //    render, so putting onUploadComplete in deps re-fires the effect
  //    while pct===100 and status==='uploading' is still true. ──
  const onCompleteRef = useRef(onUploadComplete);
  useEffect(() => { onCompleteRef.current = onUploadComplete; }, [onUploadComplete]);

  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    const link  = document.createElement('link');
    link.rel    = 'stylesheet';
    link.href   = FONT_LINK;
    const style = document.createElement('style');
    style.textContent = KEYFRAMES;
    document.head.append(link, style);
    return () => { link.remove(); style.remove(); };
  }, []);

  // ── Upload + poll effect — only runs when status flips to 'uploading' ──
  useEffect(() => {
    if (status !== 'uploading') return;

    // Reset the guard so a fresh upload can complete
    completedRef.current = false;
    setPct(5); setStage(0); stageRef.current = 0;

    let pollId;

    const startUpload = async () => {
      try {
        // POST the file to the backend
        const fd = new FormData();
        fd.append('file', file);
        const data = await fetchApi('/ingest/upload', {
          method: 'POST',
          body: fd,
        });
        const pid = data.policy_id;
        setProcessedPid(pid);
        setPct(20);

        // Poll for processing status every 2 s
        pollId = setInterval(async () => {
          try {
            const sData = await fetchApi(`/ingest/status/${pid}`);
            console.log('[DEBUG] Poll status:', sData);

            if (sData.progress !== undefined) setPct(sData.progress);
            if (sData.message)                setBackendMsg(sData.message);

            // When the backend reports 'ready', push pct to 100 and let the
            // completion effect (below) take over — poll is done here.
            if (sData.status === 'ready') {
              clearInterval(pollId);
              setPct(100);
            }
          } catch (e) {
            console.error('[POLL ERROR]', e);
          }
        }, 2000);

      } catch (err) {
        setStatus('idle');
        setError('Upload failed: ' + err.message);
      }
    };

    startUpload();
    return () => { if (pollId) clearInterval(pollId); };
  }, [status]); // ← ONLY 'status' — file is accessed via closure, not a dep

  // ── Stage advancement + completion detector ──
  // onUploadComplete is intentionally absent from the dep array — we use
  // onCompleteRef instead so a new prop reference never re-fires this effect.
  useEffect(() => {
    if (pct >= 25 && stageRef.current < 1) { stageRef.current = 1; setStage(1); }
    if (pct >= 55 && stageRef.current < 2) { stageRef.current = 2; setStage(2); }
    if (pct >= 80 && stageRef.current < 3) { stageRef.current = 3; setStage(3); }

    if (pct >= 100 && status === 'uploading') {
      if (completedRef.current) return;   // ← FIX 3: skip if already fired
      completedRef.current = true;
      const t1 = setTimeout(() => {
        setStatus('done');
        setTimeout(() => onCompleteRef.current(processedPid), 800);
      }, 250);
      return () => clearTimeout(t1);
    }
  }, [pct, status, processedPid]); // ← onUploadComplete removed from deps

  const validateAndPick = useCallback((f) => {
    setError('');
    if (f.type !== 'application/pdf') {
      setError('Invalid file type. Please upload a PDF document.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50 MB.');
      return;
    }
    setFile(f); setStatus('idle'); setPct(0); setStage(-1);
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setDrag(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDrag(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(false); dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPick(e.dataTransfer.files[0]);
    }
  };

  // ── FIX 4: reset clears the guard so a re-upload works ──
  const reset = () => {
    setFile(null); setStatus('idle'); setPct(0);
    setStage(-1); setError(''); setBackendMsg('');
    completedRef.current = false;
  };

  const uploading = status === 'uploading';
  const done      = status === 'done';
  const hasFile   = !!file;

  const f     = { fontFamily:"'DM Sans', sans-serif" };
  const syne  = { fontFamily:"'Syne', sans-serif" };
  const bebas = { fontFamily:"'Bebas Neue', cursive" };
  const mono  = { fontFamily:"'JetBrains Mono', monospace" };

  const getProgressText = () => {
    if (backendMsg) return backendMsg;
    if (pct < 25)   return 'Parsing contract structure...';
    if (pct < 55)   return 'Extracting key entities & dates...';
    if (pct < 85)   return 'Running risk analysis models...';
    return 'Finalizing encryption...';
  };

  return (
    <div style={f}>
      {/* ══ FULL-SCREEN OVERLAY ══════════════════════════════ */}
      <div style={{
        position:'fixed', inset:0, zIndex:50,
        display:'flex', alignItems:'center', justifyContent:'center',
        overflow:'hidden', background:T.pageBg, transition:'background .5s ease',
      }}>

        {/* DARK BG */}
        {dark && (
          <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
              {STARS.map((s, i) => (
                <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#a5f3fc"
                  style={{ animation:`um-twinkle ${s.dur}s ease-in-out infinite`, animationDelay:`${s.delay}s`, opacity:.12 }}/>
              ))}
            </svg>
            <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%',
              top:'30%', left:'50%', transform:'translate(-50%,-50%)', filter:'blur(80px)',
              background:'radial-gradient(circle,rgba(34,211,238,.1) 0%,transparent 65%)',
              animation:'um-pulse 6s ease-in-out infinite' }}/>
            <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%',
              top:'-15%', left:'-10%', filter:'blur(90px)',
              background:'radial-gradient(circle,rgba(14,116,144,.12) 0%,transparent 65%)',
              animation:'um-pulse 8s ease-in-out infinite', animationDelay:'.8s' }}/>
            <div style={{ position:'absolute', width:420, height:420, borderRadius:'50%',
              bottom:'-12%', right:'-8%', filter:'blur(80px)',
              background:'radial-gradient(circle,rgba(34,211,238,.07) 0%,transparent 65%)',
              animation:'um-pulse 7s ease-in-out infinite', animationDelay:'2s' }}/>
            <div style={{ position:'absolute', top:'50%', left:'50%', width:0, height:0 }}>
              <div style={{ position:'absolute', width:5, height:5, borderRadius:'50%',
                background:'#22d3ee', boxShadow:'0 0 8px #22d3ee', marginLeft:-2.5, marginTop:-2.5,
                animation:'um-orbit 14s linear infinite', opacity:.6 }}/>
              <div style={{ position:'absolute', width:3, height:3, borderRadius:'50%',
                background:'#a5f3fc', boxShadow:'0 0 5px #a5f3fc', marginLeft:-1.5, marginTop:-1.5,
                animation:'um-orbit2 20s linear infinite', opacity:.4 }}/>
            </div>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.03 }}>
              <defs><pattern id="cg" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
                <path d="M56 0L0 0 0 56" fill="none" stroke="#22d3ee" strokeWidth=".6"/>
              </pattern></defs>
              <rect width="100%" height="100%" fill="url(#cg)"/>
            </svg>
          </div>
        )}

        {/* LIGHT BG */}
        {!dark && (
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
            <svg style={{ position:'absolute', top:'-5%', right:'-8%', width:380, height:380,
              animation:'um-sway 8s ease-in-out infinite', opacity:.1 }}>
              <ellipse cx="190" cy="190" rx="160" ry="72" fill="#14b8a6" transform="rotate(-28 190 190)"/>
              <ellipse cx="190" cy="190" rx="140" ry="56" fill="#0d9488" transform="rotate(14 190 190)"/>
              <ellipse cx="190" cy="190" rx="90"  ry="32" fill="#5eead4" transform="rotate(-5 190 190)"/>
            </svg>
            <svg style={{ position:'absolute', bottom:'-8%', left:'-5%', width:320, height:320,
              animation:'um-sway 10s ease-in-out infinite', animationDelay:'1.5s', opacity:.08 }}>
              <ellipse cx="160" cy="160" rx="130" ry="60" fill="#0d9488" transform="rotate(22 160 160)"/>
              <ellipse cx="160" cy="160" rx="80"  ry="35" fill="#14b8a6" transform="rotate(-10 160 160)"/>
            </svg>
            <svg style={{ position:'absolute', top:'30%', left:'-3%', width:200, height:200,
              animation:'um-sway 12s ease-in-out infinite', animationDelay:'3s', opacity:.06 }}>
              <ellipse cx="100" cy="100" rx="80" ry="38" fill="#14b8a6" transform="rotate(35 100 100)"/>
            </svg>
            <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%',
              top:'-20%', left:'-10%', filter:'blur(80px)',
              background:'radial-gradient(circle,rgba(94,234,212,.3) 0%,transparent 65%)',
              animation:'um-pulse 7s ease-in-out infinite' }}/>
            <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%',
              bottom:'-18%', right:'-8%', filter:'blur(80px)',
              background:'radial-gradient(circle,rgba(20,184,166,.25) 0%,transparent 65%)',
              animation:'um-pulse 9s ease-in-out infinite', animationDelay:'1.2s' }}/>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.05 }}>
              <defs><pattern id="gg" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#0d9488"/>
              </pattern></defs>
              <rect width="100%" height="100%" fill="url(#gg)"/>
            </svg>
          </div>
        )}

        {/* ══ CARD ═══════════════════════════════════════════ */}
        <div className="um-card" style={{
          position:'relative', zIndex:10, display:'flex', overflow:'hidden',
          width:'min(880px, calc(100vw - 20px))', maxHeight:'calc(100vh - 40px)', borderRadius:26,
          background:T.cardBg, border:`1px solid ${T.leftBorder}`,
          boxShadow:T.cardShadow, transition:'background .4s, border-color .4s, box-shadow .4s',
        }}>

          {/* LEFT PANEL */}
          <div style={{
            width:272, flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'space-between',
            padding:32, position:'relative', overflow:'hidden',
            background:T.leftPanelBg, borderRight:`1px solid ${T.leftBorder}`,
            transition:'background .4s, border-color .4s',
          }}>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:.06 }}>
              <defs><pattern id="lp" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r=".8" fill={T.acc}/>
              </pattern></defs>
              <rect width="100%" height="100%" fill="url(#lp)"/>
            </svg>

            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:T.brandGrad,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 4px 14px ${T.acc}44` }}>
                  <Cpu size={16} color="#fff"/>
                </div>
                <span style={{ ...syne, fontWeight:700, fontSize:19, letterSpacing:.5, color:T.t1 }}>
                  PolicyLens
                </span>
              </div>

              {[
                { icon: ShieldCheck, label:'End-to-end encrypted' },
                { icon: Zap,         label:'AI clause extraction' },
                { icon: Lock,        label:'Zero data retention'  },
                { icon: Eye,         label:'Risk score in seconds'},
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <div style={{ width:30, height:30, borderRadius:8, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background:T.iconBg, border:`1px solid ${T.iconBorder}`, transition:'background .4s' }}>
                    <Icon size={13} style={{ color:T.iconColor }}/>
                  </div>
                  <span style={{ ...f, fontSize:12, color:T.t2 }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ position:'relative', zIndex:1 }}>
              <p style={{ ...mono, fontSize:9, letterSpacing:3, color:T.t3, marginBottom:10 }}>DOC SIGNATURE</p>
              <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:56 }}>
                {BARS.map((h, i) => (
                  <div key={i} style={{
                    width:3, borderRadius:2,
                    height:`${hasFile ? h : 5}px`,
                    background: hasFile ? T.waveGrad : T.waveInactive,
                    transition:`height ${0.28 + i * 0.008}s cubic-bezier(.16,1,.3,1)`,
                  }}/>
                ))}
              </div>
              {hasFile && (
                <p className="um-fadeR" style={{ ...mono, marginTop:8, fontSize:10, color:T.acc, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {file.name.slice(0,24)}{file.name.length > 24 ? '…' : ''}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            <div style={{ height:3, background:T.topStrip, transition:'background .5s' }}/>

            <div style={{ padding:'28px 32px 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:`1px solid ${T.headerBorder}`, transition:'border-color .4s' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ ...syne, fontWeight:700, fontSize:10, letterSpacing:'1px', textTransform:'uppercase', padding:'4px 12px', borderRadius:99, background:T.pillBg, border:`1px solid ${T.pillBorder}`, color:T.pillText, transition:'all .4s' }}>
                    PolicyLens AI
                  </span>
                  <span style={{ ...mono, fontSize:10, letterSpacing:'1px', padding:'4px 10px', borderRadius:99, background:T.pdfBg, border:`1px solid ${T.pdfBorder}`, color:T.pdfText, transition:'all .4s' }}>
                    .PDF
                  </span>
                </div>
                <h2 style={{ ...bebas, fontSize:44, letterSpacing:2, color:T.t1, lineHeight:1, margin:0, transition:'color .4s' }}>
                  Upload Document
                </h2>
                <p style={{ ...f, marginTop:8, fontSize:14, color:T.t2, transition:'color .4s' }}>
                  Drop a contract or policy — AI extracts every clause in seconds.
                </p>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={() => setDark(v => !v)} style={{ width:36, height:36, borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:T.toggleBg, border:`1px solid ${T.toggleBorder}`, transition:'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='rotate(14deg) scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform='none'}>
                  {dark ? <Sun size={14} style={{ color:'#22d3ee' }}/> : <Moon size={14} style={{ color:T.acc }}/>}
                </button>
                <button onClick={onCancel} style={{ width:36, height:36, borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:T.clearBg, border:`1px solid ${T.clearBorder}`, color:T.t2, transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,.12)'; e.currentTarget.style.borderColor='rgba(239,68,68,.4)'; e.currentTarget.style.color='#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.background=T.clearBg; e.currentTarget.style.borderColor=T.clearBorder; e.currentTarget.style.color=T.t2; }}>
                  <X size={15}/>
                </button>
              </div>
            </div>

            <div className="um-body" style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', msOverflowStyle:'none', padding:'24px 32px', display:'flex', flexDirection:'column', gap:14 }}>

              {/* DROP ZONE */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && fileRef.current?.click()}
                style={{
                  position:'relative', height:210, borderRadius:20, overflow:'hidden',
                  cursor: file ? 'default' : 'pointer', transition:'all .3s',
                  background: drag ? T.dropZoneDrag : error ? T.errorBg : T.dropZoneBg,
                  border: drag
                    ? `2px solid ${T.dropZoneDragBorder}`
                    : error ? `2px solid ${T.errorText}`
                    : file ? `1px solid ${T.dropZoneBorder}`
                    : `2px dashed ${T.t4}`,
                }}
              >
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity: drag || hasFile ? .2 : .07, transition:'opacity .4s' }}>
                  <defs><pattern id="dz" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill={error ? T.errorText : T.acc}/>
                  </pattern></defs>
                  <rect width="100%" height="100%" fill="url(#dz)"/>
                </svg>

                {['top-left','top-right','bottom-left','bottom-right'].map(c => (
                  <Bracket key={c} corner={c} active={drag || hasFile} T={T}/>
                ))}

                {uploading && (
                  <div className="um-scan" style={{ position:'absolute', left:0, right:0, height:2, zIndex:20, pointerEvents:'none', background:T.scanBeam, boxShadow:T.scanGlow }}/>
                )}

                {/* empty / error */}
                {!file && (
                  <div className={error ? 'um-shake' : 'um-float'} style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, zIndex:10, pointerEvents:'none' }}>
                    <div style={{
                      width:56, height:56, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center',
                      background: error ? 'rgba(239,68,68,.1)' : drag ? T.brandGrad : T.iconBg,
                      border: drag ? 'none' : `1px solid ${error ? 'transparent' : T.iconBorder}`,
                      transform: drag ? 'scale(1.12)' : 'scale(1)',
                      boxShadow: drag ? `0 0 28px ${T.acc}55` : 'none', transition:'all .3s',
                    }}>
                      {error
                        ? <AlertTriangle size={26} style={{ color:T.errorText }}/>
                        : <UploadCloud   size={26} style={{ color: drag ? '#fff' : T.acc }}/>
                      }
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ ...syne, fontSize:16, fontWeight:600, color: error ? T.errorText : T.t1, margin:0, transition:'color .3s' }}>
                        {error ? 'Upload Failed' : drag ? 'Release to drop file' : 'Drag & drop your PDF here'}
                      </p>
                      <p style={{ ...f, fontSize:14, color: error ? T.errorText : T.t2, marginTop:4, opacity: error ? .8 : 1 }}>
                        {error ? error : (
                          <>or <span style={{ color:T.acc, textDecoration:'underline', textDecorationColor:`${T.acc}55`, cursor:'pointer', pointerEvents:'auto' }}>browse files</span> · max 50 MB</>
                        )}
                      </p>
                    </div>
                    {!error && (
                      <div style={{ display:'flex', gap:6 }}>
                        {['PDF/A','Scanned','Multi-page','Encrypted'].map(tag => (
                          <span key={tag} style={{ ...mono, fontSize:10, padding:'3px 10px', borderRadius:99, background:T.chipBg, border:`1px solid ${T.chipBorder}`, color:T.t2, transition:'all .4s' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* file loaded */}
                {file && (
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, zIndex:10, padding:'0 32px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, width:'100%', maxWidth:440 }}>
                      <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: done ? T.doneBg : 'rgba(239,68,68,.1)', border: done ? `1px solid ${T.doneBorder}` : '1px solid rgba(239,68,68,.25)', transition:'all .3s' }}>
                        {done ? <CheckCircle2 size={20} style={{ color:T.doneText }}/> : <FileText size={20} style={{ color:'#f87171' }}/>}
                      </div>
                      <div style={{ flex:1, overflow:'hidden' }}>
                        <p style={{ ...syne, fontSize:14, fontWeight:600, color:T.fileText, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {file.name}
                        </p>
                        <p style={{ ...mono, fontSize:11, color:T.fileSub, marginTop:3 }}>
                          {(file.size/1048576).toFixed(2)} MB · PDF
                        </p>
                      </div>
                      {status === 'idle' && (
                        <button onClick={e => { e.stopPropagation(); reset(); }} style={{ width:28, height:28, borderRadius:8, flexShrink:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:T.clearBg, border:`1px solid ${T.clearBorder}`, color:T.t2, transition:'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,.1)'; e.currentTarget.style.color='#f87171'; }}
                          onMouseLeave={e => { e.currentTarget.style.background=T.clearBg; e.currentTarget.style.color=T.t2; }}>
                          <X size={12}/>
                        </button>
                      )}
                    </div>

                    {uploading && (
                      <div style={{ width:'100%', maxWidth:440 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ ...f, fontSize:12, color:T.t2, display:'flex', alignItems:'center', gap:6 }}>
                            <Loader size={12} className="um-spin" style={{ color:T.acc }}/>
                            {getProgressText()}
                          </span>
                          <span style={{ ...mono, fontSize:11, color:T.acc }}>
                            {Math.min(100, Math.round(pct))}%
                          </span>
                        </div>
                        <div style={{ position:'relative', height:4, borderRadius:99, background:T.progressBg, overflow:'hidden' }}>
                          <div className="um-shim" style={{ position:'absolute', left:0, top:0, height:'100%', borderRadius:99, background:T.progressFill, width:`${pct}%`, transition:'width .08s linear' }}/>
                        </div>
                      </div>
                    )}

                    {done && (
                      <p className="um-fadeR" style={{ ...f, fontSize:13, fontWeight:500, color:T.doneText, display:'flex', alignItems:'center', gap:6 }}>
                        <CheckCircle2 size={14}/> Analysis complete — redirecting…
                      </p>
                    )}
                  </div>
                )}

                <input type="file" ref={fileRef} onChange={e => e.target.files[0] && validateAndPick(e.target.files[0])} accept="application/pdf" style={{ display:'none' }}/>
              </div>

              {/* STAGE INDICATORS */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {STAGES.map(({ icon: Icon, label }, i) => {
                  const active  = stage >= i;
                  const current = stage === i && uploading;
                  return (
                    <div key={label} style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'12px 8px', borderRadius:14, overflow:'hidden', transition:'all .35s', background: active ? T.stageActiveBg : T.stageBg, border:`1px solid ${active ? T.stageActiveBorder : T.stageBorder}` }}>
                      {current && (
                        <div style={{ position:'absolute', inset:0, borderRadius:14, background:`radial-gradient(circle at 50% 50%, ${T.acc}22 0%, transparent 70%)` }}/>
                      )}
                      <Icon size={14} style={{ color: active ? T.acc : T.t4, transition:'color .35s', zIndex:1 }}/>
                      <span style={{ ...mono, fontSize:10, fontWeight:500, letterSpacing:'1px', textTransform:'uppercase', color: active ? T.acc : T.t4, transition:'color .35s', zIndex:1 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 32px 24px', background:T.footerBg, borderTop:`1px solid ${T.footerBorder}`, transition:'background .4s, border-color .4s' }}>
              <div style={{ display:'flex', gap:20 }}>
                <span style={{ ...f, display:'flex', alignItems:'center', gap:6, fontSize:13, color:T.t2 }}>
                  <ShieldCheck size={14} style={{ color:T.acc }}/> Encrypted
                </span>
                <span style={{ ...f, display:'flex', alignItems:'center', gap:6, fontSize:13, color:T.t2, cursor:'pointer', transition:'color .15s' }}>
                  <HelpCircle size={14}/> Help
                </span>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={reset}
                  style={{ ...f, padding:'10px 20px', borderRadius:12, fontSize:14, fontWeight:500, cursor:'pointer', transition:'all .15s', background:T.clearBg, border:`1px solid ${T.clearBorder}`, color:T.clearText }}
                  onMouseEnter={e => e.currentTarget.style.background=T.clearHover}
                  onMouseLeave={e => e.currentTarget.style.background=T.clearBg}>
                  Clear
                </button>
                <button
                  onClick={() => file && status === 'idle' && setStatus('uploading')}
                  disabled={!file || status !== 'idle'}
                  style={{ ...f, padding:'10px 28px', borderRadius:12, fontSize:14, fontWeight:600, border:'none', transition:'all .2s', cursor: file && status === 'idle' ? 'pointer' : 'not-allowed', background: file && status === 'idle' ? T.analyseGrad : T.disabledBg, color: file && status === 'idle' ? T.analyseText : T.disabledText, boxShadow: file && status === 'idle' ? T.analyseShadow : 'none' }}
                  onMouseEnter={e => { if (file && status === 'idle') e.currentTarget.style.transform='translateY(-1px)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform='none'}>
                  {uploading ? 'Scanning…' : done ? 'Done ✓' : 'Analyse →'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
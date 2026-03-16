import { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, Sun, Moon, Cpu, Shield, Zap, Lock } from 'lucide-react';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';

const KEYFRAMES = `
  @keyframes lp-up    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes lp-left  { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:none} }
  @keyframes lp-glow  { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.7;transform:scale(1.06)} }
  @keyframes lp-sway  { 0%,100%{transform:rotate(-3deg) scale(1)} 50%{transform:rotate(3deg) scale(1.02)} }
  @keyframes lp-twinkle{ 0%,100%{opacity:.1;transform:scale(.7)} 50%{opacity:.85;transform:scale(1.3)} }
  @keyframes lp-orbit { from{transform:rotate(0deg) translateX(160px) rotate(0deg)} to{transform:rotate(360deg) translateX(160px) rotate(-360deg)} }
  @keyframes lp-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes lp-spin  { to{transform:rotate(360deg)} }
  @keyframes lp-pulse { 0%,100%{box-shadow:0 0 0 0 currentColor} 50%{box-shadow:0 0 0 4px transparent} }

  .lp-form   { animation: lp-up   .5s cubic-bezier(.16,1,.3,1) forwards }
  .lp-panel  { animation: lp-left .5s cubic-bezier(.16,1,.3,1) forwards }
  .lp-shake  { animation: lp-shake .4s ease }
  .lp-spin   { animation: lp-spin 1s linear infinite }
`;

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x:  ((i * 137.508) % 100).toFixed(2),
  y:  ((i * 97.3)    % 100).toFixed(2),
  r:  (0.5 + (i % 4) * 0.45).toFixed(1),
  d:  ((i * 0.22)    %  3  ).toFixed(2),
  t:  (2   + (i % 5) * 0.7 ).toFixed(1),
}));

/* ── THEMES — matched to Hero.jsx palette ──────────────────── */
const LIGHT = {
  pageBg:      '#ffffff',
  panelBg:     '#111827',           /* dark panel for contrast, gray-900 matches hero light text */
  panelText:   '#f9fafb',
  panelSub:    'rgba(249,250,251,.5)',
  panelAccent: '#0d9488',           /* brand-teal */
  panelGrad:   'linear-gradient(135deg,#0d9488,#14b8a6)',

  cardBg:      '#ffffff',
  cardBorder:  'rgba(209,213,219,.6)',
  cardShadow:  '0 20px 60px rgba(0,0,0,.07)',

  t1:          '#111827',           /* gray-900 */
  t2:          '#6b7280',           /* gray-500 */
  t3:          '#9ca3af',           /* gray-400 */
  t4:          'rgba(209,213,219,.4)',

  acc:         '#0d9488',
  acc2:        '#14b8a6',
  accGrad:     'linear-gradient(135deg,#0d9488,#14b8a6)',
  pillBg:      'rgba(204,251,241,.5)',
  pillBorder:  'rgba(153,246,228,.8)',
  pillText:    '#0f766e',

  inputBg:     '#f9fafb',
  inputBorder: '#e5e7eb',           /* gray-200 */
  inputFocus:  '#0d9488',
  inputText:   '#111827',
  inputPH:     '#9ca3af',
  inputIcon:   '#9ca3af',

  labelColor:  '#6b7280',
  linkColor:   '#0d9488',

  btnBg:       'linear-gradient(135deg,#0d9488,#14b8a6)',
  btnShadow:   '0 6px 24px rgba(13,148,136,.3)',
  btnText:     '#ffffff',

  dividerBg:   'rgba(209,213,219,.6)',
  dividerText: '#9ca3af',

  socialBg:    '#f9fafb',
  socialBorder:'#e5e7eb',
  socialText:  '#6b7280',

  footerText:  '#d1d5db',
  toggleBg:    '#f3f4f6',
  toggleBorder:'#e5e7eb',

  errorBg:     '#fff5f5',
  errorBorder: '#fecaca',
  errorText:   '#dc2626',
};

const DARK = {
  pageBg:      '#0c0908',           /* hero dark navbar bg */
  panelBg:     '#080605',           /* hero dark footer bg */
  panelText:   '#ecfeff',           /* cyan-50 */
  panelSub:    'rgba(207,250,254,.45)',
  panelAccent: '#22d3ee',           /* cyan-400 */
  panelGrad:   'linear-gradient(135deg,#0e7490,#22d3ee)',

  cardBg:      '#15100d',           /* hero dark card/modal bg */
  cardBorder:  'rgba(21,94,117,.3)', /* cyan-900 */
  cardShadow:  '0 20px 60px rgba(0,0,0,.7)',

  t1:          '#ecfeff',           /* cyan-50 */
  t2:          'rgba(207,250,254,.6)',
  t3:          'rgba(207,250,254,.35)',
  t4:          'rgba(21,94,117,.2)',

  acc:         '#22d3ee',           /* cyan-400 */
  acc2:        '#a5f3fc',           /* cyan-200 */
  accGrad:     'linear-gradient(135deg,#0e7490,#22d3ee)',
  pillBg:      'rgba(21,94,117,.18)',
  pillBorder:  'rgba(21,94,117,.4)',
  pillText:    '#a5f3fc',

  inputBg:     '#080605',
  inputBorder: 'rgba(35,26,21,.8)',  /* hero dark border #231a15 */
  inputFocus:  '#22d3ee',
  inputText:   '#ecfeff',
  inputPH:     'rgba(207,250,254,.25)',
  inputIcon:   'rgba(34,211,238,.4)',

  labelColor:  '#a5f3fc',           /* cyan-200 */
  linkColor:   '#67e8f9',           /* cyan-300 */

  btnBg:       '#e0f2fe',           /* hero dark button bg */
  btnShadow:   '0 6px 24px rgba(34,211,238,.2)',
  btnText:     '#0c0908',           /* hero dark button text */

  dividerBg:   'rgba(35,26,21,.8)',
  dividerText: 'rgba(207,250,254,.35)',

  socialBg:    'rgba(21,94,117,.08)',
  socialBorder:'rgba(35,26,21,.8)',
  socialText:  '#a5f3fc',

  footerText:  'rgba(21,94,117,.5)',
  toggleBg:    '#1a1310',           /* hero dark button bg */
  toggleBorder:'#2a1f1a',           /* hero dark border */

  errorBg:     'rgba(239,68,68,.08)',
  errorBorder: 'rgba(239,68,68,.25)',
  errorText:   '#fca5a5',
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage({ onLoginSuccess, onNavigateSignup, onBack }) {
  const [dark,     setDark]     = useState(false);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [shake,    setShake]    = useState(false);
  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    const a = Object.assign(document.createElement('link'),  { rel:'stylesheet', href:FONT_LINK });
    const b = Object.assign(document.createElement('style'), { textContent:KEYFRAMES });
    document.head.append(a, b);
    return () => { a.remove(); b.remove(); };
  }, []);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim())    return triggerError('Please enter your email.');
    if (!password.trim()) return triggerError('Please enter your password.');
    setError('');
    setLoading(true);
    try {
      /* ── connect your backend here ──────────────────────────
         const res = await fetch('/api/auth/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email, password }),
         });
         if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
         const { token } = await res.json();
         localStorage.setItem('token', token);
      ─────────────────────────────────────────────────────── */
      await new Promise(r => setTimeout(r, 1400));
      onLoginSuccess?.({ email });
    } catch (err) {
      triggerError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const f     = { fontFamily:"'DM Sans',sans-serif" };
  const mono  = { fontFamily:"'JetBrains Mono',monospace" };
  const bebas = { fontFamily:"'Bebas Neue',cursive" };
  const syne  = { fontFamily:"'Syne',sans-serif" };

  return (
    <div style={{ ...f, minHeight:'100vh', background:T.pageBg, transition:'background .4s', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>

      {/* ── theme toggle (top right) ── */}
      <button onClick={() => setDark(v => !v)} style={{
        position:'fixed', top:20, right:20, zIndex:99,
        width:38, height:38, borderRadius:11, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        background:T.toggleBg, border:`1px solid ${T.toggleBorder}`,
        transition:'all .2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform='rotate(14deg) scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='none'; }}>
        {dark
          ? <Sun  size={15} style={{ color:'#22d3ee' }}/>
          : <Moon size={15} style={{ color:T.acc }}/>
        }
      </button>

      {/* ══ CARD ════════════════════════════════════════════════ */}
      <div style={{
        display:'flex', overflow:'hidden',
        width:'min(920px, 100%)', minHeight:580,
        borderRadius:28,
        background:T.cardBg, border:`1px solid ${T.cardBorder}`,
        boxShadow:T.cardShadow,
        transition:'background .4s, border-color .4s, box-shadow .4s',
      }}>

        {/* ── LEFT DECORATIVE PANEL ────────────────────────────── */}
        <div className="lp-panel" style={{
          width:380, flexShrink:0, position:'relative', overflow:'hidden',
          background: T.panelBg,
          display:'flex', flexDirection:'column', justifyContent:'space-between',
          padding:40,
        }}>

          {dark ? (
            /* DARK: Hero-style starfield + cyan glow */
            <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
                {STARS.map((s,i) => (
                  <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#a5f3fc"
                    style={{ animation:`lp-twinkle ${s.t}s ease-in-out infinite`, animationDelay:`${s.d}s`, opacity:.12 }}/>
                ))}
              </svg>
              {/* top cyan glow — matches hero dark atmosphere */}
              <div style={{ position:'absolute', width:480, height:480, borderRadius:'50%',
                top:'30%', left:'50%', transform:'translate(-50%,-50%)', filter:'blur(90px)',
                background:'radial-gradient(circle,rgba(34,211,238,.12) 0%,transparent 65%)',
                animation:'lp-glow 6s ease-in-out infinite' }}/>
              {/* orbiting dot */}
              <div style={{ position:'absolute', top:'50%', left:'50%', width:0, height:0 }}>
                <div style={{ position:'absolute', width:4, height:4, borderRadius:'50%',
                  background:'#22d3ee', boxShadow:'0 0 8px #22d3ee',
                  marginLeft:-2, marginTop:-2,
                  animation:'lp-orbit 14s linear infinite', opacity:.5 }}/>
              </div>
              {/* subtle grid */}
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.03 }}>
                <defs><pattern id="lpg" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M50 0L0 0 0 50" fill="none" stroke="#22d3ee" strokeWidth=".6"/>
                </pattern></defs>
                <rect width="100%" height="100%" fill="url(#lpg)"/>
              </svg>
            </div>
          ) : (
            /* LIGHT: Hero-style teal glow + dot grid */
            <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
              {/* teal leaf shapes */}
              <svg style={{ position:'absolute', top:'-8%', right:'-10%', width:280, height:280,
                animation:'lp-sway 8s ease-in-out infinite', opacity:.07 }}>
                <ellipse cx="140" cy="140" rx="120" ry="55" fill="#14b8a6" transform="rotate(-28 140 140)"/>
                <ellipse cx="140" cy="140" rx="90"  ry="38" fill="#0d9488" transform="rotate(12 140 140)"/>
              </svg>
              <svg style={{ position:'absolute', bottom:'-10%', left:'-8%', width:220, height:220,
                animation:'lp-sway 11s ease-in-out infinite', animationDelay:'2s', opacity:.06 }}>
                <ellipse cx="110" cy="110" rx="95" ry="42" fill="#14b8a6" transform="rotate(22 110 110)"/>
              </svg>
              {/* teal glow */}
              <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
                top:'50%', left:'50%', transform:'translate(-50%,-50%)', filter:'blur(80px)',
                background:'radial-gradient(circle,rgba(13,148,136,.12) 0%,transparent 65%)',
                animation:'lp-glow 7s ease-in-out infinite' }}/>
              {/* dot grid */}
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.06 }}>
                <defs><pattern id="lpd" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r=".9" fill="#0d9488"/>
                </pattern></defs>
                <rect width="100%" height="100%" fill="url(#lpd)"/>
              </svg>
            </div>
          )}

          {/* brand */}
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
              <div style={{ width:40, height:40, borderRadius:12,
                background:T.panelGrad, display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 4px 16px ${T.panelAccent}55` }}>
                <Cpu size={18} color="#fff"/>
              </div>
              <span style={{ ...bebas, fontSize:22, letterSpacing:3, color:T.panelText }}>PolicyLens</span>
            </div>

            <h2 style={{ ...bebas, fontSize:44, letterSpacing:2, lineHeight:1.05,
              color:T.panelText, margin:'0 0 16px' }}>
              Your Legal<br/>Intelligence<br/>Platform
            </h2>
            <p style={{ fontSize:13, lineHeight:1.7, color:T.panelSub, maxWidth:260 }}>
              Upload contracts and policies. Our AI scans every clause, flags every risk, and answers every question.
            </p>
          </div>

          {/* feature bullets */}
          <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { icon: Shield, text:'End-to-end encrypted analysis' },
              { icon: Zap,    text:'Risk detection in under 30 seconds' },
              { icon: Lock,   text:'Zero data retention policy' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: dark ? 'rgba(34,211,238,.1)' : 'rgba(13,148,136,.15)',
                  border:`1px solid ${dark ? 'rgba(34,211,238,.2)' : 'rgba(13,148,136,.25)'}` }}>
                  <Icon size={13} style={{ color:T.panelAccent }}/>
                </div>
                <span style={{ fontSize:12, color:T.panelSub }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: LOGIN FORM ─────────────────────────────────── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column',
          justifyContent:'center', padding:'48px 52px', position:'relative' }}>

          <div className="lp-form">

            {/* header */}
            <div style={{ marginBottom:36 }}>
              <span style={{
                ...mono, display:'inline-block', marginBottom:12,
                fontSize:9, letterSpacing:'3.5px', padding:'3px 12px', borderRadius:99,
                background:T.pillBg, border:`1px solid ${T.pillBorder}`, color:T.pillText,
              }}>SECURE LOGIN</span>
              <h1 style={{ ...bebas, fontSize:40, letterSpacing:2, lineHeight:1,
                color:T.t1, margin:'0 0 8px', transition:'color .4s' }}>
                Welcome Back
              </h1>
              <p style={{ fontSize:13, color:T.t2, margin:0 }}>
                Sign in to continue to your dashboard.
              </p>
            </div>

            {/* error */}
            {error && (
              <div className={shake ? 'lp-shake' : ''} style={{
                marginBottom:20, padding:'10px 14px', borderRadius:10, fontSize:12,
                background:T.errorBg, border:`1px solid ${T.errorBorder}`, color:T.errorText,
                display:'flex', alignItems:'center', gap:8,
              }}>
                <span style={{ fontSize:15 }}>⚠</span> {error}
              </div>
            )}

            {/* form */}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* email */}
              <div>
                <label style={{ ...f, display:'block', fontSize:11, fontWeight:500,
                  letterSpacing:1, marginBottom:6, color:T.labelColor, ...mono }}>
                  EMAIL ADDRESS
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" autoComplete="email"
                    style={{
                      ...f, width:'100%', fontSize:13, padding:'11px 14px',
                      borderRadius:12, outline:'none', boxSizing:'border-box',
                      background:T.inputBg, border:`1px solid ${T.inputBorder}`,
                      color:T.inputText, transition:'border-color .2s, background .4s',
                    }}
                    onFocus={e => e.target.style.borderColor=T.inputFocus}
                    onBlur={e  => e.target.style.borderColor=T.inputBorder}
                  />
                </div>
              </div>

              {/* password */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label style={{ ...f, display:'block', fontSize:11, fontWeight:500,
                    letterSpacing:1, color:T.labelColor, ...mono }}>
                    PASSWORD
                  </label>
                  <button type="button"
                    style={{ ...f, fontSize:11, color:T.linkColor, background:'none',
                      border:'none', cursor:'pointer', padding:0, transition:'opacity .15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity='.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" autoComplete="current-password"
                    style={{
                      ...f, width:'100%', fontSize:13, padding:'11px 44px 11px 14px',
                      borderRadius:12, outline:'none', boxSizing:'border-box',
                      background:T.inputBg, border:`1px solid ${T.inputBorder}`,
                      color:T.inputText, transition:'border-color .2s, background .4s',
                    }}
                    onFocus={e => e.target.style.borderColor=T.inputFocus}
                    onBlur={e  => e.target.style.borderColor=T.inputBorder}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', padding:0,
                      color:T.inputIcon, display:'flex', alignItems:'center' }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {/* remember me */}
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:-4 }}>
                <input type="checkbox" style={{ accentColor:T.acc, width:14, height:14 }}/>
                <span style={{ fontSize:12, color:T.t2 }}>Remember me for 30 days</span>
              </label>

              {/* submit */}
              <button type="submit" disabled={loading}
                style={{
                  ...syne, width:'100%', padding:'13px', borderRadius:13, border:'none',
                  fontSize:14, fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? T.t4 : T.btnBg,
                  color: T.btnText,
                  boxShadow: loading ? 'none' : T.btnShadow,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  transition:'all .2s', opacity: loading ? .7 : 1, marginTop:4,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => e.currentTarget.style.transform='none'}>
                {loading
                  ? <><span className="lp-spin" style={{ display:'inline-block', width:16, height:16,
                      border:`2px solid rgba(255,255,255,.3)`, borderTopColor:'#fff', borderRadius:'50%' }}/> Signing in…</>
                  : <>Sign In <ArrowRight size={15}/></>
                }
              </button>
            </form>

            {/* divider */}
            <div style={{ display:'flex', alignItems:'center', gap:12, margin:'22px 0' }}>
              <div style={{ flex:1, height:1, background:T.dividerBg }}/>
              <span style={{ ...mono, fontSize:10, letterSpacing:2, color:T.dividerText }}>OR</span>
              <div style={{ flex:1, height:1, background:T.dividerBg }}/>
            </div>

            {/* Google SSO */}
            <button type="button" style={{
              ...f, width:'100%', padding:'12px', borderRadius:13, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              background:T.socialBg, border:`1px solid ${T.socialBorder}`, color:T.socialText,
              fontSize:13, fontWeight:500, transition:'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=T.acc; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.socialBorder; e.currentTarget.style.transform='none'; }}>
              <GoogleIcon/> Continue with Google
            </button>

            {/* signup link */}
            <p style={{ marginTop:24, textAlign:'center', fontSize:12, color:T.t2 }}>
              Don't have an account?{' '}
              <button type="button" onClick={onNavigateSignup}
                style={{ ...f, fontSize:12, fontWeight:600, color:T.linkColor,
                  background:'none', border:'none', cursor:'pointer', padding:0 }}>
                Create one free →
              </button>
            </p>

            {/* footer */}
            <p style={{ ...mono, marginTop:20, textAlign:'center', fontSize:10,
              letterSpacing:.5, color:T.footerText }}>
              Secured by PolicyLens · v2.4.1 · SOC 2 Compliant
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
import {
  MessageSquare, Send, Download, User, Loader2,
  Sparkles, ShieldCheck, Sun, Moon, Aperture
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { streamApi } from '../../api';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';

const KEYFRAMES = `
  @keyframes cb-slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cb-db { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
  @keyframes cb-pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
  .cb-db1{animation:cb-db 1.2s infinite 0ms}
  .cb-db2{animation:cb-db 1.2s infinite 150ms}
  .cb-db3{animation:cb-db 1.2s infinite 300ms}
  .cb-msg{animation:cb-slideUp .25s cubic-bezier(0.16, 1, 0.3, 1)}
  .cb-scrollbar::-webkit-scrollbar{width:5px}
  .cb-scrollbar::-webkit-scrollbar-thumb{border-radius:5px}
  .cb-noscroll::-webkit-scrollbar{display:none}
`;

const LIGHT = {
  pageBg:         '#ffffff',
  cardBg:         '#ffffff',
  cardBorder:     '#e5e7eb',
  cardShadow:     '0 12px 32px -4px rgba(0,0,0,.07)',
  t1:             '#111827',
  t2:             '#374151',
  t3:             '#6b7280',
  acc:            '#0d9488',
  accHover:       '#0f766e',
  accGrad:        'linear-gradient(135deg,#0d9488,#14b8a6)',
  headerBg:       '#f9fafb',
  headerBorder:   '#e5e7eb',
  msgAreaBg:      '#ffffff',
  msgUserBg:      'linear-gradient(135deg,#0d9488,#14b8a6)',
  msgUserShadow:  '0 4px 14px rgba(13,148,136,.25)',
  msgUserText:    '#ffffff',
  msgAiBg:        '#f3f4f6',
  msgAiBorder:    'transparent',
  msgAiText:      '#111827',
  inputBg:        '#f9fafb',
  inputBorder:    '#e5e7eb',
  inputFocus:     '#0d9488',
  inputText:      '#111827',
  sendActive:     'linear-gradient(135deg,#0d9488,#14b8a6)',
  sendDisabled:   '#e5e7eb',
  statusDot:      '#10b981',
  statusGlow:     '0 0 6px #10b981',
  onlineText:     '#6b7280',
  scrollThumb:    '#d1d5db',
};

const DARK = {
  pageBg:         '#0c0908',
  cardBg:         '#15100d',
  cardBorder:     '#2a1f1a',
  cardShadow:     '0 12px 40px -4px rgba(0,0,0,.6)',
  t1:             '#ecfeff',
  t2:             'rgba(207,250,254,.7)',
  t3:             'rgba(207,250,254,.4)',
  acc:            '#22d3ee',
  accHover:       '#67e8f9',
  accGrad:        'linear-gradient(135deg,#0e7490,#22d3ee)',
  headerBg:       '#080605',
  headerBorder:   '#231a15',
  msgAreaBg:      '#15100d',
  msgUserBg:      '#e0f2fe',
  msgUserShadow:  '0 4px 14px rgba(34,211,238,.15)',
  msgUserText:    '#0c0908',
  msgAiBg:        '#1a1310',
  msgAiBorder:    'transparent',
  msgAiText:      '#ecfeff',
  inputBg:        '#080605',
  inputBorder:    '#231a15',
  inputFocus:     '#22d3ee',
  inputText:      '#ecfeff',
  sendActive:     '#e0f2fe',
  sendDisabled:   '#1a1310',
  statusDot:      '#10b981',
  statusGlow:     '0 0 6px rgba(16,185,129,.4)',
  onlineText:     'rgba(207,250,254,.4)',
  scrollThumb:    '#2a1f1a',
};

function MessageBubble({ msg, T }) {
  const isUser = msg.sender === 'user';
  return (
    <div className="cb-msg" style={{ display:'flex', gap:12, width:'100%', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <div style={{ width:36, height:36, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:T.msgAiBg, border:`1px solid ${T.cardBorder}` }}>
          <Aperture size={18} style={{ color:T.acc }}/>
        </div>
      )}
      <div style={{ maxWidth:'75%', padding:'14px 20px', fontSize:15, lineHeight:1.6, borderRadius: isUser ? '20px 4px 20px 20px' : '4px 20px 20px 20px', background: isUser ? T.msgUserBg : T.msgAiBg, color: isUser ? T.msgUserText : T.msgAiText, boxShadow: isUser ? T.msgUserShadow : 'none', fontFamily:"'DM Sans', sans-serif", fontWeight:400, transition:'background .4s, color .4s' }}>
        {msg.text}
      </div>
      {isUser && (
        <div style={{ width:36, height:36, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:T.msgAiBg, border:`1px solid ${T.cardBorder}` }}>
          <User size={18} style={{ color:T.t2 }}/>
        </div>
      )}
    </div>
  );
}

export default function Chatbot({ file, isDark: initDark }) {
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [dark,        setDark]        = useState(false);

  const [messages, setMessages] = useState([
    { id:1, sender:'ai', text: file
        ? `Hello, I'm IRIS. I've processed "${file.name}". I am ready to answer any questions regarding its clauses, liabilities, or summaries.`
        : "Hello, I'm IRIS. The document is processed, and I am ready to answer any questions regarding its clauses, liabilities, or summaries." },
  ]);

  const messagesEndRef = useRef(null);
  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    const link  = Object.assign(document.createElement('link'),  { rel:'stylesheet', href:FONT_LINK });
    const style = Object.assign(document.createElement('style'), { textContent:KEYFRAMES });
    document.head.append(link, style);
    return () => { link.remove(); style.remove(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const text = typeof e === 'string' ? e : chatMessage;
    if (!text.trim()) return;
    setMessages(p => [...p, { id:Date.now(), sender:'user', text }]);
    setChatMessage('');
    setIsTyping(true);
    const aiMsgId = Date.now() + 1;
    setMessages(p => [...p, { id: aiMsgId, sender: 'ai', text: '' }]);
    
    try {
      await streamApi('/query/stream', {
        method: 'POST',
        body: { question: text, policy_id: file?.policy_id || 'test' }
      }, (token) => {
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: m.text + token } : m
        ));
      });
    } catch (err) {
      setMessages(p => [...p, { id: Date.now() + 2, sender: 'ai', text: 'Error: ' + err.message }]);
    } finally {
      setIsTyping(false);
    }
  };

  /* ── Export chat log as .pdf ── */
  const handleExport = async () => {
    // Dynamically load jsPDF
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'pt', format:'a4' });

    const pageW   = doc.internal.pageSize.getWidth();
    const pageH   = doc.internal.pageSize.getHeight();
    const margin  = 48;
    const maxW    = pageW - margin * 2;
    let   y       = margin;

    const addPage = () => { doc.addPage(); y = margin; };
    const checkY  = (h) => { if (y + h > pageH - margin) addPage(); };

    // Header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pageW, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(17, 24, 39);
    doc.text('IRIS', margin, y + 28); y += 44;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Document: ${file?.name || 'Unknown'}`, margin, y);
    doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y + 14);
    y += 36;

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 24;

    // Messages
    messages.forEach((m) => {
      const isUser = m.sender === 'user';
      const label  = isUser ? 'You' : 'IRIS';
      const lines  = doc.splitTextToSize(m.text, maxW - 16);
      const bubbleH = lines.length * 14 + 28;

      checkY(bubbleH + 20);

      // Bubble background
      if (isUser) {
        doc.setFillColor(13, 148, 136);
        doc.roundedRect(margin, y, maxW, bubbleH, 8, 8, 'F');
      } else {
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(margin, y, maxW, bubbleH, 8, 8, 'F');
      }

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(isUser ? 255 : 107, isUser ? 255 : 114, isUser ? 255 : 128);
      doc.text(label, margin + 12, y + 16);

      // Message text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(isUser ? 255 : 17, isUser ? 255 : 24, isUser ? 255 : 39);
      doc.text(lines, margin + 12, y + 28);

      y += bubbleH + 12;
    });

    // Footer
    checkY(32);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageW - margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('IRIS insights are for guidance only • Not legal advice', margin, y);

    doc.save(`IRIS_log_${Date.now()}.pdf`);
  };

  const canSend = chatMessage.trim() && !isTyping;
  const f     = { fontFamily:"'DM Sans', sans-serif" };
  const syne  = { fontFamily:"'Syne', sans-serif" };
  const bebas = { fontFamily:"'Bebas Neue', cursive" };
  const mono  = { fontFamily:"'JetBrains Mono', monospace" };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 16px', background:T.pageBg, color:T.t1, fontFamily:"'DM Sans', sans-serif", transition:'background .4s, color .4s' }}>

      {/* HEADER */}
      <div style={{ width:'100%', maxWidth:900, display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:12, padding:'6px 14px', borderRadius:8, fontSize:11, letterSpacing:1.5, ...mono, fontWeight:500, textTransform:'uppercase', background:T.msgAiBg, border:`1px solid ${T.cardBorder}`, color:T.acc, transition:'all .4s' }}>
            <ShieldCheck size={14} /> IRIS Secure Session
          </span>
          <h1 style={{ fontSize:56, lineHeight:1, margin:0, color:T.t1, ...bebas, letterSpacing:3, transition:'color .4s' }}>
            IRIS
          </h1>
          <p style={{ ...f, marginTop:8, fontSize:14, color:T.t3, display:'flex', alignItems:'center', gap:8 }}>
            <Sparkles size={16} style={{ color:T.acc }}/>
            {file ? `Currently analyzing: ${file.name}` : 'Document context fully loaded and verified.'}
          </p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setDark(v => !v)} style={{ width:44, height:44, borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:T.cardBg, border:`1px solid ${T.cardBorder}`, boxShadow:T.cardShadow, transition:'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='rotate(14deg) scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; }}>
            {dark ? <Sun size={18} style={{ color:'#22d3ee' }}/> : <Moon size={18} style={{ color:T.acc }}/>}
          </button>
          <button onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:8, padding:'0 20px', height:44, fontSize:14, fontWeight:500, borderRadius:12, cursor:'pointer', ...f, background:T.cardBg, border:`1px solid ${T.cardBorder}`, color:T.t1, boxShadow:T.cardShadow, transition:'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.acc; e.currentTarget.style.color=T.acc; e.currentTarget.style.transform='scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.cardBorder; e.currentTarget.style.color=T.t1; e.currentTarget.style.transform='none'; }}>
            <Download size={16}/> Export Log
          </button>
        </div>
      </div>

      {/* CHAT CARD */}
      <div style={{ width:'100%', maxWidth:900, flex:1, display:'flex', flexDirection:'column', borderRadius:24, overflow:'hidden', background:T.cardBg, border:`1px solid ${T.cardBorder}`, boxShadow:T.cardShadow, transition:'background .4s, border-color .4s, box-shadow .4s' }}>

        {/* chat header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 28px', background:T.headerBg, borderBottom:`1px solid ${T.headerBorder}`, transition:'background .4s, border-color .4s' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:T.accGrad, boxShadow:T.msgUserShadow }}>
              <Aperture size={20} color={dark ? '#0c0908' : '#ffffff'} />
            </div>
            <div>
              <p style={{ margin:0, fontSize:16, fontWeight:600, color:T.t1, ...syne }}>IRIS</p>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', display:'inline-block', background:T.statusDot, boxShadow:T.statusGlow, animation:'cb-pulse 2s ease-in-out infinite' }}/>
                <span style={{ ...mono, fontSize:11, color:T.onlineText, fontWeight:500 }}>System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* messages */}
        <div className="cb-scrollbar" style={{ flex:1, overflowY:'auto', padding:'32px', display:'flex', flexDirection:'column', gap:24, background:T.msgAreaBg, transition:'background .4s' }}>
          {messages.map(m => <MessageBubble key={m.id} msg={m} T={T}/>)}
          {isTyping && (
            <div className="cb-msg" style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ width:36, height:36, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:T.msgAiBg, border:`1px solid ${T.cardBorder}` }}>
                <Loader2 size={16} style={{ color:T.acc, animation:'spin 1s linear infinite' }}/>
              </div>
              <div style={{ padding:'16px 20px', display:'flex', gap:6, alignItems:'center', borderRadius:'4px 20px 20px 20px', background:T.msgAiBg }}>
                <span className="cb-db1" style={{ width:6, height:6, borderRadius:'50%', background:T.acc, display:'inline-block' }}/>
                <span className="cb-db2" style={{ width:6, height:6, borderRadius:'50%', background:T.acc, display:'inline-block' }}/>
                <span className="cb-db3" style={{ width:6, height:6, borderRadius:'50%', background:T.acc, display:'inline-block' }}/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* input area */}
        <div style={{ padding:'20px 28px 24px', background:T.headerBg, borderTop:`1px solid ${T.headerBorder}`, transition:'background .4s, border-color .4s' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <input
              type="text" value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) handleSend(chatMessage); }}
              placeholder="Ask IRIS anything about the document..."
              style={{ flex:1, fontSize:15, padding:'16px 20px', borderRadius:16, outline:'none', background:T.inputBg, border:`1px solid ${T.inputBorder}`, color:T.inputText, ...f, transition:'border-color .2s, background .4s' }}
              onFocus={e => e.target.style.borderColor=T.inputFocus}
              onBlur={e  => e.target.style.borderColor=T.inputBorder}
            />
            <button onClick={() => handleSend(chatMessage)} disabled={!canSend} style={{ flexShrink:0, width:52, height:52, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor: canSend ? 'pointer' : 'not-allowed', background: canSend ? T.sendActive : T.sendDisabled, color: dark ? '#0c0908' : '#ffffff', opacity: canSend ? 1 : 0.5, boxShadow: canSend ? T.msgUserShadow : 'none', transition:'all .2s ease' }}
              onMouseEnter={e => { if (canSend) e.currentTarget.style.transform='scale(1.05)'; }}
              onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <Send size={20} />
            </button>
          </div>
          <p style={{ ...mono, marginTop:18, textAlign:'center', fontSize:11, letterSpacing:1, color:T.t3, fontWeight:500 }}>
            IRIS insights are for guidance • Not legal advice
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cb-scrollbar::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; }
      `}</style>
    </div>
  );
}
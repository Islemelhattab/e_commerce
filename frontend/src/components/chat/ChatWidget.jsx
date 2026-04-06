import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../services/store';
import { chatbotAPI } from '../../services/chatApi';

// ── SVG Icons ──────────────────────────────────────────────────────
const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="5" r="1"/>
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#F59E0B' : 'none'} stroke={filled ? '#F59E0B' : '#D1D1E0'} strokeWidth="2">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

// ── Markdown-lite renderer ──────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

// ── Message bubble ─────────────────────────────────────────────────
function MessageBubble({ msg, onQuickReply, onFAQHelpful, accentColor }) {
  const isUser = msg.sender_type === 'user';
  const isSystem = msg.sender_type === 'system';

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <span style={{ fontSize: 11, color: '#9090A8', background: '#F0F0F8', padding: '4px 12px', borderRadius: 100 }}>
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: accentColor || '#E63946', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white' }}>
          <BotIcon />
        </div>
      )}

      <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {/* Bubble */}
        <div style={{
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? (accentColor || '#E63946') : 'white',
          color: isUser ? 'white' : '#0A0A0F',
          fontSize: 14, lineHeight: 1.55,
          border: isUser ? 'none' : '1px solid #E8E8F0',
          boxShadow: '0 1px 3px rgba(10,10,15,0.06)',
          wordBreak: 'break-word',
        }}>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />

          {/* Product cards */}
          {msg.message_type === 'product_card' && msg.metadata?.products && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {msg.metadata.products.map(p => (
                <a key={p.id} href={`/products/${p.slug}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(10,10,15,0.04)', borderRadius: 10, textDecoration: 'none', color: 'inherit', transition: 'background 0.15s' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: accentColor || '#E63946', flexShrink: 0, marginLeft: 8 }}>{parseFloat(p.price).toFixed(3)} DT</span>
                </a>
              ))}
            </div>
          )}

          {/* Order status card */}
          {msg.message_type === 'order_status' && msg.metadata?.order_number && (
            <a href={`/account/orders/${msg.metadata.order_id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 12px', background: 'rgba(10,10,15,0.06)', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
              📦 Voir la commande #{msg.metadata.order_number}
            </a>
          )}
        </div>

        {/* FAQ helpful */}
        {msg.message_type === 'faq' && onFAQHelpful && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: '#9090A8' }}>
            <span>Utile ?</span>
            <button onClick={() => onFAQHelpful(msg.faq_id, true)} style={{ background: 'none', border: '1px solid #E8E8F0', borderRadius: 100, padding: '2px 10px', fontSize: 12, cursor: 'pointer', color: '#15803D' }}>👍</button>
            <button onClick={() => onFAQHelpful(msg.faq_id, false)} style={{ background: 'none', border: '1px solid #E8E8F0', borderRadius: 100, padding: '2px 10px', fontSize: 12, cursor: 'pointer', color: '#E63946' }}>👎</button>
          </div>
        )}

        <span style={{ fontSize: 10, color: '#9090A8', marginTop: 1 }}>
          {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── Quick replies ──────────────────────────────────────────────────
function QuickReplies({ replies, onSelect, accentColor }) {
  if (!replies?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 12px 10px' }}>
      {replies.map((r, i) => (
        <button key={i} onClick={() => onSelect(r)}
          style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: `1.5px solid ${accentColor || '#E63946'}`, background: 'white', color: accentColor || '#E63946', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.target.style.background = accentColor || '#E63946'; e.target.style.color = 'white'; }}
          onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.color = accentColor || '#E63946'; }}>
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ── Escalation form ────────────────────────────────────────────────
function EscalationForm({ sessionId, onEscalated, accentColor }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ email: user?.email || '', name: user ? `${user.first_name} ${user.last_name}` : '', subject: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await chatbotAPI.escalate({ session_id: sessionId, ...form });
      onEscalated(res.data.ticket_number);
    } catch {
      alert('Erreur, réessayez');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handle} style={{ padding: '14px 16px', borderTop: '1px solid #F0F0F8' }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#0A0A0F' }}>Contacter notre équipe</p>
      {[
        { key: 'name', placeholder: 'Votre nom', type: 'text' },
        { key: 'email', placeholder: 'Votre email', type: 'email' },
        { key: 'subject', placeholder: 'Sujet (optionnel)', type: 'text' },
      ].map(f => (
        <input key={f.key} type={f.type} required={f.key !== 'subject'} placeholder={f.placeholder}
          value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
          style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E8E8F0', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, outline: 'none', marginBottom: 6 }}
        />
      ))}
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: accentColor || '#E63946', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
        {loading ? 'Envoi...' : 'Envoyer ma demande'}
      </button>
    </form>
  );
}

// ── Rating screen ──────────────────────────────────────────────────
function RatingScreen({ sessionId, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!rating) return;
    await chatbotAPI.rate(sessionId, rating, comment).catch(() => {});
    setSent(true);
    setTimeout(onDone, 1500);
  };

  if (sent) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
      <p style={{ fontWeight: 700 }}>Merci pour votre avis !</p>
    </div>
  );

  return (
    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Comment évaluez-vous notre service ?</p>
      <p style={{ fontSize: 12, color: '#9090A8', marginBottom: 16 }}>Votre avis nous aide à nous améliorer</p>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, transition: 'transform 0.1s', transform: hover >= s || rating >= s ? 'scale(1.2)' : 'scale(1)' }}>
            <StarIcon filled={hover >= s || rating >= s} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Commentaire (optionnel)..."
        rows={2} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E8E8F0', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'none', marginBottom: 10 }} />
      <button onClick={submit} disabled={!rating}
        style={{ padding: '10px 24px', background: '#E63946', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: rating ? 'pointer' : 'not-allowed', opacity: rating ? 1 : 0.5, fontFamily: 'inherit' }}>
        Envoyer
      </button>
    </div>
  );
}

// ── Main ChatWidget ────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ name: 'Assistant ShopWave', avatar_color: '#E63946' });
  const [showEscalation, setShowEscalation] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [unread, setUnread] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const accentColor = config?.avatar_color || '#E63946';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Initialize chat session when opened
  useEffect(() => {
    if (open && !initialized) {
      initChat();
      setUnread(0);
    }
    if (open) inputRef.current?.focus();
  }, [open]);

  const initChat = async () => {
    try {
      const sessionKey = `anon_${Date.now()}`;
      const res = await chatbotAPI.init(sessionKey);
      const { session_id, config: cfg, quick_replies, welcome_message } = res.data;
      setSessionId(session_id);
      setConfig(cfg || {});
      setQuickReplies(quick_replies || []);
      setMessages([{
        id: 'welcome', sender_type: 'bot', message_type: 'text',
        content: welcome_message, created_at: new Date().toISOString(),
      }]);
      setInitialized(true);
    } catch {
      setMessages([{
        id: 'welcome', sender_type: 'bot', message_type: 'text',
        content: 'Bonjour ! Comment puis-je vous aider ?',
        created_at: new Date().toISOString(),
      }]);
      setInitialized(true);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading || !sessionId) return;
    const userMsg = {
      id: `u_${Date.now()}`, sender_type: 'user', message_type: 'text',
      content: text, created_at: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setQuickReplies([]);
    setLoading(true);

    try {
      const res = await chatbotAPI.sendMessage(sessionId, text);
      const { bot_response } = res.data;
      setMessages(m => [...m, { ...bot_response, faq_id: bot_response.metadata?.faq_id }]);

      if (bot_response.quick_replies?.length) {
        setQuickReplies(bot_response.quick_replies);
      }
      if (bot_response.metadata?.requires_escalation) {
        setTimeout(() => setShowEscalation(true), 800);
      }
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(m => [...m, {
        id: `err_${Date.now()}`, sender_type: 'bot', message_type: 'text',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        created_at: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  };

  const handleQuickReply = (reply) => {
    switch (reply.action) {
      case 'message':
        sendMessage(reply.value || reply.label);
        break;
      case 'escalate':
        setShowEscalation(true);
        setQuickReplies([]);
        break;
      case 'link':
        window.location.href = reply.value;
        break;
      case 'faq':
        sendMessage('Voir la FAQ');
        break;
      case 'restart':
        setMessages([]);
        setInitialized(false);
        initChat();
        break;
      default:
        sendMessage(reply.label);
    }
  };

  const handleFAQHelpful = async (faqId, helpful) => {
    if (!faqId) return;
    await chatbotAPI.markFAQHelpful(faqId, helpful).catch(() => {});
  };

  const handleEscalated = (ticketNumber) => {
    setShowEscalation(false);
    setEscalated(true);
    setMessages(m => [...m, {
      id: `sys_${Date.now()}`, sender_type: 'system', message_type: 'escalation',
      content: `✅ Ticket créé : ${ticketNumber}. Notre équipe vous contactera bientôt.`,
      created_at: new Date().toISOString(),
    }]);
    setQuickReplies([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, width: 360, height: 560,
          background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(10,10,15,0.2)',
          display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden',
          border: '1px solid rgba(10,10,15,0.08)',
          animation: 'chatSlideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Header */}
          <div style={{ background: accentColor, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <BotIcon />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'white', fontFamily: '"Syne", sans-serif' }}>{config.name || 'Assistant'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>En ligne · Répond en quelques secondes</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {!showRating && messages.length > 2 && (
                <button onClick={() => setShowRating(true)} title="Évaluer"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                  <StarIcon />
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Body */}
          {showRating ? (
            <RatingScreen sessionId={sessionId} onDone={() => { setShowRating(false); setOpen(false); }} />
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 4px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} onQuickReply={handleQuickReply} onFAQHelpful={handleFAQHelpful} accentColor={accentColor} />
                ))}
                {loading && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <BotIcon />
                    </div>
                    <div style={{ padding: '10px 14px', background: 'white', border: '1px solid #E8E8F0', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 4 }}>
                      {[0,0.15,0.3].map((d, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D0D0E0', animation: `typingDot 1.2s ${d}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              {!showEscalation && quickReplies.length > 0 && (
                <QuickReplies replies={quickReplies} onSelect={handleQuickReply} accentColor={accentColor} />
              )}

              {/* Escalation form */}
              {showEscalation && !escalated && (
                <EscalationForm sessionId={sessionId} onEscalated={handleEscalated} accentColor={accentColor} />
              )}

              {/* Input */}
              {!showEscalation && (
                <div style={{ padding: '10px 12px', borderTop: '1px solid #F0F0F8', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrivez votre message..."
                    rows={1}
                    style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 20, fontFamily: 'DM Sans, sans-serif', fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.4, maxHeight: 80, overflowY: 'auto', transition: 'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = accentColor}
                    onBlur={e => e.target.style.borderColor = '#E8E8F0'}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading || !sessionId}
                    style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? accentColor : '#E8E8F0', color: input.trim() ? 'white' : '#9090A8', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    <SendIcon />
                  </button>
                </div>
              )}

              {/* Powered by */}
              <div style={{ textAlign: 'center', padding: '6px 0 8px', fontSize: 10, color: '#C0C0D0' }}>
                Propulsé par ShopWave AI
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => { setOpen(o => !o); setUnread(0); }}
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: '50%', background: accentColor, color: 'white', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 24px ${accentColor}55`,
          zIndex: 999, transition: 'all 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = open ? 'rotate(180deg)' : 'scale(1)'}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
        {!open && unread > 0 && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#0A0A0F', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
            {unread}
          </div>
        )}
      </button>

      {/* CSS animations */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

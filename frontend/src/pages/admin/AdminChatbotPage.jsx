import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminChatbotAPI } from '../../services/chatApi';
import {
  PageHeader, Card, DataTable, StatusBadge, Btn, Input, Select,
  SearchInput, Modal, Tabs, useConfirm
} from '../../components/admin/AdminUI';

// ── Stat mini card ──────────────────────────────────────────────────
function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: 'white', border: '1.5px solid #E8E8F0', borderRadius: 14, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9090A8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 28, fontWeight: 800, color: color || '#0A0A0F' }}>{value}</div>
    </div>
  );
}

// ── Chat preview bubble ─────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.sender_type === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{
        maxWidth: '75%', padding: '9px 13px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? '#E63946' : '#F0F0F8', color: isUser ? 'white' : '#0A0A0F',
        fontSize: 13, lineHeight: 1.5,
      }}>
        {msg.content}
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3 }}>
          {msg.sender_type === 'bot' ? '🤖 Bot' : msg.sender_type === 'agent' ? '👤 Agent' : ''}
          {' '}{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ── Config tab ──────────────────────────────────────────────────────
function ConfigTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['chatbot-config'],
    queryFn: () => adminChatbotAPI.getConfig().then(r => r.data),
  });
  const [form, setForm] = useState(null);

  React.useEffect(() => { if (data) setForm(data); }, [data]);

  const saveMutation = useMutation({
    mutationFn: (d) => adminChatbotAPI.updateConfig(d),
    onSuccess: () => { toast.success('Configuration sauvegardée'); qc.invalidateQueries(['chatbot-config']); },
  });

  if (isLoading || !form) return <div style={{ padding: 24, color: '#9090A8' }}>Chargement...</div>;

  const fields = [
    { key: 'name', label: 'Nom du bot', type: 'text' },
    { key: 'human_support_email', label: 'Email support humain', type: 'email' },
    { key: 'human_support_hours', label: 'Heures de support', type: 'text', hint: 'Ex: Lun-Ven, 9h-18h' },
    { key: 'avatar_color', label: 'Couleur du bot', type: 'color' },
    { key: 'auto_open_delay', label: 'Délai ouverture auto (secondes, 0=désactivé)', type: 'number' },
  ];

  const textareas = [
    { key: 'welcome_message', label: 'Message de bienvenue' },
    { key: 'fallback_message', label: 'Message de secours (quand le bot ne comprend pas)' },
    { key: 'escalation_message', label: 'Message d\'escalade' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
      <Card title="Paramètres généraux">
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>{f.label}</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {f.type === 'color' && (
                  <input type="color" value={form[f.key] || '#E63946'} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: 44, height: 38, border: 'none', cursor: 'pointer', borderRadius: 8, padding: 2 }} />
                )}
                <input
                  type={f.type === 'color' ? 'text' : f.type}
                  value={form[f.key] ?? ''}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
                />
              </div>
              {f.hint && <span style={{ fontSize: 11, color: '#9090A8' }}>{f.hint}</span>}
            </div>
          ))}

          {textareas.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>{f.label}</label>
              <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={3}
                style={{ padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical' }} />
            </div>
          ))}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
            Chatbot actif
          </label>

          <Btn variant="primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isLoading}>
            {saveMutation.isLoading ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
          </Btn>
        </div>
      </Card>

      {/* Preview */}
      <Card title="Aperçu du widget">
        <div style={{ padding: 20 }}>
          <div style={{ border: '1.5px solid #E8E8F0', borderRadius: 16, overflow: 'hidden', maxWidth: 280 }}>
            <div style={{ background: form.avatar_color || '#E63946', padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14 }}>🤖</div>
              <div>
                <p style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{form.name || 'Assistant'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>En ligne</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 12px', background: '#FAFAFA' }}>
              <div style={{ background: 'white', border: '1px solid #E8E8F0', borderRadius: '16px 16px 16px 4px', padding: '10px 13px', fontSize: 13, lineHeight: 1.5 }}>
                {form.welcome_message?.slice(0, 120) || 'Message de bienvenue...'}
              </div>
            </div>
            <div style={{ padding: '10px 12px', borderTop: '1px solid #E8E8F0', background: 'white', display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, height: 36, border: '1.5px solid #E8E8F0', borderRadius: 18, background: '#FAFAFA' }} />
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: form.avatar_color || '#E63946' }} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#9090A8', marginTop: 12, textAlign: 'center' }}>Le widget apparaît en bas à droite du site</p>
        </div>
      </Card>
    </div>
  );
}

// ── FAQ tab ─────────────────────────────────────────────────────────
function FAQTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editFAQ, setEditFAQ] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', keywords: '', priority: 5, is_active: true, category: '' });
  const { confirm, Dialog } = useConfirm();

  const { data: categories = [] } = useQuery({ queryKey: ['faq-cats'], queryFn: () => adminChatbotAPI.getCategories().then(r => r.data) });
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['admin-faqs', search],
    queryFn: () => adminChatbotAPI.getFAQs({ search }).then(r => r.data.results || r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (d) => d.id ? adminChatbotAPI.updateFAQ(d.id, d) : adminChatbotAPI.createFAQ(d),
    onSuccess: () => { toast.success('FAQ sauvegardée'); qc.invalidateQueries(['admin-faqs']); setShowModal(false); setEditFAQ(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => adminChatbotAPI.deleteFAQ(id),
    onSuccess: () => { toast.success('FAQ supprimée'); qc.invalidateQueries(['admin-faqs']); },
  });

  const openCreate = () => { setForm({ question: '', answer: '', keywords: '', priority: 5, is_active: true, category: '' }); setEditFAQ(null); setShowModal(true); };
  const openEdit = (faq) => { setForm({ ...faq, category: faq.category || '' }); setEditFAQ(faq); setShowModal(true); };
  const handleDelete = async (faq) => {
    const ok = await confirm(`Supprimer "${faq.question.slice(0, 60)}..." ?`);
    if (ok) deleteMutation.mutate(faq.id);
  };

  const cols = [
    { key: 'question', label: 'Question', wrap: true, render: (v) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
    { key: 'category_name', label: 'Catégorie', render: (v) => <span style={{ fontSize: 12, color: '#9090A8' }}>{v || '—'}</span> },
    { key: 'view_count', label: 'Vues' },
    { key: 'helpful_count', label: '👍', render: (v) => <span style={{ color: '#15803D', fontWeight: 600 }}>{v}</span> },
    { key: 'not_helpful_count', label: '👎', render: (v) => <span style={{ color: '#E63946', fontWeight: 600 }}>{v}</span> },
    { key: 'priority', label: 'Priorité' },
    { key: 'is_active', label: 'Statut', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: '_actions', label: '', render: (_, row) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="outline" onClick={() => openEdit(row)}>Modifier</Btn>
        <Btn size="sm" variant="ghost" onClick={() => handleDelete(row)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </Btn>
      </div>
    )},
  ];

  return (
    <>
      <Dialog />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une FAQ..." />
        <Btn variant="primary" size="sm" onClick={openCreate}>+ Ajouter une FAQ</Btn>
      </div>
      <Card>
        <DataTable columns={cols} rows={faqs} loading={isLoading} emptyMessage="Aucune FAQ" />
      </Card>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditFAQ(null); }}
        title={editFAQ ? 'Modifier la FAQ' : 'Nouvelle FAQ'} width={580}
        footer={
          <>
            <Btn variant="outline" onClick={() => setShowModal(false)}>Annuler</Btn>
            <Btn variant="primary" onClick={() => saveMutation.mutate(editFAQ ? { ...form, id: editFAQ.id } : form)} disabled={saveMutation.isLoading}>
              {saveMutation.isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Btn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Question *" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Ex: Comment suivre ma commande ?" />
          <Select label="Catégorie" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            options={[{ value: '', label: 'Aucune catégorie' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>Réponse * (supports **gras** et *italique*)</label>
            <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={6}
              placeholder="Rédigez la réponse complète ici..."
              style={{ padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical' }} />
          </div>
          <Input label="Mots-clés (séparés par virgule)" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
            placeholder="commande, suivi, tracking, livraison" hint="Ces mots-clés déclenchent cette réponse automatiquement" />
          <Input label="Priorité (0-10, plus c'est haut plus c'est prioritaire)" type="number" min="0" max="10"
            value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            FAQ active
          </label>
        </div>
      </Modal>
    </>
  );
}

// ── Conversations tab ────────────────────────────────────────────────
function ConversationsTab() {
  const qc = useQueryClient();
  const [selectedSession, setSelectedSession] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [tab, setTab] = useState('all');

  const params = tab !== 'all' ? { status: tab } : {};
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['admin-chat-sessions', tab],
    queryFn: () => adminChatbotAPI.getSessions(params).then(r => r.data.results || r.data),
  });

  const { data: fullSession } = useQuery({
    queryKey: ['admin-chat-session', selectedSession?.id],
    queryFn: () => adminChatbotAPI.getSession(selectedSession.id).then(r => r.data),
    enabled: !!selectedSession,
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }) => adminChatbotAPI.replyToSession(id, message),
    onSuccess: () => { setReplyText(''); qc.invalidateQueries(['admin-chat-session', selectedSession?.id]); },
  });

  const closeMutation = useMutation({
    mutationFn: (id) => adminChatbotAPI.closeSession(id),
    onSuccess: () => { toast.success('Session fermée'); qc.invalidateQueries(['admin-chat-sessions']); setSelectedSession(null); },
  });

  const STATUS_LABELS = { active: 'Active', escalated: 'Escaladée', resolved: 'Résolue', abandoned: 'Abandonnée' };

  const cols = [
    { key: 'user_name', label: 'Client', render: (v) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
    { key: 'message_count', label: 'Messages' },
    { key: 'status', label: 'Statut', render: (v) => <StatusBadge status={v} /> },
    { key: 'rating', label: 'Note', render: (v) => v ? `${'★'.repeat(v)}` : '—' },
    { key: 'started_at', label: 'Démarré', render: (v) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) },
    { key: 'last_message', label: 'Dernier message', render: (v) => v ? <span style={{ fontSize: 12, color: '#9090A8', maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.content}</span> : '—' },
    { key: '_actions', label: '', render: (_, row) => (
      <Btn size="sm" variant="outline" onClick={() => setSelectedSession(row)}>Voir</Btn>
    )},
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedSession ? '1fr 380px' : '1fr', gap: 16 }}>
      <div>
        <Tabs tabs={[{id:'all',label:'Toutes'},{id:'active',label:'Actives'},{id:'escalated',label:'Escaladées'},{id:'resolved',label:'Résolues'}]}
          active={tab} onChange={setTab} />
        <Card>
          <DataTable columns={cols} rows={sessions} loading={isLoading} emptyMessage="Aucune conversation" />
        </Card>
      </div>

      {/* Conversation detail */}
      {selectedSession && (
        <Card title={`Conversation — ${selectedSession.user_name}`}
          actions={
            <div style={{ display: 'flex', gap: 6 }}>
              {selectedSession.status !== 'resolved' && (
                <Btn size="sm" variant="success" onClick={() => closeMutation.mutate(selectedSession.id)}>Clore</Btn>
              )}
              <Btn size="sm" variant="ghost" onClick={() => setSelectedSession(null)}>✕</Btn>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              {fullSession?.messages?.map(msg => <ChatBubble key={msg.id} msg={msg} />) || (
                <div style={{ textAlign: 'center', color: '#9090A8', fontSize: 13, paddingTop: 20 }}>Chargement...</div>
              )}
            </div>

            {/* Reply input (for escalated sessions) */}
            {selectedSession.status === 'escalated' && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid #E8E8F0', display: 'flex', gap: 8 }}>
                <input value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Répondre en tant qu'agent..."
                  onKeyDown={e => { if (e.key === 'Enter') { replyMutation.mutate({ id: selectedSession.id, message: replyText }); } }}
                  style={{ flex: 1, padding: '9px 13px', border: '1.5px solid #E8E8F0', borderRadius: 20, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
                <Btn variant="accent" size="sm" onClick={() => replyMutation.mutate({ id: selectedSession.id, message: replyText })} disabled={!replyText.trim()}>
                  Envoyer
                </Btn>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Stats tab ───────────────────────────────────────────────────────
function StatsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['chatbot-stats'],
    queryFn: () => adminChatbotAPI.getStats().then(r => r.data),
  });

  if (isLoading) return <div style={{ color: '#9090A8', padding: 24 }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <MiniStat label="Sessions totales" value={stats?.total_sessions || 0} />
        <MiniStat label="Escaladées" value={stats?.escalated_count || 0} color="#7C3AED" />
        <MiniStat label="Résolues" value={stats?.resolved_count || 0} color="#15803D" />
        <MiniStat label="Note moyenne" value={stats?.avg_rating ? `${stats.avg_rating} ★` : '—'} color="#F59E0B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Intentions les plus détectées">
          <div style={{ padding: '0 0 8px' }}>
            {stats?.top_intents?.map((item, i) => (
              <div key={item.intent} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid #F0F0F8' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#F0F0F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#9090A8', flexShrink: 0 }}>{i+1}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{item.intent.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#E63946' }}>{item.count}</span>
              </div>
            )) || <p style={{ padding: '20px', color: '#9090A8', fontSize: 13 }}>Aucune donnée</p>}
          </div>
        </Card>

        <Card title="FAQs les plus consultées">
          <div style={{ padding: '0 0 8px' }}>
            {stats?.top_faqs?.map((faq, i) => (
              <div key={faq.id} style={{ padding: '10px 20px', borderBottom: '1px solid #F0F0F8' }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faq.question}</p>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#9090A8' }}>
                  <span>{faq.view_count} vues</span>
                  <span style={{ color: '#15803D' }}>👍 {faq.helpful_count}</span>
                  <span style={{ color: '#E63946' }}>👎 {faq.not_helpful_count}</span>
                </div>
              </div>
            )) || <p style={{ padding: '20px', color: '#9090A8', fontSize: 13 }}>Aucune donnée</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────
export default function AdminChatbotPage() {
  const [tab, setTab] = useState('config');

  return (
    <div>
      <PageHeader title="Gestion du Chatbot" subtitle="Configuration, FAQ et conversations clients" />
      <Tabs
        tabs={[
          { id: 'config', label: 'Configuration' },
          { id: 'faq', label: 'FAQ & Réponses' },
          { id: 'conversations', label: 'Conversations' },
          { id: 'stats', label: 'Statistiques' },
        ]}
        active={tab} onChange={setTab}
      />
      {tab === 'config' && <ConfigTab />}
      {tab === 'faq' && <FAQTab />}
      {tab === 'conversations' && <ConversationsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
}

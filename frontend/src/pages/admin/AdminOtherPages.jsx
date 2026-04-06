import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminReviewsAPI, adminReturnsAPI, adminCouponsAPI, adminNewsletterAPI, adminBannersAPI } from '../../services/adminApi';
import { dashboardAPI } from '../../services/adminApi';
import { PageHeader, Card, DataTable, StatusBadge, Btn, SearchInput, Modal, Input, Select, Tabs, MiniBarChart, useConfirm } from '../../components/admin/AdminUI';


// ==================== REVIEWS PAGE ====================
export function AdminReviewsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const params = { search };
  if (tab === 'pending') params.is_approved = 'false';
  if (tab === 'reported') params.has_reports = 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', search, tab],
    queryFn: () => adminReviewsAPI.list(params).then(r => r.data.results || r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => adminReviewsAPI.approve(id),
    onSuccess: () => { toast.success('Avis approuvé'); qc.invalidateQueries(['admin-reviews']); },
  });
  const rejectMutation = useMutation({
    mutationFn: (id) => adminReviewsAPI.reject(id),
    onSuccess: () => { toast.success('Avis rejeté'); qc.invalidateQueries(['admin-reviews']); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => adminReviewsAPI.delete(id),
    onSuccess: () => { toast.success('Avis supprimé'); qc.invalidateQueries(['admin-reviews']); },
  });

  const handleDelete = async (review) => {
    const ok = await confirm('Supprimer cet avis définitivement ?');
    if (ok) deleteMutation.mutate(review.id);
  };

  const Stars = ({ rating }) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= rating ? '#F59E0B' : 'none'} stroke={i <= rating ? '#F59E0B' : '#D1D1E0'} strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </div>
  );

  const cols = [
    { key: 'product_name', label: 'Produit', render: (v) => <span style={{ fontWeight: 600, fontSize: 12, maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'user_email', label: 'Client', render: (v) => <span style={{ fontSize: 12, color: '#9090A8' }}>{v}</span> },
    { key: 'rating', label: 'Note', render: (v) => <Stars rating={v} /> },
    { key: 'title', label: 'Titre', render: (v) => <span style={{ fontSize: 12 }}>{v || '—'}</span> },
    { key: 'comment', label: 'Commentaire', wrap: true, render: (v) => <span style={{ fontSize: 12, color: '#5A5A72', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'report_count', label: 'Signalements', render: (v) => v > 0 ? <span style={{ color: '#E63946', fontWeight: 700 }}>{v}</span> : <span style={{ color: '#9090A8' }}>0</span> },
    { key: 'is_approved', label: 'Statut', render: (v) => <StatusBadge status={v ? 'approved' : 'rejected'} /> },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleDateString('fr-FR') },
    { key: '_actions', label: '', render: (_, row) => (
      <div style={{ display: 'flex', gap: 5 }}>
        {!row.is_approved && <Btn size="sm" variant="success" onClick={() => approveMutation.mutate(row.id)}>Approuver</Btn>}
        {row.is_approved && <Btn size="sm" variant="danger" onClick={() => rejectMutation.mutate(row.id)}>Rejeter</Btn>}
        <Btn size="sm" variant="ghost" onClick={() => handleDelete(row)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </Btn>
      </div>
    )},
  ];

  return (
    <div>
      <ConfirmDialog />
      <PageHeader title="Modération des avis" subtitle="Gérez les avis clients" />
      <Tabs tabs={[{id:'all',label:'Tous'},{id:'pending',label:'En attente'},{id:'reported',label:'Signalés'}]} active={tab} onChange={setTab} />
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E8F0' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un avis..." />
        </div>
        <DataTable columns={cols} rows={data || []} loading={isLoading} emptyMessage="Aucun avis trouvé" />
      </Card>
    </div>
  );
}


// ==================== RETURNS PAGE ====================
export function AdminReturnsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ refund_amount: '', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-returns', tab],
    queryFn: () => adminReturnsAPI.list({ status: tab !== 'all' ? tab : undefined }).then(r => r.data.results || r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }) => adminReturnsAPI.approve(id, data),
    onSuccess: () => { toast.success('Retour approuvé'); qc.invalidateQueries(['admin-returns']); setSelected(null); },
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, data }) => adminReturnsAPI.reject(id, data),
    onSuccess: () => { toast.success('Retour rejeté'); qc.invalidateQueries(['admin-returns']); setSelected(null); },
  });

  const REASON_LABELS = { defective: 'Défectueux', wrong_item: 'Mauvais article', not_as_described: 'Non conforme', changed_mind: 'Changement d\'avis', other: 'Autre' };

  const cols = [
    { key: 'order_number', label: 'Commande', render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{v}</span> },
    { key: 'user_email', label: 'Client' },
    { key: 'product_name', label: 'Produit', render: (v) => <span style={{ fontSize: 12, maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'reason', label: 'Motif', render: (v) => REASON_LABELS[v] || v },
    { key: 'status', label: 'Statut', render: (v) => <StatusBadge status={v} /> },
    { key: 'refund_amount', label: 'Remboursement', render: (v) => v ? `${parseFloat(v).toFixed(3)} DT` : '—' },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleDateString('fr-FR') },
    { key: '_actions', label: '', render: (_, row) => (
      row.status === 'pending' ? (
        <Btn size="sm" variant="outline" onClick={() => { setSelected(row); setForm({ refund_amount: '', notes: '' }); }}>Traiter</Btn>
      ) : <span style={{ fontSize: 12, color: '#9090A8' }}>Traité</span>
    )},
  ];

  return (
    <div>
      <PageHeader title="Retours & Remboursements" />
      <Tabs tabs={[{id:'pending',label:'En attente'},{id:'approved',label:'Approuvés'},{id:'rejected',label:'Rejetés'},{id:'all',label:'Tous'}]} active={tab} onChange={setTab} />
      <Card>
        <DataTable columns={cols} rows={data || []} loading={isLoading} emptyMessage="Aucun retour" />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Traiter la demande de retour" width={480}
        footer={
          <>
            <Btn variant="danger" onClick={() => rejectMutation.mutate({ id: selected?.id, data: { notes: form.notes } })} disabled={rejectMutation.isLoading}>Rejeter</Btn>
            <Btn variant="success" onClick={() => approveMutation.mutate({ id: selected?.id, data: form })} disabled={approveMutation.isLoading}>Approuver</Btn>
          </>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 14, background: '#F8F8FC', borderRadius: 10, fontSize: 13 }}>
              <p><strong>Commande:</strong> #{selected.order_number}</p>
              <p><strong>Client:</strong> {selected.user_email}</p>
              <p><strong>Produit:</strong> {selected.product_name}</p>
              <p><strong>Motif:</strong> {REASON_LABELS[selected.reason] || selected.reason}</p>
              {selected.description && <p style={{ marginTop: 8, color: '#5A5A72' }}>{selected.description}</p>}
            </div>
            <Input label="Montant du remboursement (DT)" type="number" step="0.001" value={form.refund_amount}
              onChange={e => setForm(f => ({...f, refund_amount: e.target.value}))} placeholder="Laissez vide pour pas de remboursement" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>Notes internes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3}
                style={{ padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical' }} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


// ==================== COUPONS PAGE ====================
export function AdminCouponsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [form, setForm] = useState({});
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminCouponsAPI.list().then(r => r.data.results || r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (d) => d.id ? adminCouponsAPI.update(d.id, d) : adminCouponsAPI.create(d),
    onSuccess: () => { toast.success('Coupon sauvegardé'); qc.invalidateQueries(['admin-coupons']); setShowCreate(false); setEditCoupon(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => adminCouponsAPI.toggle(id),
    onSuccess: () => qc.invalidateQueries(['admin-coupons']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminCouponsAPI.delete(id),
    onSuccess: () => { toast.success('Coupon supprimé'); qc.invalidateQueries(['admin-coupons']); },
  });

  const handleDelete = async (c) => {
    const ok = await confirm(`Supprimer le coupon "${c.code}" ?`);
    if (ok) deleteMutation.mutate(c.id);
  };

  const initForm = () => setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_order_amount: '0', valid_from: new Date().toISOString().slice(0,16), valid_until: '', usage_limit: '', is_active: true });

  const cols = [
    { key: 'code', label: 'Code', render: (v) => <code style={{ fontWeight: 700, background: '#F0F0F8', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{v}</code> },
    { key: 'description', label: 'Description', render: (v) => <span style={{ color: '#9090A8', fontSize: 12 }}>{v || '—'}</span> },
    { key: 'discount_type', label: 'Type', render: (v, row) => <span style={{ fontWeight: 600 }}>{v === 'percentage' ? `${row.discount_value}%` : `${parseFloat(row.discount_value).toFixed(3)} DT`}</span> },
    { key: 'min_order_amount', label: 'Min. commande', render: (v) => `${parseFloat(v).toFixed(3)} DT` },
    { key: 'usage_count', label: 'Utilisations', render: (v, row) => `${v} / ${row.usage_limit || '∞'}` },
    { key: 'valid_until', label: 'Expire le', render: (v) => new Date(v).toLocaleDateString('fr-FR') },
    { key: 'is_active', label: 'Statut', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: 'is_expired', label: 'Expiré', render: (v) => v ? <span style={{ color: '#E63946', fontSize: 12, fontWeight: 600 }}>Oui</span> : <span style={{ color: '#15803D', fontSize: 12 }}>Non</span> },
    { key: '_actions', label: '', render: (_, row) => (
      <div style={{ display: 'flex', gap: 5 }}>
        <Btn size="sm" variant="outline" onClick={() => { setForm({...row}); setEditCoupon(row); }}>Modifier</Btn>
        <Btn size="sm" variant={row.is_active ? 'danger' : 'success'} onClick={() => toggleMutation.mutate(row.id)}>{row.is_active ? 'Désactiver' : 'Activer'}</Btn>
        <Btn size="sm" variant="ghost" onClick={() => handleDelete(row)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </Btn>
      </div>
    )},
  ];

  const CouponForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Code promo *" value={form.code || ''} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} placeholder="EX: PROMO20" />
      <Input label="Description" value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Select label="Type de réduction" value={form.discount_type || 'percentage'} onChange={e => setForm(f => ({...f, discount_type: e.target.value}))}
          options={[{ value: 'percentage', label: 'Pourcentage (%)' }, { value: 'fixed', label: 'Montant fixe (DT)' }]} />
        <Input label="Valeur *" type="number" step="0.001" value={form.discount_value || ''} onChange={e => setForm(f => ({...f, discount_value: e.target.value}))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Commande minimum (DT)" type="number" step="0.001" value={form.min_order_amount || ''} onChange={e => setForm(f => ({...f, min_order_amount: e.target.value}))} />
        <Input label="Limite d'utilisations" type="number" value={form.usage_limit || ''} onChange={e => setForm(f => ({...f, usage_limit: e.target.value}))} placeholder="Illimité si vide" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Valable à partir du *" type="datetime-local" value={form.valid_from || ''} onChange={e => setForm(f => ({...f, valid_from: e.target.value}))} />
        <Input label="Valable jusqu'au *" type="datetime-local" value={form.valid_until || ''} onChange={e => setForm(f => ({...f, valid_until: e.target.value}))} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
        Coupon actif
      </label>
    </div>
  );

  return (
    <div>
      <ConfirmDialog />
      <PageHeader title="Coupons & Promotions"
        actions={<Btn variant="primary" size="sm" onClick={() => { initForm(); setShowCreate(true); }}>+ Créer un coupon</Btn>}
      />
      <Card>
        <DataTable columns={cols} rows={data || []} loading={isLoading} emptyMessage="Aucun coupon" />
      </Card>
      <Modal open={!!(showCreate || editCoupon)} onClose={() => { setShowCreate(false); setEditCoupon(null); }}
        title={editCoupon ? `Modifier: ${editCoupon.code}` : 'Créer un coupon'} width={560}
        footer={
          <>
            <Btn variant="outline" onClick={() => { setShowCreate(false); setEditCoupon(null); }}>Annuler</Btn>
            <Btn variant="primary" onClick={() => saveMutation.mutate(editCoupon ? {...form, id: editCoupon.id} : form)} disabled={saveMutation.isLoading}>
              {saveMutation.isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Btn>
          </>
        }
      >
        <CouponForm />
      </Modal>
    </div>
  );
}


// ==================== NEWSLETTER PAGE ====================
export function AdminNewsletterPage() {
  const [form, setForm] = useState({ subject: '', message: '', recipient_type: 'all', recipient_emails: [] });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ['newsletter-stats'],
    queryFn: () => adminNewsletterAPI.getStats().then(r => r.data),
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) { toast.error('Objet et message requis'); return; }
    setSending(true);
    try {
      const res = await adminNewsletterAPI.send(form);
      setSent(res.data);
      toast.success(res.data.message);
      setForm({ subject: '', message: '', recipient_type: 'all', recipient_emails: [] });
    } catch { toast.error('Erreur lors de l\'envoi'); }
    setSending(false);
  };

  return (
    <div>
      <PageHeader title="Newsletter & Emailing" subtitle="Envoyez des emails à vos clients" />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <Card title="Nouvelle campagne">
          <form onSubmit={handleSend} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Objet de l'email *" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} placeholder="Ex: Soldes d'été — 50% de réduction !" />
            <Select label="Destinataires" value={form.recipient_type} onChange={e => setForm(f => ({...f, recipient_type: e.target.value}))}
              options={[
                { value: 'all', label: `Tous les clients actifs (${stats?.total_subscribers || 0})` },
                { value: 'active', label: `Clients actifs (30 derniers jours)` },
                { value: 'custom', label: 'Emails personnalisés' },
              ]}
            />
            {form.recipient_type === 'custom' && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72', display: 'block', marginBottom: 5 }}>Emails (un par ligne)</label>
                <textarea rows={4} placeholder="email1@example.com&#10;email2@example.com"
                  onChange={e => setForm(f => ({...f, recipient_emails: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)}))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical' }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72', display: 'block', marginBottom: 5 }}>Message *</label>
              <textarea rows={8} value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
                placeholder="Bonjour,&#10;&#10;Nous avons le plaisir de vous annoncer..."
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical' }} />
            </div>
            <Btn type="submit" variant="primary" disabled={sending} style={{ width: '100%', padding: '12px', fontSize: 14 }}>
              {sending ? 'Envoi en cours...' : 'Envoyer la newsletter'}
            </Btn>
          </form>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Statistiques abonnés">
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Total inscrits', value: stats?.total_subscribers || 0 },
                { label: 'Emails vérifiés', value: stats?.active_users || 0 },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8F8FC', borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: '#5A5A72' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, fontFamily: '"Syne", sans-serif' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {sent && (
            <div style={{ padding: 16, background: 'rgba(45,198,83,0.1)', border: '1px solid rgba(45,198,83,0.3)', borderRadius: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 4 }}>Envoi réussi !</p>
              <p style={{ fontSize: 12, color: '#15803D' }}>{sent.message}</p>
            </div>
          )}

          <Card title="Conseils">
            <div style={{ padding: '14px 22px', fontSize: 13, color: '#5A5A72', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 8 }}>• Personnalisez le sujet pour augmenter le taux d'ouverture</p>
              <p style={{ marginBottom: 8 }}>• Envoyez entre 9h et 11h pour de meilleurs résultats</p>
              <p style={{ marginBottom: 8 }}>• Incluez un call-to-action clair dans votre message</p>
              <p>• Testez sur un petit groupe avant l'envoi massif</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


// ==================== BANNERS PAGE ====================
export function AdminBannersPage() {
  const [form, setForm] = useState({ title: '', subtitle: '', cta_text: 'Voir les offres', cta_link: '/products', background_color: '#0A0A0F', text_color: '#FFFFFF', is_active: true });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminBannersAPI.create(form);
      toast.success('Bannière créée');
      setForm({ title: '', subtitle: '', cta_text: 'Voir les offres', cta_link: '/products', background_color: '#0A0A0F', text_color: '#FFFFFF', is_active: true });
    } catch { toast.error('Erreur'); }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="Bannières promotionnelles" subtitle="Gérez les bannières de la page d'accueil" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="Créer une bannière">
          <form onSubmit={handleSave} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Titre *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Soldes d'été — 60% OFF" />
            <Input label="Sous-titre" value={form.subtitle} onChange={e => setForm(f => ({...f, subtitle: e.target.value}))} placeholder="Offre limitée sur une sélection de produits" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Texte du bouton" value={form.cta_text} onChange={e => setForm(f => ({...f, cta_text: e.target.value}))} />
              <Input label="Lien du bouton" value={form.cta_link} onChange={e => setForm(f => ({...f, cta_link: e.target.value}))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>Couleur fond</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.background_color} onChange={e => setForm(f => ({...f, background_color: e.target.value}))} style={{ width: 40, height: 36, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 8 }} />
                  <input value={form.background_color} onChange={e => setForm(f => ({...f, background_color: e.target.value}))}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #E8E8F0', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>Couleur texte</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.text_color} onChange={e => setForm(f => ({...f, text_color: e.target.value}))} style={{ width: 40, height: 36, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 8 }} />
                  <input value={form.text_color} onChange={e => setForm(f => ({...f, text_color: e.target.value}))}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #E8E8F0', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, outline: 'none' }} />
                </div>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
              Bannière active
            </label>
            <Btn type="submit" variant="primary" disabled={saving} style={{ width: '100%', padding: '12px' }}>
              {saving ? 'Sauvegarde...' : 'Créer la bannière'}
            </Btn>
          </form>
        </Card>

        <Card title="Aperçu">
          <div style={{ padding: 22 }}>
            <div style={{ borderRadius: 16, padding: '32px 28px', background: form.background_color, color: form.text_color, minHeight: 180 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: 10 }}>Offre limitée</p>
              <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                {form.title || 'Titre de la bannière'}
              </h2>
              {form.subtitle && <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>{form.subtitle}</p>}
              <div style={{ display: 'inline-block', padding: '10px 20px', background: '#E63946', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'white' }}>
                {form.cta_text}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


// ==================== REPORTS PAGE ====================
export function AdminReportsPage() {
  const [type, setType] = useState('sales');
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', type, period],
    queryFn: () => dashboardAPI.getReports(type, period).then(r => r.data),
  });

  const exportCsv = () => {
    if (!data?.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => row[k]).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rapport_${type}_${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = data?.slice(-20).map(d => ({
    value: d.revenue || d.new_customers || d.total_revenue || 0,
    label: d.date ? new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : d.name?.slice(0, 8)
  })) || [];

  return (
    <div>
      <PageHeader title="Rapports & Analytiques"
        actions={<Btn variant="outline" size="sm" onClick={exportCsv}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Exporter CSV</Btn>}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{id:'sales',label:'Ventes'},{id:'products',label:'Produits'},{id:'customers',label:'Clients'}].map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: type === t.id ? 700 : 500, border: `1.5px solid ${type === t.id ? '#0A0A0F' : '#E8E8F0'}`, background: type === t.id ? '#0A0A0F' : 'white', color: type === t.id ? 'white' : '#5A5A72', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {[{id:'7d',l:'7j'},{id:'30d',l:'30j'},{id:'90d',l:'90j'},{id:'365d',l:'1 an'}].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: period === p.id ? 700 : 500, border: `1.5px solid ${period === p.id ? '#E63946' : '#E8E8F0'}`, background: period === p.id ? 'rgba(230,57,70,0.1)' : 'white', color: period === p.id ? '#E63946' : '#9090A8', cursor: 'pointer' }}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      <Card title="Graphique" style={{ marginBottom: 16 }}>
        <div style={{ padding: 22 }}>
          {isLoading ? <div style={{ height: 160, background: '#F0F0F8', borderRadius: 8, animation: 'skeleton-loading 1.5s infinite' }} /> :
            chartData.length > 0 ? <MiniBarChart data={chartData} height={160} color="#E63946" /> :
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9090A8' }}>Aucune donnée pour cette période</div>
          }
        </div>
      </Card>

      <Card title="Données détaillées">
        {isLoading ? <div style={{ padding: 32, textAlign: 'center', color: '#9090A8' }}>Chargement...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8F8FC' }}>
                  {data?.[0] && Object.keys(data[0]).map(k => (
                    <th key={k} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9090A8', borderBottom: '1px solid #E8E8F0' }}>
                      {k.replace(/_/g,' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F0F0F8' }}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} style={{ padding: '10px 16px', color: '#0A0A0F' }}>
                        {typeof v === 'number' ? (v > 100 ? `${parseFloat(v).toFixed(3)} DT` : v) : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

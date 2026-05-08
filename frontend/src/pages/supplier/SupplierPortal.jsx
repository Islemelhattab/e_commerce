import React, { useState, useEffect } from 'react';
import { supplierPortalAPI } from '../../services/erpApi';
import { StatCard, Badge, SectionHeader, Table, Btn, Card, Modal, Field, inputStyle, Spinner, fmt, fmtDate, C } from '../../components/erp/ErpUI';
import { useAuthStore } from '../../services/store';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
//  SUPPLIER PORTAL LAYOUT
// ═══════════════════════════════════════════════════════════
export function SupplierLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { to: '/supplier', label: 'Mes Commandes', end: true,
      icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
    { to: '/supplier/invoices', label: 'Mes Factures',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F6FF', fontFamily: '"DM Sans", sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 230, flexShrink: 0, background: '#0D2240', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        {/* Brand */}
        <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontFamily: '"Syne",sans-serif', fontSize: 20, fontWeight: 800, color: 'white' }}>
            Shop<span style={{ color: '#60A5FA' }}>Wave</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
            Portail Fournisseur
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 20px 10px', color: 'rgba(255,255,255,0.35)' }}>
            Navigation
          </div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px',
                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(96,165,250,0.15)' : 'transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
                borderLeft: `3px solid ${isActive ? '#60A5FA' : 'transparent'}`,
                transition: 'all 0.12s',
              })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 2 }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Fournisseur</div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'none',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
            cursor: 'pointer', padding: '5px 10px', fontFamily: 'inherit',
          }}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: `1px solid ${C.border}`, padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <span style={{ fontSize: 13, color: C.gray }}>
            <span style={{ fontWeight: 600, color: '#0D2240' }}>ShopWave</span>
            <span style={{ margin: '0 8px' }}>·</span>Portail Fournisseur
          </span>
          <span style={{ fontSize: 12, color: C.gray }}>
            {new Date().toLocaleDateString('fr-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </header>
        <main style={{ padding: '28px 32px 56px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SUPPLIER ORDERS PAGE
// ═══════════════════════════════════════════════════════════
export function SupplierOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    supplierPortalAPI.getMyOrders()
      .then(r => setOrders(r.data.results || r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const pending   = orders.filter(o => ['sent', 'confirmed'].includes(o.status)).length;
  const received  = orders.filter(o => o.status === 'received').length;
  const totalValue = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);

  return (
    <div>
      <SectionHeader
        title="Mes Bons de Commande"
        subtitle="Commandes passées par ShopWave"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="En cours" value={pending} color={C.orange}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        <StatCard label="Livrés" value={received} color={C.green}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>} />
        <StatCard label="Valeur totale" value={`${totalValue.toFixed(3)} TND`} color={C.blue}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} />
      </div>

      {loading ? <Spinner /> : (
        <Table
          onRowClick={setDetail}
          emptyMessage="Aucun bon de commande reçu."
          columns={[
            { key: 'po_number',     label: 'Référence BC' },
            { key: 'status',        label: 'Statut', render: v => {
              const labels = { draft: 'Brouillon', sent: 'Reçu', confirmed: 'Confirmé', partial: 'Livraison partielle', received: 'Livré', cancelled: 'Annulé' };
              return <Badge status={v} label={labels[v] || v} />;
            }},
            { key: 'total',         label: 'Montant TTC', render: v => <strong>{fmt(v)}</strong> },
            { key: 'expected_date', label: 'Date de livraison', render: fmtDate },
            { key: 'received_date', label: 'Date réception',   render: fmtDate },
            { key: 'created_at',    label: 'Reçu le', render: fmtDate },
          ]}
          data={orders}
        />
      )}

      {/* BC Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Bon de commande — ${detail?.po_number}`} width={600}>
        {detail && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['Référence', detail.po_number],
                ['Statut', <Badge status={detail.status} />],
                ['Montant HT', fmt(detail.subtotal)],
                ['Montant TTC', fmt(detail.total)],
                ['Date de livraison prévue', fmtDate(detail.expected_date)],
                ['Créé le', fmtDate(detail.created_at)],
              ].map(([l, v]) => (
                <div key={l} style={{ background: C.grayLt, padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.gray, fontWeight: 600, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 13, color: C.text }}>{v || '—'}</div>
                </div>
              ))}
            </div>

            {/* Lines */}
            {detail.lines?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 8, textTransform: 'uppercase' }}>
                  Articles commandés
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.grayLt }}>
                        {['Produit', 'Qté commandée', 'Qté reçue', 'Prix unitaire', 'Sous-total'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.lines.map((l, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: '9px 12px', fontSize: 13 }}>{l.product_name || l.product}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13 }}>{l.quantity_ordered}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, color: parseFloat(l.quantity_received) > 0 ? C.green : C.gray }}>{l.quantity_received}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13 }}>{fmt(l.unit_price)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600 }}>{fmt(l.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detail.notes && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: C.blueLt, borderRadius: 8, fontSize: 13, color: C.navy }}>
                <strong>Note :</strong> {detail.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SUPPLIER INVOICES PAGE
// ═══════════════════════════════════════════════════════════
export function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    invoice_number: '', purchase_order: '',
    amount_ht: '', amount_tva: '', amount_ttc: '', due_date: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([supplierPortalAPI.getMyInvoices(), supplierPortalAPI.getMyOrders()])
      .then(([inv, ord]) => {
        setInvoices(inv.data.results || inv.data);
        setOrders(ord.data.results || ord.data);
      }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async () => {
    try {
      await supplierPortalAPI.submitInvoice(form);
      toast.success('Facture soumise avec succès');
      setModal(false);
      setForm({ invoice_number: '', purchase_order: '', amount_ht: '', amount_tva: '', amount_ttc: '', due_date: '' });
      load();
    } catch (e) {
      const err = e.response?.data;
      toast.error(err?.invoice_number?.[0] || 'Erreur soumission');
    }
  };

  // Auto-calculate TTC from HT + TVA
  const handleAmountChange = (key, val) => {
    const updated = { ...form, [key]: val };
    if (key === 'amount_ht' || key === 'amount_tva') {
      const ht  = parseFloat(key === 'amount_ht' ? val : form.amount_ht) || 0;
      const tva = parseFloat(key === 'amount_tva' ? val : form.amount_tva) || 0;
      updated.amount_ttc = (ht + tva).toFixed(3);
    }
    setForm(updated);
  };

  const pending   = invoices.filter(i => i.status === 'pending').length;
  const validated = invoices.filter(i => i.status === 'validated').length;
  const paid      = invoices.filter(i => i.status === 'paid').length;

  return (
    <div>
      <SectionHeader
        title="Mes Factures"
        subtitle="Soumettez vos factures liées aux bons de commande"
        action={<Btn onClick={() => setModal(true)}>+ Soumettre une facture</Btn>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="En cours de validation" value={pending} color={C.orange}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        <StatCard label="Validées (en attente paiement)" value={validated} color={C.teal}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} />
        <StatCard label="Payées" value={paid} color={C.green}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} />
      </div>

      {loading ? <Spinner /> : (
        <Table
          emptyMessage="Aucune facture soumise. Cliquez sur '+ Soumettre une facture'."
          columns={[
            { key: 'invoice_number', label: 'N° Facture' },
            { key: 'po_number',      label: 'Bon de commande' },
            { key: 'amount_ht',      label: 'Montant HT', render: fmt },
            { key: 'amount_tva',     label: 'TVA', render: fmt },
            { key: 'amount_ttc',     label: 'Montant TTC', render: v => <strong>{fmt(v)}</strong> },
            { key: 'due_date',       label: 'Échéance', render: fmtDate },
            { key: 'status',         label: 'Statut', render: v => {
              const labels = { pending: 'En validation', validated: 'Validée', paid: 'Payée', disputed: 'Contestée' };
              return <Badge status={v} label={labels[v] || v} />;
            }},
            { key: 'paid_at', label: 'Payée le', render: fmtDate },
          ]}
          data={invoices}
        />
      )}

      {/* Submit invoice modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Soumettre une facture" width={500}>
        <Field label="Numéro de facture" required>
          <input value={form.invoice_number} onChange={e => setForm(f => ({...f, invoice_number: e.target.value}))} style={inputStyle} placeholder="Ex: FACT-2026-0042" />
        </Field>

        <Field label="Bon de commande associé">
          <select value={form.purchase_order} onChange={e => setForm(f => ({...f, purchase_order: e.target.value}))} style={inputStyle}>
            <option value="">Aucun (facture libre)</option>
            {orders.filter(o => ['confirmed','received','partial'].includes(o.status)).map(o => (
              <option key={o.id} value={o.id}>{o.po_number} — {fmt(o.total)}</option>
            ))}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Montant HT (TND)" required>
            <input type="number" step="0.001" value={form.amount_ht} onChange={e => handleAmountChange('amount_ht', e.target.value)} style={inputStyle} placeholder="0.000" />
          </Field>
          <Field label="TVA (TND)" required>
            <input type="number" step="0.001" value={form.amount_tva} onChange={e => handleAmountChange('amount_tva', e.target.value)} style={inputStyle} placeholder="0.000" />
          </Field>
        </div>

        <Field label="Montant TTC (TND)">
          <input type="number" step="0.001" value={form.amount_ttc} readOnly style={{ ...inputStyle, background: '#F0F4FF', color: C.navy, fontWeight: 700 }} />
        </Field>

        <Field label="Date d'échéance" required>
          <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} style={inputStyle} />
        </Field>

        <div style={{ padding: '12px 14px', background: '#FFF7ED', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#92400E' }}>
          ℹ️ Votre facture sera examinée par notre équipe comptable. Vous recevrez une notification dès validation.
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn onClick={submit}>Soumettre la facture</Btn>
        </div>
      </Modal>
    </div>
  );
}

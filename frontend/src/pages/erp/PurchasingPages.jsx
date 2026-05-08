import React, { useState, useEffect } from 'react';
import { purchasingAPI } from '../../services/erpApi';
import { StatCard, Badge, SectionHeader, Table, Btn, Card, Modal, Field, inputStyle, Spinner, fmt, fmtDate, C } from '../../components/erp/ErpUI';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
//  SUPPLIERS PAGE
// ═══════════════════════════════════════════════════════════
export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', email: '', phone: '', address: '', tax_id: '', payment_terms: 30, currency: 'TND' });

  const load = () => {
    setLoading(true);
    purchasingAPI.getSuppliers().then(r => setSuppliers(r.data.results || r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    try {
      await purchasingAPI.createSupplier(form);
      toast.success('Fournisseur créé');
      setModal(false);
      setForm({ name: '', code: '', email: '', phone: '', address: '', tax_id: '', payment_terms: 30, currency: 'TND' });
      load();
    } catch (e) { toast.error(e.response?.data?.email?.[0] || 'Erreur création'); }
  };

  const active   = suppliers.filter(s => s.status === 'active').length;
  const inactive = suppliers.filter(s => s.status !== 'active').length;

  return (
    <div>
      <SectionHeader
        title="Fournisseurs"
        subtitle={`${suppliers.length} fournisseurs enregistrés`}
        action={<Btn onClick={() => setModal(true)}>+ Nouveau fournisseur</Btn>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total fournisseurs" value={suppliers.length} color={C.blue}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
        <StatCard label="Actifs" value={active} color={C.green}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>} />
        <StatCard label="Inactifs / blacklistés" value={inactive} color={C.orange}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>} />
      </div>

      {loading ? <Spinner /> : (
        <Table
          emptyMessage="Aucun fournisseur enregistré."
          columns={[
            { key: 'code',    label: 'Code' },
            { key: 'name',    label: 'Nom' },
            { key: 'email',   label: 'Email' },
            { key: 'phone',   label: 'Téléphone' },
            { key: 'payment_terms', label: 'Délai paiement', render: v => `${v} jours` },
            { key: 'status',  label: 'Statut', render: v => <Badge status={v} /> },
          ]}
          data={suppliers}
        />
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nouveau fournisseur">
        {[
          ['name','Raison sociale','text',true],
          ['code','Code fournisseur','text',true],
          ['email','Email','email',true],
          ['phone','Téléphone','text'],
          ['tax_id','Matricule fiscal','text'],
          ['address','Adresse','text'],
        ].map(([key, label, type, req]) => (
          <Field key={key} label={label} required={req}>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} style={inputStyle} />
          </Field>
        ))}
        <Field label="Délai de paiement (jours)">
          <input type="number" value={form.payment_terms} onChange={e => setForm(f => ({...f, payment_terms: e.target.value}))} style={inputStyle} />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn onClick={save}>Enregistrer</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PURCHASE ORDERS PAGE
// ═══════════════════════════════════════════════════════════
export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ supplier: '', expected_date: '', notes: '' });

  const load = () => {
    setLoading(true);
    Promise.all([purchasingAPI.getOrders(), purchasingAPI.getSuppliers()])
      .then(([o, s]) => {
        setOrders(o.data.results || o.data);
        setSuppliers(s.data.results || s.data);
      }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    try {
      await purchasingAPI.createOrder(form);
      toast.success('Bon de commande créé');
      setModal(false);
      load();
    } catch { toast.error('Erreur création'); }
  };

  const action = async (fn, label) => {
    try { await fn(); toast.success(label); load(); setDetail(null); }
    catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;

  const STATUS_FILTERS = [
    { v: '', l: 'Tous' },
    { v: 'draft', l: 'Brouillon' },
    { v: 'sent', l: 'Envoyé' },
    { v: 'confirmed', l: 'Confirmé' },
    { v: 'received', l: 'Reçu' },
    { v: 'cancelled', l: 'Annulé' },
  ];

  return (
    <div>
      <SectionHeader
        title="Bons de Commande"
        subtitle="Gestion des achats fournisseurs"
        action={<Btn onClick={() => setModal(true)}>+ Nouveau BC</Btn>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          ['Total', orders.length, C.blue],
          ['En attente', orders.filter(o => ['draft','sent'].includes(o.status)).length, C.orange],
          ['Confirmés', orders.filter(o => o.status === 'confirmed').length, C.teal],
          ['Reçus', orders.filter(o => o.status === 'received').length, C.green],
        ].map(([l, v, c]) => <StatCard key={l} label={l} value={v} color={c} />)}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {STATUS_FILTERS.map(({ v, l }) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filter === v ? C.navy : C.grayLt,
            color: filter === v ? 'white' : C.gray,
            border: 'none',
          }}>{l}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <Table
          emptyMessage="Aucun bon de commande."
          onRowClick={setDetail}
          columns={[
            { key: 'po_number',     label: 'Numéro BC' },
            { key: 'supplier_name', label: 'Fournisseur' },
            { key: 'status',        label: 'Statut', render: v => <Badge status={v} /> },
            { key: 'total',         label: 'Total', render: v => <strong>{fmt(v)}</strong> },
            { key: 'expected_date', label: 'Date prévue', render: fmtDate },
            { key: 'created_at',    label: 'Créé le', render: fmtDate },
          ]}
          data={filtered}
        />
      )}

      {/* Create modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouveau bon de commande">
        <Field label="Fournisseur" required>
          <select value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} style={inputStyle}>
            <option value="">Sélectionner un fournisseur</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>
        </Field>
        <Field label="Date de livraison prévue">
          <input type="date" value={form.expected_date} onChange={e => setForm(f => ({...f, expected_date: e.target.value}))} style={inputStyle} />
        </Field>
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3} style={{...inputStyle, resize: 'vertical'}} />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn onClick={create}>Créer le BC</Btn>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`BC — ${detail?.po_number}`} width={600}>
        {detail && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['Fournisseur', detail.supplier_name],
                ['Statut', <Badge status={detail.status} />],
                ['Total HT', fmt(detail.subtotal)],
                ['Total TTC', fmt(detail.total)],
                ['Date prévue', fmtDate(detail.expected_date)],
                ['Date réception', fmtDate(detail.received_date)],
              ].map(([l, v]) => (
                <div key={l} style={{ background: C.grayLt, padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.gray, fontWeight: 600, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{v || '—'}</div>
                </div>
              ))}
            </div>
            {detail.notes && <p style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>{detail.notes}</p>}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {detail.status === 'draft' && (
                <Btn variant="orange" onClick={() => action(() => purchasingAPI.sendOrder(detail.id), 'BC envoyé au fournisseur')}>
                  Envoyer au fournisseur
                </Btn>
              )}
              {detail.status === 'sent' && (
                <Btn variant="teal" onClick={() => action(() => purchasingAPI.confirmOrder(detail.id, {}), 'BC confirmé')}>
                  Marquer comme confirmé
                </Btn>
              )}
              {['confirmed', 'partial'].includes(detail.status) && (
                <Btn variant="success" onClick={() => action(() => purchasingAPI.receiveOrder(detail.id, { lines: [] }), 'Réception enregistrée')}>
                  Enregistrer réception
                </Btn>
              )}
              {!['received', 'cancelled'].includes(detail.status) && (
                <Btn variant="danger" onClick={() => action(() => purchasingAPI.cancelOrder(detail.id), 'BC annulé')}>
                  Annuler
                </Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  INVOICES PAGE
// ═══════════════════════════════════════════════════════════
export function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    purchasingAPI.getInvoices().then(r => setInvoices(r.data.results || r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const pending   = invoices.filter(i => i.status === 'pending');
  const validated = invoices.filter(i => i.status === 'validated');
  const totalDue  = pending.reduce((s, i) => s + parseFloat(i.amount_ttc || 0), 0);

  const action = async (fn, label) => {
    try { await fn(); toast.success(label); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  return (
    <div>
      <SectionHeader title="Factures Fournisseurs" subtitle="Suivi et validation des factures d'achat" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="En attente de validation" value={pending.length} color={C.orange} />
        <StatCard label="Validées (à payer)" value={validated.length} color={C.teal} />
        <StatCard label="Montant dû total" value={`${totalDue.toFixed(3)} TND`} color={C.red} />
      </div>

      {loading ? <Spinner /> : (
        <Table
          emptyMessage="Aucune facture fournisseur."
          columns={[
            { key: 'invoice_number', label: 'N° Facture' },
            { key: 'supplier_name', label: 'Fournisseur' },
            { key: 'po_number',     label: 'Bon de commande' },
            { key: 'amount_ht',     label: 'Montant HT', render: fmt },
            { key: 'amount_ttc',    label: 'Montant TTC', render: v => <strong>{fmt(v)}</strong> },
            { key: 'due_date',      label: 'Échéance', render: fmtDate },
            { key: 'status',        label: 'Statut', render: v => <Badge status={v} /> },
            { key: 'id',            label: 'Actions', render: (id, row) => (
              <div style={{ display: 'flex', gap: 6 }}>
                {row.status === 'pending' && (
                  <Btn size="sm" variant="teal" onClick={e => { e.stopPropagation(); action(() => purchasingAPI.validateInvoice(id), 'Facture validée'); }}>
                    Valider
                  </Btn>
                )}
                {row.status === 'validated' && (
                  <Btn size="sm" variant="success" onClick={e => { e.stopPropagation(); action(() => purchasingAPI.payInvoice(id), 'Facture payée'); }}>
                    Marquer payée
                  </Btn>
                )}
              </div>
            )},
          ]}
          data={invoices}
        />
      )}
    </div>
  );
}

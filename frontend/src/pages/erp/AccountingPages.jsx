import React, { useState, useEffect } from 'react';
import { accountingAPI } from '../../services/erpApi';
import { StatCard, Badge, SectionHeader, Table, Btn, Card, Modal, Field, inputStyle, Spinner, fmt, fmtDate, C } from '../../components/erp/ErpUI';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
//  GRAND LIVRE — Journal entries
// ═══════════════════════════════════════════════════════════
export function AccountingPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    accountingAPI.getEntries(filter ? { status: filter } : {})
      .then(r => setEntries(r.data.results || r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const postEntry = async (id) => {
    try {
      await accountingAPI.postEntry(id);
      toast.success('Écriture validée');
      load();
      setDetail(null);
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur validation'); }
  };

  const sourceLabel = { sale: 'Vente', purchase: 'Achat', payment: 'Paiement', payroll: 'Paie', manual: 'Manuel', adjustment: 'Ajustement' };

  return (
    <div>
      <SectionHeader title="Grand Livre" subtitle="Toutes les écritures comptables" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          ['Total écritures', entries.length, C.blue],
          ['Validées', entries.filter(e => e.status === 'posted').length, C.green],
          ['Brouillons', entries.filter(e => e.status === 'draft').length, C.orange],
          ['Annulées', entries.filter(e => e.status === 'cancelled').length, C.red],
        ].map(([l, v, c]) => <StatCard key={l} label={l} value={v} color={c} />)}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['', 'Toutes'], ['draft', 'Brouillons'], ['posted', 'Validées']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: filter === v ? C.navy : C.grayLt,
            color: filter === v ? 'white' : C.gray,
            border: 'none', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <Table
          onRowClick={setDetail}
          emptyMessage="Aucune écriture comptable."
          columns={[
            { key: 'entry_number', label: 'Numéro' },
            { key: 'date',         label: 'Date', render: fmtDate },
            { key: 'description',  label: 'Libellé' },
            { key: 'source',       label: 'Source', render: v => sourceLabel[v] || v },
            { key: 'status',       label: 'Statut', render: v => <Badge status={v} label={v === 'posted' ? 'Validée' : v === 'draft' ? 'Brouillon' : 'Annulée'} /> },
            { key: 'is_balanced',  label: 'Équilibrée', render: v => v ? '✅' : '❌' },
          ]}
          data={entries}
        />
      )}

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Écriture — ${detail?.entry_number}`} width={640}>
        {detail && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[['Date', fmtDate(detail.date)], ['Source', sourceLabel[detail.source]], ['Statut', <Badge status={detail.status} />], ['Équilibrée', detail.is_balanced ? '✅ Oui' : '❌ Non']].map(([l, v]) => (
                <div key={l} style={{ background: C.grayLt, padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.gray, fontWeight: 600, marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, color: C.text }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Lines table */}
            {detail.lines?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 8, textTransform: 'uppercase' }}>Lignes d'écriture</div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.grayLt }}>
                        {['Compte', 'Libellé', 'Débit', 'Crédit'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Débit' || h === 'Crédit' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.lines.map((l, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, color: C.navy }}>{l.account_code}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: C.text }}>{l.label}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: parseFloat(l.debit) > 0 ? C.blue : C.gray }}>{parseFloat(l.debit) > 0 ? fmt(l.debit) : '—'}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: parseFloat(l.credit) > 0 ? C.green : C.gray }}>{parseFloat(l.credit) > 0 ? fmt(l.credit) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detail.status === 'draft' && detail.is_balanced && (
              <Btn variant="success" onClick={() => postEntry(detail.id)}>✓ Valider l'écriture</Btn>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  BALANCE GÉNÉRALE
// ═══════════════════════════════════════════════════════════
export function BalancePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    accountingAPI.getBalance()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = typeFilter ? data.filter(d => d.account_type === typeFilter) : data;
  const totalDebit  = filtered.reduce((s, d) => s + parseFloat(d.total_debit || 0), 0);
  const totalCredit = filtered.reduce((s, d) => s + parseFloat(d.total_credit || 0), 0);

  const typeLabel = { asset: 'Actif', liability: 'Passif', revenue: 'Produit', expense: 'Charge', equity: 'Capitaux' };
  const typeColor = { asset: C.blue, liability: C.orange, revenue: C.green, expense: C.red, equity: C.teal };

  return (
    <div>
      <SectionHeader title="Balance Générale" subtitle="Soldes débiteurs et créditeurs par compte" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Débit" value={`${totalDebit.toFixed(3)} TND`} color={C.blue} />
        <StatCard label="Total Crédit" value={`${totalCredit.toFixed(3)} TND`} color={C.green} />
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['', 'Tous'], ['asset', 'Actif'], ['liability', 'Passif'], ['revenue', 'Produit'], ['expense', 'Charge'], ['equity', 'Capitaux']].map(([v, l]) => (
          <button key={v} onClick={() => setTypeFilter(v)} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: typeFilter === v ? (typeColor[v] || C.navy) : C.grayLt,
            color: typeFilter === v ? 'white' : C.gray, border: 'none', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.grayLt }}>
                {['Code', 'Compte', 'Type', 'Débit', 'Crédit', 'Solde'].map((h, i) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: i > 2 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const solde = parseFloat(row.solde);
                return (
                  <tr key={row.code} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFF' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: C.navy }}>{row.code}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: C.text }}>{row.name}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: (typeColor[row.account_type] || C.gray) + '18', color: typeColor[row.account_type] || C.gray }}>
                        {typeLabel[row.account_type] || row.account_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: C.blue }}>{parseFloat(row.total_debit).toFixed(3)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: C.green }}>{parseFloat(row.total_credit).toFixed(3)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: solde >= 0 ? C.blue : C.red }}>
                      {solde.toFixed(3)} TND
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.navy }}>
                <td colSpan={3} style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, color: 'white' }}>TOTAUX</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#93C5FD' }}>{totalDebit.toFixed(3)}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#86EFAC' }}>{totalCredit.toFixed(3)}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'white' }}>{(totalDebit - totalCredit).toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DÉCLARATION TVA
// ═══════════════════════════════════════════════════════════
export function TVAPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingAPI.getTVADeclaration().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const collected  = parseFloat(data?.tva_collected  || 0);
  const deductible = parseFloat(data?.tva_deductible || 0);
  const due        = parseFloat(data?.tva_due        || 0);

  return (
    <div>
      <SectionHeader title="Déclaration TVA" subtitle="TVA collectée - TVA déductible = TVA à reverser" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="TVA Collectée (clients)" value={`${collected.toFixed(3)} TND`} color={C.blue}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/></svg>} />
        <StatCard label="TVA Déductible (achats)" value={`${deductible.toFixed(3)} TND`} color={C.green}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>} />
        <StatCard label="TVA Nette à reverser" value={`${due.toFixed(3)} TND`} color={due > 0 ? C.red : C.green}
          sub={due > 0 ? 'À payer à l\'État' : 'Crédit de TVA'}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8"/></svg>} />
      </div>

      <Card title="Récapitulatif de la déclaration">
        <div style={{ maxWidth: 480 }}>
          {[
            ['TVA collectée sur ventes (compte 445710)', collected, C.blue],
            ['TVA déductible sur achats (compte 445620)', deductible, C.green],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.text }}>{l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v.toFixed(3)} TND</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', background: due > 0 ? '#FEF2F2' : '#F0FFF4', marginTop: 8, borderRadius: 8, paddingLeft: 12, paddingRight: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>TVA nette à reverser</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: due > 0 ? C.red : C.green }}>{due.toFixed(3)} TND</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PÉRIODES FISCALES
// ═══════════════════════════════════════════════════════════
export function PeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = () => {
    setLoading(true);
    accountingAPI.getPeriods().then(r => setPeriods(r.data.results || r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const close = async (id) => {
    if (!window.confirm('Clôturer cette période ? Cette action est irréversible.')) return;
    try {
      await accountingAPI.closePeriod(id);
      toast.success('Période clôturée');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  return (
    <div>
      <SectionHeader title="Périodes Fiscales" subtitle="Gestion des périodes comptables" />

      {loading ? <Spinner /> : (
        <Table
          emptyMessage="Aucune période fiscale. Créez-en une via Django Admin."
          columns={[
            { key: 'name',       label: 'Période' },
            { key: 'start_date', label: 'Début',  render: fmtDate },
            { key: 'end_date',   label: 'Fin',    render: fmtDate },
            { key: 'status',     label: 'Statut', render: v => <Badge status={v} label={v === 'open' ? 'Ouverte' : 'Clôturée'} /> },
            { key: 'closed_at',  label: 'Clôturée le', render: fmtDate },
            { key: 'id',         label: 'Action', render: (id, row) => (
              row.status === 'open'
                ? <Btn size="sm" variant="danger" onClick={e => { e.stopPropagation(); close(id); }}>Clôturer</Btn>
                : <span style={{ fontSize: 12, color: C.gray }}>Fermée</span>
            )},
          ]}
          data={periods}
        />
      )}
    </div>
  );
}

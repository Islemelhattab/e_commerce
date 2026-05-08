import React, { useState, useEffect } from 'react';
import { purchasingAPI, accountingAPI, hrAPI } from '../../services/erpApi';
import { StatCard, Card, SectionHeader, Badge, Spinner, fmt, fmtDate, C } from '../../components/erp/ErpUI';
import { useAuthStore } from '../../services/store';

function KpiRow({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 16, marginBottom: 24 }}>
      {items.map((item, i) => <StatCard key={i} {...item} />)}
    </div>
  );
}

export default function ErpDashboard() {
  const { user } = useAuthStore();
  const isAdmin   = user?.is_staff;
  const groups    = user?.groups || [];
  const isHR      = groups.includes('Responsable RH') || isAdmin;
  const isAccounting = groups.includes('Comptable') || isAdmin;

  const [purchData, setPurchData] = useState(null);
  const [hrData, setHrData]       = useState(null);
  const [accData, setAccData]     = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const calls = [];
    if (isAdmin)       calls.push(Promise.all([purchasingAPI.getOrders(), purchasingAPI.getInvoices(), purchasingAPI.getSuppliers()]).then(([o, inv, sup]) => setPurchData({ orders: o.data.results || o.data, invoices: inv.data.results || inv.data, suppliers: sup.data.results || sup.data })).catch(() => {}));
    if (isAccounting)  calls.push(accountingAPI.getEntries().then(r => setAccData(r.data.results || r.data)).catch(() => {}));
    if (isHR)          calls.push(hrAPI.getSummary({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }).then(r => setHrData(r.data)).catch(() => {}));
    Promise.all(calls).finally(() => setLoading(false));
  }, []);

  const month = new Date().toLocaleString('fr-TN', { month: 'long', year: 'numeric' });

  if (loading) return <Spinner />;

  return (
    <div>
      <SectionHeader
        title="Tableau de Bord ERP"
        subtitle={`Bonjour ${user?.first_name} — ${new Date().toLocaleDateString('fr-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {/* ── Purchasing KPIs (Admin) ── */}
      {isAdmin && purchData && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.orange, marginBottom: 12 }}>
            Achats & Fournisseurs
          </div>
          <KpiRow items={[
            { label: 'Fournisseurs actifs',       value: purchData.suppliers.filter(s => s.status === 'active').length, color: C.blue },
            { label: 'BCs en cours',              value: purchData.orders.filter(o => ['sent','confirmed'].includes(o.status)).length, color: C.orange },
            { label: 'Factures en attente',       value: purchData.invoices.filter(i => i.status === 'pending').length, color: C.red },
            { label: 'Montant factures en attente', value: `${purchData.invoices.filter(i => i.status === 'pending').reduce((s, i) => s + parseFloat(i.amount_ttc || 0), 0).toFixed(0)} TND`, color: C.red },
          ]} />

          {/* Recent orders table */}
          <Card title="Derniers bons de commande">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Référence', 'Fournisseur', 'Total', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchData.orders.slice(0, 5).map(o => (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: C.navy }}>{o.po_number}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>{o.supplier_name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>{fmt(o.total)}</td>
                    <td style={{ padding: '10px 12px' }}><Badge status={o.status} /></td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray }}>{fmtDate(o.created_at)}</td>
                  </tr>
                ))}
                {purchData.orders.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '20px 12px', textAlign: 'center', color: C.gray, fontSize: 13 }}>Aucun bon de commande.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {/* ── Accounting KPIs ── */}
      {isAccounting && accData && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.teal, marginBottom: 12 }}>
            Comptabilité
          </div>
          <KpiRow items={[
            { label: 'Total écritures',      value: accData.length, color: C.blue },
            { label: 'Écritures validées',   value: accData.filter(e => e.status === 'posted').length, color: C.green },
            { label: 'Brouillons à valider', value: accData.filter(e => e.status === 'draft').length, color: C.orange },
          ]} />

          {/* Recent entries */}
          <Card title="Dernières écritures comptables">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Numéro', 'Date', 'Libellé', 'Source', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accData.slice(0, 5).map(e => {
                  const src = { sale:'Vente', purchase:'Achat', payment:'Paiement', payroll:'Paie', manual:'Manuel' };
                  return (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: C.navy }}>{e.entry_number}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray }}>{fmtDate(e.date)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{e.description}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{src[e.source] || e.source}</td>
                      <td style={{ padding: '10px 12px' }}><Badge status={e.status} label={e.status === 'posted' ? 'Validée' : 'Brouillon'} /></td>
                    </tr>
                  );
                })}
                {accData.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '20px 12px', textAlign: 'center', color: C.gray, fontSize: 13 }}>Aucune écriture comptable.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {/* ── HR KPIs ── */}
      {isHR && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.blue, marginBottom: 12 }}>
            Ressources Humaines — Paie {month}
          </div>
          {hrData ? (
            <KpiRow items={[
              { label: 'Employés traités',  value: hrData.count || 0, color: C.blue },
              { label: 'Masse salariale brute', value: `${parseFloat(hrData.total_gross || 0).toFixed(0)} TND`, color: C.navy },
              { label: 'Total CNSS (salarié)', value: `${parseFloat(hrData.total_cnss_employee || 0).toFixed(0)} TND`, color: C.orange },
              { label: 'Total Net versé',   value: `${parseFloat(hrData.total_net || 0).toFixed(0)} TND`, color: C.green },
            ]} />
          ) : (
            <div style={{ padding: '16px 20px', background: C.orangeLt, borderRadius: 10, fontSize: 13, color: '#92400E', marginBottom: 16 }}>
              Aucune paie générée pour {month}. Rendez-vous dans <strong>Paie</strong> pour générer les fiches du mois.
            </div>
          )}
        </section>
      )}

      {/* Quick links */}
      <Card title="Accès rapides">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            isAdmin && { href: '/erp/purchasing', label: '📦 Bons de commande', color: C.orange },
            isAdmin && { href: '/erp/suppliers',  label: '🏭 Fournisseurs',     color: C.blue   },
            isAdmin && { href: '/erp/invoices',   label: '🧾 Factures',         color: C.teal   },
            isAccounting && { href: '/erp/accounting', label: '📒 Grand Livre',  color: C.teal },
            isAccounting && { href: '/erp/balance',    label: '⚖️ Balance',      color: C.navy },
            isAccounting && { href: '/erp/tva',        label: '🏛️ Décl. TVA',   color: C.red  },
            isHR && { href: '/erp/employees', label: '👥 Employés', color: C.blue },
            isHR && { href: '/erp/leaves',    label: '🏖️ Congés',   color: C.green },
            isHR && { href: '/erp/payroll',   label: '💰 Paie',     color: C.teal  },
          ].filter(Boolean).map(({ href, label, color }) => (
            <a key={href} href={href} style={{
              padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: color + '12', color, textDecoration: 'none',
              border: `1px solid ${color}30`, transition: 'all 0.15s',
            }}>
              {label}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}

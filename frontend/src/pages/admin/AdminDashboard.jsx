import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/adminApi';
import { PageHeader, StatCard, Card, StatusBadge, MiniBarChart, Btn } from '../../components/admin/AdminUI';

const fmt = (n) => new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
const fmtDT = (n) => `${fmt(n)} DT`;

export default function AdminDashboard() {
  const [chartPeriod, setChartPeriod] = useState('30d');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => dashboardAPI.getStats().then(r => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre activité" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 110, borderRadius: 16, background: '#F0F0F8', animation: 'skeleton-loading 1.5s infinite' }} />)}
      </div>
    </div>
  );

  const kpis = stats?.kpis || {};
  const dailyRevenue = stats?.daily_revenue || [];
  const topProducts = stats?.top_products || [];
  const topCategories = stats?.top_categories || [];
  const lowStock = stats?.low_stock || [];
  const ordersByStatus = stats?.orders_by_status || [];
  const alerts = stats?.alerts || {};

  const chartData = dailyRevenue.slice(-14).map(d => ({
    value: d.revenue,
    label: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`Dernière mise à jour: ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
        actions={
          <Btn variant="outline" size="sm" onClick={() => window.location.reload()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Actualiser
          </Btn>
        }
      />

      {/* Alerts */}
      {(alerts.pending_orders > 0 || alerts.pending_returns > 0 || alerts.low_stock_count > 0) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {alerts.pending_orders > 0 && (
            <Link to="/admin/orders?status=pending" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(244,162,97,0.12)', border: '1px solid rgba(244,162,97,0.3)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#D97706' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {alerts.pending_orders} commande{alerts.pending_orders > 1 ? 's' : ''} en attente
              </div>
            </Link>
          )}
          {alerts.pending_returns > 0 && (
            <Link to="/admin/returns?status=pending" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#7C3AED' }}>
                {alerts.pending_returns} retour{alerts.pending_returns > 1 ? 's' : ''} à traiter
              </div>
            </Link>
          )}
          {alerts.low_stock_count > 0 && (
            <Link to="/admin/products?low_stock=true" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#E63946' }}>
                {alerts.low_stock_count} produit{alerts.low_stock_count > 1 ? 's' : ''} en stock bas
              </div>
            </Link>
          )}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="Revenus du mois" value={fmtDT(kpis.revenue?.value || 0)} change={kpis.revenue?.change}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          accent="#E63946" />
        <StatCard label="Commandes" value={fmt(kpis.orders?.value || 0)} change={kpis.orders?.change}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg>}
          accent="#5B4CF5" />
        <StatCard label="Nouveaux clients" value={fmt(kpis.new_customers?.value || 0)} change={kpis.new_customers?.change}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          accent="#0EA5E9" />
        <StatCard label="Panier moyen" value={fmtDT(kpis.avg_order?.value || 0)} change={kpis.avg_order?.change}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          accent="#2DC653" />
      </div>

      {/* Revenue chart + Orders by status */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card title="Revenus des 14 derniers jours" actions={
          <div style={{ display: 'flex', gap: 4 }}>
            {['7d','30d','90d'].map(p => (
              <button key={p} onClick={() => setChartPeriod(p)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1.5px solid', borderColor: chartPeriod === p ? '#0A0A0F' : '#E8E8F0', background: chartPeriod === p ? '#0A0A0F' : 'transparent', color: chartPeriod === p ? 'white' : '#9090A8', cursor: 'pointer' }}>
                {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
              </button>
            ))}
          </div>
        }>
          <div style={{ padding: '20px 22px' }}>
            {chartData.length > 0 ? (
              <>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: '"Syne", sans-serif', fontSize: 28, fontWeight: 800 }}>
                    {fmtDT(chartData.reduce((s, d) => s + d.value, 0))}
                  </span>
                  <span style={{ fontSize: 13, color: '#9090A8', marginLeft: 8 }}>total période</span>
                </div>
                <MiniBarChart data={chartData} height={120} color="#E63946" />
              </>
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9090A8', fontSize: 14 }}>
                Pas encore de données de vente
              </div>
            )}
          </div>
        </Card>

        <Card title="Commandes par statut">
          <div style={{ padding: '16px 22px' }}>
            {ordersByStatus.length === 0 ? (
              <p style={{ color: '#9090A8', fontSize: 13 }}>Aucune commande</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ordersByStatus.map(s => (
                  <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StatusBadge status={s.status} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Top products + categories + low stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <Card title="Top produits" actions={<Link to="/admin/products" style={{ fontSize: 12, color: '#E63946', textDecoration: 'none', fontWeight: 600 }}>Voir tout</Link>}>
          <div style={{ padding: '0 0 8px' }}>
            {topProducts.slice(0, 6).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderBottom: '1px solid #F0F0F8' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#F0F0F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#9090A8', flexShrink: 0 }}>{i+1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: '#9090A8' }}>{p.total_sold} vendus</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E63946', flexShrink: 0 }}>{fmtDT(p.total_revenue)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Ventes par catégorie">
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCategories.map((c, i) => {
              const maxRev = Math.max(...topCategories.map(x => x.total_revenue));
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: '#9090A8' }}>{fmtDT(c.total_revenue)}</span>
                  </div>
                  <div style={{ height: 5, background: '#F0F0F8', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#E63946', borderRadius: 3, width: `${(c.total_revenue / maxRev) * 100}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Stock bas" actions={<Link to="/admin/products?low_stock=true" style={{ fontSize: 12, color: '#E63946', textDecoration: 'none', fontWeight: 600 }}>Gérer</Link>}>
          <div>
            {lowStock.length === 0 ? (
              <div style={{ padding: '24px 22px', textAlign: 'center', color: '#9090A8', fontSize: 13 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2DC653" strokeWidth="2" style={{ display: 'block', margin: '0 auto 8px' }}><polyline points="20 6 9 17 4 12"/></svg>
                Tous les stocks sont OK
              </div>
            ) : (
              lowStock.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderBottom: '1px solid #F0F0F8' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: '#9090A8' }}>{p.sku}</p>
                  </div>
                  <span style={{ padding: '3px 8px', background: p.stock === 0 ? 'rgba(230,57,70,0.1)' : 'rgba(244,162,97,0.12)', color: p.stock === 0 ? '#E63946' : '#D97706', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                    {p.stock === 0 ? 'Épuisé' : `${p.stock} restant`}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

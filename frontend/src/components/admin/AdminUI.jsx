import React, { useState } from 'react';

/* ── Page header ── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: 24, fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ color: '#5A5A72', fontSize: 14, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}

/* ── Stats card ── */
export function StatCard({ label, value, change, icon, accent }) {
  const isUp = change > 0;
  const isDown = change < 0;
  return (
    <div style={{ background: 'white', border: '1.5px solid #E8E8F0', borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9090A8' }}>{label}</div>
        {icon && <div style={{ width: 36, height: 36, borderRadius: 10, background: accent || 'rgba(10,10,15,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent ? 'white' : '#0A0A0F' }}>{icon}</div>}
      </div>
      <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 28, fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.03em', marginBottom: 8 }}>{value}</div>
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: isUp ? '#15803D' : isDown ? '#E63946' : '#9090A8', fontWeight: 600 }}>
          {isUp && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>}
          {isDown && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>}
          {Math.abs(change).toFixed(1)}% vs mois dernier
        </div>
      )}
    </div>
  );
}

/* ── Card wrapper ── */
export function Card({ children, title, actions, style = {} }) {
  return (
    <div style={{ background: 'white', border: '1.5px solid #E8E8F0', borderRadius: 16, overflow: 'hidden', ...style }}>
      {(title || actions) && (
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #E8E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 15, fontWeight: 700 }}>{title}</div>}
          {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Data table ── */
export function DataTable({ columns, rows, loading, emptyMessage = 'Aucune donnée' }) {
  if (loading) return (
    <div style={{ padding: 32 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {columns.map((_, j) => <div key={j} style={{ flex: 1, height: 16, borderRadius: 6, background: 'linear-gradient(90deg,#F0F0F8 25%,#E8E8F0 50%,#F0F0F8 75%)', backgroundSize: '200%', animation: 'skeleton-loading 1.5s infinite' }} />)}
        </div>
      ))}
    </div>
  );

  if (!rows?.length) return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: '#9090A8', fontSize: 14 }}>{emptyMessage}</div>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F8F8FC' }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '10px 16px', textAlign: 'left', fontSize: 11,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: '#9090A8', borderBottom: '1px solid #E8E8F0', whiteSpace: 'nowrap'
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F0F0F8', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px 16px', color: '#0A0A0F', whiteSpace: col.wrap ? 'normal' : 'nowrap' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Status badge ── */
const STATUS_STYLES = {
  pending: { bg: 'rgba(244,162,97,0.12)', color: '#D97706' },
  confirmed: { bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
  processing: { bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
  shipped: { bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
  out_for_delivery: { bg: 'rgba(14,165,233,0.1)', color: '#0284C7' },
  delivered: { bg: 'rgba(45,198,83,0.1)', color: '#15803D' },
  cancelled: { bg: 'rgba(230,57,70,0.1)', color: '#E63946' },
  returned: { bg: '#F0F0F8', color: '#5A5A72' },
  refunded: { bg: '#F0F0F8', color: '#5A5A72' },
  approved: { bg: 'rgba(45,198,83,0.1)', color: '#15803D' },
  rejected: { bg: 'rgba(230,57,70,0.1)', color: '#E63946' },
  active: { bg: 'rgba(45,198,83,0.1)', color: '#15803D' },
  inactive: { bg: '#F0F0F8', color: '#9090A8' },
  paid: { bg: 'rgba(45,198,83,0.1)', color: '#15803D' },
  failed: { bg: 'rgba(230,57,70,0.1)', color: '#E63946' },
};

const STATUS_LABELS = {
  pending: 'En attente', confirmed: 'Confirmée', processing: 'En traitement',
  shipped: 'Expédiée', out_for_delivery: 'En livraison', delivered: 'Livrée',
  cancelled: 'Annulée', returned: 'Retournée', refunded: 'Remboursée',
  approved: 'Approuvé', rejected: 'Rejeté', active: 'Actif', inactive: 'Inactif',
  paid: 'Payé', failed: 'Échoué', return_requested: 'Retour demandé',
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F0F0F8', color: '#5A5A72' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

/* ── Btn ── */
export function Btn({ children, onClick, variant = 'outline', size = 'md', disabled, style = {}, type = 'button' }) {
  const base = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.15s', opacity: disabled ? 0.5 : 1, textDecoration: 'none' };
  const sizes = { sm: { padding: '6px 12px', fontSize: 12, borderRadius: 8 }, md: { padding: '9px 18px', fontSize: 13, borderRadius: 10 }, lg: { padding: '12px 24px', fontSize: 14, borderRadius: 12 } };
  const variants = {
    primary: { background: '#0A0A0F', color: 'white', border: 'none' },
    accent: { background: '#E63946', color: 'white', border: 'none' },
    outline: { background: 'transparent', color: '#0A0A0F', border: '1.5px solid #E8E8F0' },
    ghost: { background: 'transparent', color: '#5A5A72', border: 'none' },
    danger: { background: 'rgba(230,57,70,0.1)', color: '#E63946', border: '1.5px solid rgba(230,57,70,0.2)' },
    success: { background: 'rgba(45,198,83,0.1)', color: '#15803D', border: '1.5px solid rgba(45,198,83,0.2)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

/* ── Input ── */
export function Input({ label, error, hint, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>{label}</label>}
      <input style={{ padding: '10px 14px', border: `1.5px solid ${error ? '#E63946' : '#E8E8F0'}`, borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', color: '#0A0A0F', background: 'white', width: '100%' }} {...props} />
      {error && <span style={{ fontSize: 12, color: '#E63946' }}>{error}</span>}
      {hint && <span style={{ fontSize: 12, color: '#9090A8' }}>{hint}</span>}
    </div>
  );
}

/* ── Select ── */
export function Select({ label, options, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A72' }}>{label}</label>}
      <select style={{ padding: '10px 14px', border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', color: '#0A0A0F', background: 'white', cursor: 'pointer' }} {...props}>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, footer, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,10,15,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: width, boxShadow: '0 24px 64px rgba(10,10,15,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9090A8', display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '16px 24px', borderTop: '1px solid #E8E8F0', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ── Mini bar chart ── */
export function MiniBarChart({ data, height = 80, color = '#E63946' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ background: color, borderRadius: '3px 3px 0 0', height: max ? `${Math.max(4, (d.value / max) * 100)}%` : 4, transition: 'height 0.3s', opacity: 0.85 }} />
          </div>
          {d.label && <span style={{ fontSize: 9, color: '#9090A8', whiteSpace: 'nowrap' }}>{d.label}</span>}
        </div>
      ))}
    </div>
  );
}

/* ── Tabs ── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid #E8E8F0', marginBottom: 20 }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          padding: '10px 18px', fontSize: 13, fontWeight: active === tab.id ? 700 : 500,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: active === tab.id ? '#0A0A0F' : '#9090A8', fontFamily: 'inherit',
          position: 'relative', transition: 'color 0.15s'
        }}>
          {tab.label}
          {tab.count !== undefined && (
            <span style={{ marginLeft: 6, padding: '1px 6px', background: active === tab.id ? '#0A0A0F' : '#E8E8F0', color: active === tab.id ? 'white' : '#9090A8', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>{tab.count}</span>
          )}
          {active === tab.id && <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: '#0A0A0F', borderRadius: '2px 2px 0 0' }} />}
        </button>
      ))}
    </div>
  );
}

/* ── Search input ── */
export function SearchInput({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9090A8" strokeWidth="2" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #E8E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, outline: 'none', color: '#0A0A0F', background: 'white', width: 240 }}
      />
    </div>
  );
}

/* ── Confirm dialog ── */
export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '', resolve: null });
  const confirm = (message) => new Promise(resolve => setState({ open: true, message, resolve }));
  const Dialog = () => state.open ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,10,15,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 24px 64px rgba(10,10,15,0.2)' }}>
        <p style={{ fontSize: 15, color: '#0A0A0F', marginBottom: 20, lineHeight: 1.6 }}>{state.message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => { state.resolve(false); setState(s => ({...s, open: false})); }}>Annuler</Btn>
          <Btn variant="accent" onClick={() => { state.resolve(true); setState(s => ({...s, open: false})); }}>Confirmer</Btn>
        </div>
      </div>
    </div>
  ) : null;
  return { confirm, Dialog };
}

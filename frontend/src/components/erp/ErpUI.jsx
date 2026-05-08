import React from 'react';

// ── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  navy:    '#0F2557',
  blue:    '#1D4ED8',
  blueLt:  '#DBEAFE',
  teal:    '#0D9488',
  tealLt:  '#CCFBF1',
  orange:  '#EA580C',
  orangeLt:'#FEF3C7',
  green:   '#15803D',
  greenLt: '#DCFCE7',
  red:     '#B91C1C',
  redLt:   '#FEE2E2',
  gray:    '#64748B',
  grayLt:  '#F1F5F9',
  border:  '#E2E8F0',
  white:   '#FFFFFF',
  text:    '#1E293B',
};

// ── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = C.blue, icon }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, padding: '20px 24px',
      border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }}>
      {icon && (
        <div style={{
          width: 48, height: 48, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: color + '18', color, flexShrink: 0,
        }}>{icon}</div>
      )}
      <div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  active: [C.green, C.greenLt], actif: [C.green, C.greenLt],
  draft: [C.gray, C.grayLt], brouillon: [C.gray, C.grayLt],
  sent: [C.blue, C.blueLt], envoyé: [C.blue, C.blueLt],
  confirmed: [C.teal, C.tealLt], confirmé: [C.teal, C.tealLt],
  received: [C.green, C.greenLt], reçu: [C.green, C.greenLt],
  cancelled: [C.red, C.redLt], annulé: [C.red, C.redLt],
  partial: [C.orange, C.orangeLt],
  pending: [C.orange, C.orangeLt], 'en attente': [C.orange, C.orangeLt],
  validated: [C.teal, C.tealLt], validée: [C.teal, C.tealLt],
  paid: [C.green, C.greenLt], payée: [C.green, C.greenLt],
  approved: [C.green, C.greenLt], approuvé: [C.green, C.greenLt],
  rejected: [C.red, C.redLt], refusé: [C.red, C.redLt],
  terminated: [C.red, C.redLt],
  inactive: [C.gray, C.grayLt],
  open: [C.green, C.greenLt], ouverte: [C.green, C.greenLt],
  closed: [C.red, C.redLt], clôturée: [C.red, C.redLt],
};

export function Badge({ status, label }) {
  const key = (status || '').toLowerCase();
  const [color, bg] = STATUS_COLORS[key] || [C.gray, C.grayLt];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600,
      color, background: bg, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label || status}
    </span>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: C.gray }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────
export function Table({ columns, data, onRowClick, emptyMessage = 'Aucune donnée.' }) {
  if (!data?.length) {
    return (
      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '48px 24px', textAlign: 'center', color: C.gray, fontSize: 14 }}>
        {emptyMessage}
      </div>
    );
  }
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.grayLt }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}
              onClick={() => onRowClick?.(row)}
              style={{ borderBottom: `1px solid ${C.border}`, cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px 16px', fontSize: 13, color: C.text, verticalAlign: 'middle' }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style: extra }) {
  const variants = {
    primary:   { background: C.blue,   color: C.white,  border: 'none' },
    secondary: { background: C.grayLt, color: C.text,   border: `1px solid ${C.border}` },
    danger:    { background: C.red,    color: C.white,  border: 'none' },
    success:   { background: C.green,  color: C.white,  border: 'none' },
    ghost:     { background: 'transparent', color: C.blue, border: `1px solid ${C.blue}` },
    teal:      { background: C.teal,   color: C.white,  border: 'none' },
    orange:    { background: C.orange, color: C.white,  border: 'none' },
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12, borderRadius: 7 },
    md: { padding: '8px 16px', fontSize: 13, borderRadius: 9 },
    lg: { padding: '11px 22px', fontSize: 14, borderRadius: 10 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size],
      fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
      fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6,
      ...extra
    }}>
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style: extra, title }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', ...extra }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.grayLt, border: 'none', borderRadius: 8, cursor: 'pointer', padding: '5px 9px', fontSize: 16, color: C.gray }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Form field ───────────────────────────────────────────────────────────────
export function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 13, color: '#1E293B', background: '#FAFAFA', fontFamily: 'inherit',
  boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s',
};

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Amount formatter ─────────────────────────────────────────────────────────
export const fmt = (n) => n != null ? `${parseFloat(n).toFixed(3)} TND` : '—';
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-TN') : '—';

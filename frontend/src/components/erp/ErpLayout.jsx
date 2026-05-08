import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../services/store';
import { C } from '../../components/erp/ErpUI';

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard:   'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
  purchase:    'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  supplier:    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  invoice:     'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  accounting:  'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  entries:     'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  balance:     'M18 20V10M12 20V4M6 20v-6',
  tva:         'M12 2a10 10 0 100 20A10 10 0 0012 2zM8 12h8M12 8v8',
  employees:   'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 100 8 4 4 0 000-8z',
  leaves:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  payroll:     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  periods:     'M8 2v4M16 2v4M3 10h18M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z',
};

// ── Nav definition per role ──────────────────────────────────────────────────
const NAV_ADMIN = [
  {
    section: 'Achats',
    accent: C.orange,
    items: [
      { to: '/erp/purchasing', label: 'Bons de commande', icon: ICONS.purchase },
      { to: '/erp/suppliers',  label: 'Fournisseurs',     icon: ICONS.supplier },
      { to: '/erp/invoices',   label: 'Factures',         icon: ICONS.invoice  },
    ]
  },
  {
    section: 'Comptabilité',
    accent: C.teal,
    items: [
      { to: '/erp/accounting',  label: 'Grand Livre',        icon: ICONS.accounting },
      { to: '/erp/balance',     label: 'Balance générale',   icon: ICONS.balance    },
      { to: '/erp/tva',         label: 'Déclaration TVA',    icon: ICONS.tva        },
      { to: '/erp/periods',     label: 'Périodes fiscales',  icon: ICONS.periods    },
    ]
  },
  {
    section: 'Ressources Humaines',
    accent: C.blue,
    items: [
      { to: '/erp/employees', label: 'Employés',  icon: ICONS.employees },
      { to: '/erp/leaves',    label: 'Congés',    icon: ICONS.leaves    },
      { to: '/erp/payroll',   label: 'Paie',      icon: ICONS.payroll   },
    ]
  },
];

const NAV_COMPTABLE = [
  {
    section: 'Comptabilité',
    accent: C.teal,
    items: [
      { to: '/erp/accounting',  label: 'Grand Livre',       icon: ICONS.accounting },
      { to: '/erp/balance',     label: 'Balance générale',  icon: ICONS.balance    },
      { to: '/erp/tva',         label: 'Déclaration TVA',   icon: ICONS.tva        },
      { to: '/erp/periods',     label: 'Périodes fiscales', icon: ICONS.periods    },
    ]
  },
  {
    section: 'Achats',
    accent: C.orange,
    items: [
      { to: '/erp/invoices', label: 'Factures fournisseurs', icon: ICONS.invoice },
    ]
  },
];

const NAV_HR = [
  {
    section: 'Ressources Humaines',
    accent: C.blue,
    items: [
      { to: '/erp/employees', label: 'Employés', icon: ICONS.employees },
      { to: '/erp/leaves',    label: 'Congés',   icon: ICONS.leaves    },
      { to: '/erp/payroll',   label: 'Paie',     icon: ICONS.payroll   },
    ]
  },
];

function getNav(user) {
  if (user?.is_staff) return NAV_ADMIN;
  const groups = user?.groups || [];
  if (groups.includes('Comptable')) return NAV_COMPTABLE;
  if (groups.includes('Responsable RH')) return NAV_HR;
  return NAV_ADMIN; // fallback
}

function getRoleLabel(user) {
  if (user?.is_staff) return 'Administrateur ERP';
  const groups = user?.groups || [];
  if (groups.includes('Comptable')) return 'Comptable';
  if (groups.includes('Responsable RH')) return 'Responsable RH';
  return 'ERP';
}

// ── Layout ───────────────────────────────────────────────────────────────────
export default function ErpLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const nav = getNav(user);
  const roleLabel = getRoleLabel(user);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4FF', fontFamily: '"DM Sans", sans-serif' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: collapsed ? 64 : 248, flexShrink: 0,
        background: C.navy, display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        transition: 'width 0.22s', zIndex: 100,
      }}>

        {/* Brand */}
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: '"Syne",sans-serif', fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                Shop<span style={{ color: '#60A5FA' }}>Wave</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ERP
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7,
            cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '6px 8px',
            display: 'flex', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {nav.map(group => (
            <div key={group.section}>
              {!collapsed && (
                <div style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.1em', padding: '12px 16px 4px',
                  color: group.accent, opacity: 0.85,
                }}>
                  {group.section}
                </div>
              )}
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: collapsed ? '11px 20px' : '9px 16px',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.12s', whiteSpace: 'nowrap',
                    borderLeft: `3px solid ${isActive ? group.accent : 'transparent'}`,
                  })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, opacity: 0.85 }}>
                    <path d={item.icon} />
                  </svg>
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom links */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 0', flexShrink: 0 }}>
          {!collapsed && (
            <NavLink to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 12 }}>
              ← Retour Admin E-Commerce
            </NavLink>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#60A5FA', flexShrink: 0 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{roleLabel}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{ background: 'white', borderBottom: `1px solid ${C.border}`, padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 13, color: C.gray }}>
            <span style={{ fontWeight: 600, color: C.navy }}>ShopWave ERP</span>
            <span style={{ margin: '0 8px', color: C.border }}>·</span>
            {roleLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: C.gray }}>
              {new Date().toLocaleDateString('fr-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => { logout(); navigate('/login'); }} style={{
              padding: '6px 14px', background: C.grayLt, border: `1px solid ${C.border}`,
              borderRadius: 8, cursor: 'pointer', fontSize: 12, color: C.text, fontFamily: 'inherit',
            }}>
              Déconnexion
            </button>
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, padding: '28px 32px 56px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

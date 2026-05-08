import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../services/store';

const NAV = [
  {
    section: 'Principal',
    items: [
      { to: '/admin', label: 'Tableau de bord', end: true, icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      )},
      { to: '/admin/orders', label: 'Commandes', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      )},
      { to: '/admin/products', label: 'Produits', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
      )},
      { to: '/admin/users', label: 'Clients', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      )},
    ]
  },
  {
    section: 'Gestion',
    items: [
      { to: '/admin/reviews', label: 'Avis', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      )},
      { to: '/admin/returns', label: 'Retours', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
      )},
      { to: '/admin/coupons', label: 'Coupons & Promos', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg>
      )},
      { to: '/admin/newsletter', label: 'Newsletter', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      )},
      { to: '/admin/banners', label: 'Bannières', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8"/></svg>
      )},
      { to: '/admin/chatbot', label: 'Chatbot', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      )},
      { to: '/admin/reports', label: 'Rapports', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      )},
    ]
  },
  {
    section: 'ERP',
    items: [
      { to: '/erp', label: '🏢 Accès ERP', icon: (
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none'
          stroke='currentColor' strokeWidth='2'>
          <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'/>
          <polyline points='9 22 9 12 15 12 15 22'/>
        </svg>
      )},
    ]
  }
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface-2, #F8F8FC)', fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 240, flexShrink: 0, background: '#0A0A0F',
        display: 'flex', flexDirection: 'column', transition: 'width 0.25s',
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          {!collapsed && (
            <span style={{ fontFamily: '"Syne", sans-serif', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
              Shop<span style={{ color: '#E63946' }}>Wave</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin</span>
            </span>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '6px', display: 'flex', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {NAV.map(group => (
            <div key={group.section}>
              {!collapsed && (
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', padding: '8px 16px 4px' }}>
                  {group.section}
                </div>
              )}
              {group.items.map(item => (
                <NavLink
                  key={item.to} to={item.to} end={item.end}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: collapsed ? '10px 18px' : '9px 16px',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s', borderRadius: 0,
                    borderLeft: isActive ? '2px solid #E63946' : '2px solid transparent',
                    whiteSpace: 'nowrap'
                  })}
                >
                  <span style={{ flexShrink: 0, opacity: 0.85 }}>{item.icon}</span>
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(230,57,70,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#E63946', flexShrink: 0 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.first_name} {user?.last_name}</div>
                <button onClick={handleLogout} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{ background: 'white', borderBottom: '1px solid #E8E8F0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 13, color: '#9090A8' }}>
            <NavLink to="/" target="_blank" style={{ color: '#9090A8', textDecoration: 'none' }}>← Voir la boutique</NavLink>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#9090A8' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <span style={{ padding: '4px 10px', background: 'rgba(45,198,83,0.1)', color: '#15803D', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>En ligne</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 28px 48px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

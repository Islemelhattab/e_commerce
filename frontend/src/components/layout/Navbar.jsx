import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useCartStore, useWishlistStore, useUIStore } from '../../services/store';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { setCartDrawerOpen } = useUIStore();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    // Only fetch cart if user is authenticated
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const cartCount = cart?.total_items || 0;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar__inner">
          {/* Logo */}
          <Link to="/" className="navbar__logo">
            Shop<span>Wave</span>
          </Link>

          {/* Nav Links */}
          <div className="navbar__nav">
            <NavLink to="/" className={({ isActive }) => `navbar__nav-link ${isActive ? 'active' : ''}`} end>
              Accueil
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `navbar__nav-link ${isActive ? 'active' : ''}`}>
              Produits
            </NavLink>
            <NavLink to="/category/electronics" className="navbar__nav-link">Électronique</NavLink>
            <NavLink to="/category/fashion" className="navbar__nav-link">Mode</NavLink>
            <NavLink to="/swipe-shop" className="navbar__nav-link" style={{ color: '#E63946', fontWeight: 800 }}>🔥 Swipe Shop</NavLink>
          </div>

          {/* Search */}
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit"><SearchIcon /></button>
          </form>

          {/* Actions */}
          <div className="navbar__actions">
            {isAuthenticated && (
              <>
                <Link to="/account/wishlist" className="btn btn-icon" title="Favoris">
                  <HeartIcon />
                </Link>
                <Link to="/account/notifications" className="btn btn-icon" title="Notifications">
                  <BellIcon />
                </Link>
              </>
            )}

            {/* Cart */}
            <div className="cart-badge">
              <button className="btn btn-icon" onClick={() => setCartDrawerOpen(true)} title="Panier">
                <CartIcon />
              </button>
              {cartCount > 0 && <span className="cart-badge__count">{cartCount > 99 ? '99+' : cartCount}</span>}
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-icon"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  title="Mon compte"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <UserIcon />
                  )}
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div style={{
                      position: 'absolute', top: '48px', right: 0, zIndex: 51,
                      background: 'white', border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                      minWidth: '200px', overflow: 'hidden'
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.first_name} {user?.last_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{user?.email}</div>
                      </div>
                      {[
                        ...(user?.is_staff ? [{ to: '/admin', label: 'Administration' }] : []),
                        { to: '/account/profile', label: 'Mon profil' },
                        { to: '/account/orders', label: 'Mes commandes' },
                        { to: '/account/wishlist', label: 'Mes favoris' },
                        { to: '/account/notifications', label: 'Notifications' },
                      ].map(({ to, label }) => (
                        <Link
                          key={to} to={to}
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: 'block', padding: '10px 16px', fontSize: 14,
                            color: 'var(--color-text)', textDecoration: 'none',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.target.style.background = 'var(--color-surface-2)'}
                          onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                          {label}
                        </Link>
                      ))}
                      <div style={{ borderTop: '1px solid var(--color-border)', padding: '8px' }}>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%', padding: '8px 12px', background: 'transparent',
                            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            fontSize: 14, color: 'var(--color-accent)', fontWeight: 600,
                            textAlign: 'left', fontFamily: 'var(--font-body)'
                          }}
                        >
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

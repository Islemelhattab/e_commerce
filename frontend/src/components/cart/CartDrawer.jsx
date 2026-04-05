import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore, useUIStore, useAuthStore } from '../../services/store';

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const EmptyCartIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

export default function CartDrawer() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, coupon, couponDiscount } = useCartStore();
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  const subtotal = cart?.subtotal || 0;
  const total = subtotal - couponDiscount;

  const handleCheckout = () => {
    setCartDrawerOpen(false);
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      {/* Overlay */}
      {cartDrawerOpen && (
        <div className="overlay" onClick={() => setCartDrawerOpen(false)} style={{ zIndex: 998 }} />
      )}

      {/* Drawer */}
      <div className={`cart-drawer ${cartDrawerOpen ? 'open' : ''}`} style={{ zIndex: 999 }}>
        {/* Header */}
        <div className="cart-drawer__header">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
              Mon Panier
            </h3>
            {cart?.total_items > 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {cart.total_items} article{cart.total_items > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button className="btn btn-icon" onClick={() => setCartDrawerOpen(false)}>
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="cart-drawer__body">
          {!cart?.items?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: '60px 0' }}>
              <EmptyCartIcon />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Votre panier est vide</p>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Ajoutez des produits pour commencer</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setCartDrawerOpen(false); navigate('/products'); }}>
                Découvrir les produits
              </button>
            </div>
          ) : (
            <div>
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                  {/* Image */}
                  <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-2)' }}>
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      to={`/products/${item.product_slug}`}
                      onClick={() => setCartDrawerOpen(false)}
                      style={{ textDecoration: 'none' }}
                    >
                      <p className="cart-item__name" style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: 'var(--color-text)'
                      }}>
                        {item.product_name}
                      </p>
                    </Link>
                    {item.variant_name && (
                      <p className="cart-item__variant">{item.variant_name}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      {/* Qty Control */}
                      <div className="qty-control">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >−</button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >+</button>
                      </div>
                      <span className="cart-item__price">
                        {parseFloat(item.total).toFixed(3)} DT
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', alignSelf: 'flex-start', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart?.items?.length > 0 && (
          <div className="cart-drawer__footer">
            {coupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '8px 12px', background: 'rgba(45,198,83,0.08)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span style={{ color: '#15803D', fontWeight: 600 }}>Code: {coupon.code}</span>
                <span style={{ color: '#15803D', fontWeight: 700 }}>-{parseFloat(couponDiscount).toFixed(3)} DT</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Sous-total</span>
              <span style={{ fontWeight: 600 }}>{parseFloat(subtotal).toFixed(3)} DT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 15, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>Total</span>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-accent)', fontSize: 18 }}>
                {parseFloat(total).toFixed(3)} DT
              </span>
            </div>
            <button className="btn btn-accent btn-lg" style={{ width: '100%' }} onClick={handleCheckout}>
              Commander maintenant
            </button>
            <Link
              to="/cart"
              onClick={() => setCartDrawerOpen(false)}
              style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none' }}
            >
              Voir le panier complet
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

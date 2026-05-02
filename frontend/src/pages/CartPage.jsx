import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore } from '../services/store';
import { paymentAPI, shippingAPI } from '../services/api';
import { useQuery } from '@tanstack/react-query';

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, clearCart, coupon, couponDiscount, applyCoupon, removeCoupon } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const subtotal = parseFloat(cart?.subtotal || 0);
  const discount = parseFloat(couponDiscount || 0);
  const total = subtotal - discount;
  const freeShippingThreshold = 200;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await paymentAPI.validateCoupon(couponCode, subtotal);
      applyCoupon(res.data, res.data.discount_amount);
      toast.success(`Code appliqué ! -${parseFloat(res.data.discount_amount).toFixed(3)} DT`);
      setCouponCode('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Code invalide');
    }
    setValidatingCoupon(false);
  };

  if (!cart?.items?.length) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1.5" style={{ marginBottom: 20 }}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Votre panier est vide</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Découvrez nos produits et ajoutez vos favoris au panier</p>
          <Link to="/products" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>Voir les produits</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Mon Panier</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 36 }}>{cart.total_items} article{cart.total_items > 1 ? 's' : ''}</p>

        {/* Free shipping progress */}
        {remainingForFreeShipping > 0 && (
          <div style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 28 }}>
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              Plus que <strong style={{ color: 'var(--color-accent)' }}>{remainingForFreeShipping.toFixed(3)} DT</strong> pour la livraison gratuite !
            </p>
            <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`, background: 'var(--color-accent)', borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'flex-start' }}>
          {/* Cart Items */}
          <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)' }}>PRODUIT</span>
              <div style={{ display: 'flex', gap: 60, fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                <span>PRIX</span>
                <span>QUANTITÉ</span>
                <span>TOTAL</span>
              </div>
            </div>

            {/* Items */}
            {cart.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                {/* Image */}
                <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-surface-2)', flexShrink: 0 }}>
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%239090A8' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M3 9l4-4 4 4 4-4 4 4'/%3E%3Ccircle cx='9' cy='14' r='2'/%3E%3C/svg%3E";
                        e.target.style.objectFit = 'none';
                        e.target.style.background = 'var(--color-surface-3, #F0F0F8)';
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-3)' }} />
                  )}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/products/${item.product_slug}`} style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)', textDecoration: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.product_name}
                  </Link>
                  {item.variant_name && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{item.variant_name}</p>}
                </div>

                {/* Price */}
                <div style={{ minWidth: 80, textAlign: 'right' }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{parseFloat(item.unit_price).toFixed(3)} DT</span>
                </div>

                {/* Qty */}
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button>
                </div>

                {/* Total */}
                <div style={{ minWidth: 90, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{parseFloat(item.total).toFixed(3)} DT</span>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}

            {/* Footer */}
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between' }}>
              <Link to="/products" style={{ color: 'var(--color-text-secondary)', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
                ← Continuer les achats
              </Link>
              <button
                onClick={() => { clearCart(); toast.success('Panier vidé'); }}
                style={{ fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}
              >
                Vider le panier
              </button>
            </div>
          </div>

          {/* Summary */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Résumé de la commande</h3>

              {/* Coupon */}
              {coupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(45,198,83,0.08)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>Code: {coupon.code}</span>
                    <span style={{ display: 'block', fontSize: 11, color: '#15803D' }}>{coupon.description}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#15803D' }}>-{parseFloat(couponDiscount).toFixed(3)} DT</span>
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803D', fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0 12px' }}>
                    <TagIcon />
                    <input
                      type="text" placeholder="Code promo"
                      value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1, padding: '10px 0' }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    />
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={handleApplyCoupon} disabled={validatingCoupon}>
                    {validatingCoupon ? '...' : 'Appliquer'}
                  </button>
                </div>
              )}

              {/* Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Sous-total</span>
                  <span style={{ fontWeight: 600 }}>{subtotal.toFixed(3)} DT</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#15803D' }}>Réduction</span>
                    <span style={{ fontWeight: 600, color: '#15803D' }}>-{discount.toFixed(3)} DT</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Livraison</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>Calculée au checkout</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--color-border)', paddingTop: 12, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>Total estimé</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--color-accent)' }}>
                    {total.toFixed(3)} DT
                  </span>
                </div>
              </div>

              <button
                className="btn btn-accent btn-lg"
                style={{ width: '100%', marginTop: 20 }}
                onClick={() => isAuthenticated ? navigate('/checkout') : navigate('/login?redirect=/checkout')}
              >
                Passer à la commande
              </button>

              {!isAuthenticated && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 10 }}>
                  Vous devrez vous connecter pour commander
                </p>
              )}
            </div>

            {/* Trust badges */}
            <div style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Paiement 100% sécurisé', 'Livraison rapide sous 48h', 'Retour gratuit sous 30 jours'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orderAPI } from '../../services/api';

// ==================== ORDER SUCCESS ====================
export function OrderSuccessPage() {
  const { id } = useParams();
  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOrder(id).then(r => r.data),
    enabled: !!id,
  });

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'rgba(45,198,83,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Commande confirmée !</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16, marginBottom: 8 }}>
          Merci pour votre commande. Vous recevrez une confirmation par email.
        </p>
        {order && (
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 32 }}>
            Commande #{order.order_number}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/account/orders/${id}`} className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
            Suivre ma commande
          </Link>
          <Link to="/products" className="btn btn-outline btn-lg" style={{ textDecoration: 'none' }}>
            Continuer les achats
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==================== ORDERS LIST ====================
const STATUS_CLASSES = {
  pending: 'status-pending', confirmed: 'status-confirmed', processing: 'status-processing',
  shipped: 'status-shipped', out_for_delivery: 'status-out_for_delivery',
  delivered: 'status-delivered', cancelled: 'status-cancelled',
  return_requested: 'status-returned', returned: 'status-returned', refunded: 'status-refunded'
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderAPI.getOrders().then(r => r.data),
  });

  const orders = data?.results || data || [];

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 28 }}>Mes commandes</h1>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Aucune commande</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Vous n'avez pas encore passé de commande</p>
            <Link to="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>Découvrir nos produits</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orders.map(order => (
              <div
                key={order.id}
                onClick={() => navigate(`/account/orders/${order.id}`)}
                style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-dark)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>#{order.order_number}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flex_direction: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`order-status-badge ${STATUS_CLASSES[order.status] || ''}`}>
                      {order.status_display}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
                      {parseFloat(order.total).toFixed(3)} DT
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {order.items?.slice(0, 3).map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-2)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{item.quantity}×</span>
                      <span style={{ color: 'var(--color-text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 10px' }}>+{order.items.length - 3} autres</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== ORDER DETAIL ====================
const TRACKING_STEPS = [
  { status: 'pending', label: 'Commande reçue' },
  { status: 'confirmed', label: 'Confirmée' },
  { status: 'processing', label: 'En préparation' },
  { status: 'shipped', label: 'Expédiée' },
  { status: 'out_for_delivery', label: 'En livraison' },
  { status: 'delivered', label: 'Livrée' },
];
const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cancelling, setCancelling] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOrder(id).then(r => r.data),
  });

  const handleCancel = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    setCancelling(true);
    try {
      await orderAPI.cancelOrder(id, 'Annulée par le client');
      toast.success('Commande annulée');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible d\'annuler');
    }
    setCancelling(false);
  };

  if (isLoading) return (
    <div className="container" style={{ padding: '48px 0' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12, marginBottom: 16 }} />)}
    </div>
  );
  if (!order) return null;

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <button onClick={() => navigate('/account/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Mes commandes
            </button>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>
              Commande #{order.order_number}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 4 }}>
              Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`order-status-badge ${STATUS_CLASSES[order.status] || ''}`} style={{ fontSize: 14, padding: '6px 14px' }}>
            {order.status_display}
          </span>
        </div>

        {/* Tracking */}
        {!isCancelled && (
          <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Suivi de commande</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, left: '8.33%', right: '8.33%', height: 2, background: 'var(--color-border)', zIndex: 0 }} />
              <div style={{
                position: 'absolute', top: 16, left: '8.33%', zIndex: 0, height: 2,
                background: 'var(--color-success)',
                width: `${Math.max(0, (currentStatusIndex / (TRACKING_STEPS.length - 1)) * 100 * 0.833)}%`,
                transition: 'width 0.5s'
              }} />
              {TRACKING_STEPS.map((step, i) => {
                const done = i <= currentStatusIndex;
                const current = i === currentStatusIndex;
                return (
                  <div key={step.status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? (current ? 'var(--color-primary)' : 'var(--color-success)') : 'white',
                      border: `2px solid ${done ? (current ? 'var(--color-primary)' : 'var(--color-success)') : 'var(--color-border)'}`,
                      boxShadow: current ? '0 0 0 4px rgba(10,10,15,0.1)' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      {done && !current && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                      {current && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: done ? 700 : 400, color: done ? 'var(--color-primary)' : 'var(--color-text-muted)', textAlign: 'center' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {order.tracking_number && (
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                N° de suivi : <strong>{order.tracking_number}</strong>
                {order.estimated_delivery && (
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 12 }}>
                    Livraison estimée: {new Date(order.estimated_delivery).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Articles commandés</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: 'var(--color-surface-2)', flexShrink: 0 }}>
                  {item.product_image && <img src={item.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{item.product_name}</p>
                  {item.variant_name && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.variant_name}</p>}
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>Qté: {item.quantity} × {parseFloat(item.price).toFixed(3)} DT</p>
                </div>
                <span style={{ fontWeight: 700 }}>{parseFloat(item.total).toFixed(3)} DT</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 20, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row label="Sous-total" value={`${parseFloat(order.subtotal).toFixed(3)} DT`} />
            {parseFloat(order.discount_amount) > 0 && <Row label="Réduction" value={`-${parseFloat(order.discount_amount).toFixed(3)} DT`} accent />}
            <Row label="Livraison" value={parseFloat(order.shipping_cost) === 0 ? 'Gratuit' : `${parseFloat(order.shipping_cost).toFixed(3)} DT`} />
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--color-border)', paddingTop: 12, marginTop: 4 }}>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)' }}>Total</span>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-accent)' }}>{parseFloat(order.total).toFixed(3)} DT</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <InfoBox title="Adresse de livraison">
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
              {order.shipping_address?.full_name}<br />
              {order.shipping_address?.address_line1}<br />
              {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}<br />
              {order.shipping_address?.phone}
            </p>
          </InfoBox>
          <InfoBox title="Paiement">
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
              Mode: {order.payment_method === 'cod' ? 'Paiement à la livraison' : order.payment_method === 'card' ? 'Carte bancaire' : 'Mobile'}<br />
              Statut: <span style={{ color: order.payment_status === 'paid' ? 'var(--color-success)' : 'inherit' }}>{order.payment_status === 'paid' ? 'Payé' : order.payment_status === 'pending' ? 'En attente' : order.payment_status}</span>
            </p>
          </InfoBox>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {['pending', 'confirmed'].includes(order.status) && (
            <button className="btn btn-outline" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Annulation...' : 'Annuler la commande'}
            </button>
          )}
          {order.status === 'delivered' && (
            <button className="btn btn-outline" onClick={() => toast('Fonctionnalité de retour à implémenter')}>
              Demander un retour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: accent ? 'var(--color-success)' : 'inherit' }}>{value}</span>
    </div>
  );
}

function InfoBox({ title, children }) {
  return (
    <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: 12 }}>{title}</h4>
      {children}
    </div>
  );
}

export default OrdersPage;

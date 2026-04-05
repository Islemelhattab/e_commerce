import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useCartStore, useAuthStore } from '../services/store';
import { userAPI, shippingAPI, orderAPI } from '../services/api';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const STEPS = ['Adresse', 'Livraison', 'Paiement', 'Confirmation'];
const PAYMENT_METHODS = [
  { id: 'card', label: 'Carte bancaire', desc: 'Visa, Mastercard, etc.' },
  { id: 'mobile', label: 'Paiement mobile', desc: 'D17, Postepay mobile' },
  { id: 'cod', label: 'Paiement à la livraison', desc: 'Payez en cash à la réception' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, coupon, couponDiscount, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userAPI.getAddresses().then(r => r.data),
  });

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: () => shippingAPI.getMethods().then(r => r.data),
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddress(def);
    }
  }, [addresses]);

  useEffect(() => {
    if (shippingMethods.length > 0 && !selectedShipping) {
      setSelectedShipping(shippingMethods[0]);
    }
  }, [shippingMethods]);

  if (!cart?.items?.length) {
    navigate('/cart');
    return null;
  }

  const subtotal = parseFloat(cart.subtotal || 0);
  const discount = parseFloat(couponDiscount || 0);
  const shippingCost = selectedShipping ? (subtotal >= (selectedShipping.free_shipping_threshold || Infinity) ? 0 : parseFloat(selectedShipping.price)) : 0;
  const total = subtotal - discount + shippingCost;

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedShipping) {
      toast.error('Veuillez compléter toutes les informations');
      return;
    }
    setPlacing(true);
    try {
      const res = await orderAPI.createOrder({
        address_id: selectedAddress.id,
        shipping_method_id: selectedShipping.id,
        payment_method: paymentMethod,
        coupon_code: coupon?.code || '',
        notes,
      });
      clearCart();
      toast.success('Commande passée avec succès !');
      navigate(`/order-success/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la commande');
    }
    setPlacing(false);
  };

  return (
    <div style={{ padding: '40px 0 80px', background: 'var(--color-surface-2)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 960 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Finaliser la commande</h1>
          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < step ? 'var(--color-success)' : i === step ? 'var(--color-primary)' : 'var(--color-border)',
                    color: i <= step ? 'white' : 'var(--color-text-muted)',
                    fontWeight: 700, fontSize: 14, transition: 'all 0.3s'
                  }}>
                    {i < step ? <CheckIcon /> : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: i === step ? 700 : 400, color: i === step ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 80, height: 2, background: i < step ? 'var(--color-success)' : 'var(--color-border)', margin: '0 4px', marginBottom: 24, transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
          {/* Step Content */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 32, border: '1.5px solid var(--color-border)' }}>
            {/* STEP 0: Address */}
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Adresse de livraison</h2>
                {addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>Aucune adresse enregistrée</p>
                    <button className="btn btn-primary" onClick={() => navigate('/account/profile')}>Ajouter une adresse</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {addresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr)}
                        style={{
                          padding: 20, border: `2px solid ${selectedAddress?.id === addr.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'border-color 0.15s',
                          background: selectedAddress?.id === addr.id ? 'rgba(10,10,15,0.02)' : 'white'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontWeight: 700, marginBottom: 4 }}>{addr.full_name}</p>
                            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                              {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                              {addr.city}, {addr.state} {addr.postal_code}<br />
                              {addr.phone}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {addr.is_default && <span className="badge badge-new" style={{ fontSize: 10 }}>Par défaut</span>}
                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selectedAddress?.id === addr.id ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {selectedAddress?.id === addr.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep(1)} disabled={!selectedAddress}>
                  Continuer →
                </button>
              </div>
            )}

            {/* STEP 1: Shipping */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Mode de livraison</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {shippingMethods.map(method => {
                    const isFree = subtotal >= (method.free_shipping_threshold || Infinity);
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedShipping(method)}
                        style={{
                          padding: 20, border: `2px solid ${selectedShipping?.id === method.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selectedShipping?.id === method.id ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selectedShipping?.id === method.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 15 }}>{method.name}</p>
                            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                              {method.estimated_days_min}–{method.estimated_days_max} jours ouvrables
                              {method.description && ` • ${method.description}`}
                            </p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 16, color: isFree ? 'var(--color-success)' : 'var(--color-primary)' }}>
                          {isFree ? 'Gratuit' : `${parseFloat(method.price).toFixed(3)} DT`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(0)}>← Retour</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(2)} disabled={!selectedShipping}>Continuer →</button>
                </div>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Mode de paiement</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {PAYMENT_METHODS.map(method => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        padding: 20, border: `2px solid ${paymentMethod === method.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', gap: 14, alignItems: 'center'
                      }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === method.id ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {paymentMethod === method.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15 }}>{method.label}</p>
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{method.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">Notes (optionnel)</label>
                  <textarea className="form-input" rows={3} placeholder="Instructions spéciales pour la livraison..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>← Retour</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>Vérifier la commande →</button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirmation */}
            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Vérification de la commande</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  <SummaryBlock title="Adresse de livraison" onEdit={() => setStep(0)}>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
                      {selectedAddress?.full_name}<br />
                      {selectedAddress?.address_line1}<br />
                      {selectedAddress?.city}, {selectedAddress?.state}<br />
                      {selectedAddress?.phone}
                    </p>
                  </SummaryBlock>
                  <SummaryBlock title="Mode de livraison" onEdit={() => setStep(1)}>
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{selectedShipping?.name} — {shippingCost === 0 ? 'Gratuit' : `${shippingCost.toFixed(3)} DT`}</p>
                  </SummaryBlock>
                  <SummaryBlock title="Paiement" onEdit={() => setStep(2)}>
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
                  </SummaryBlock>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)}>← Retour</button>
                  <button className="btn btn-accent" style={{ flex: 2 }} onClick={handlePlaceOrder} disabled={placing}>
                    {placing ? 'Validation...' : `Confirmer — ${total.toFixed(3)} DT`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 24, border: '1.5px solid var(--color-border)', position: 'sticky', top: 90 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Votre commande</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {cart.items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--color-surface-2)', flexShrink: 0, position: 'relative' }}>
                    {item.product_image && <img src={item.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{item.quantity}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{parseFloat(item.total).toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Row label="Sous-total" value={`${subtotal.toFixed(3)} DT`} />
              {discount > 0 && <Row label="Réduction" value={`-${discount.toFixed(3)} DT`} accent />}
              <Row label="Livraison" value={shippingCost === 0 ? 'Gratuit' : `${shippingCost.toFixed(3)} DT`} />
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)' }}>Total</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-accent)', fontSize: 18 }}>{total.toFixed(3)} DT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({ title, onEdit, children }) {
  return (
    <div style={{ padding: 16, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>{title}</span>
        <button onClick={onEdit} style={{ fontSize: 12, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}>Modifier</button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: accent ? 'var(--color-success)' : 'inherit' }}>{value}</span>
    </div>
  );
}

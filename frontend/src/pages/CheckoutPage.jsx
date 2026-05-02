import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore, useAuthStore } from '../services/store';
import { userAPI, shippingAPI, orderAPI, paymentAPI } from '../services/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY || 'pk_test_placeholder');

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

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1A1A2E',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': {
        color: '#9090A8'
      }
    },
    invalid: {
      color: '#DC2626',
      iconColor: '#DC2626'
    }
  }
};

function CheckoutContent() {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  
  const { cart, coupon, couponDiscount, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!cart?.items?.length) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await userAPI.getAddresses();
      const data = res.data;
      return Array.isArray(data) ? data : Array.isArray(data.addresses) ? data.addresses : [];
    },
  });

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const res = await shippingAPI.getMethods();
      const data = res.data;
      return Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : Array.isArray(data.methods) ? data.methods : [];
    },
  });

  const safeAddresses = Array.isArray(addresses) ? addresses : [];
  const safeShipping = Array.isArray(shippingMethods) ? shippingMethods : [];

  useEffect(() => {
    if (safeAddresses.length > 0 && !selectedAddress) {
      const def = safeAddresses.find(a => a.is_default) || safeAddresses[0];
      setSelectedAddress(def);
    }
  }, [safeAddresses, selectedAddress]);

  useEffect(() => {
    if (safeShipping.length > 0 && !selectedShipping) {
      setSelectedShipping(safeShipping[0]);
    }
  }, [safeShipping, selectedShipping]);

  if (!cart?.items?.length) return null;

  const subtotal = parseFloat(cart.subtotal || 0);
  const discount = parseFloat(couponDiscount || 0);
  const shippingCost = selectedShipping
    ? subtotal >= (selectedShipping.free_shipping_threshold || Infinity)
      ? 0
      : parseFloat(selectedShipping.price)
    : 0;

  const total = subtotal - discount + shippingCost;

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedShipping) {
      toast.error('Veuillez compléter toutes les informations');
      return;
    }

    if (paymentMethod === 'card' && !stripe) {
      toast.error("Le service de paiement n'est pas prêt.");
      return;
    }

    setPlacing(true);

    try {
      // 1. Create Order
      const res = await orderAPI.createOrder({
        address_id: selectedAddress.id,
        shipping_method_id: selectedShipping.id,
        payment_method: paymentMethod,
        coupon_code: coupon?.code || '',
        notes,
      });

      const orderId = res.data.id;

      // 2. If Card, process Stripe
      if (paymentMethod === 'card') {
        const intentRes = await paymentAPI.createPaymentIntent(orderId);
        const clientSecret = intentRes.data.client_secret;

        const cardElement = elements.getElement(CardElement);
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: selectedAddress.full_name,
            }
          }
        });

        if (error) {
          toast.error(error.message);
          setPlacing(false);
          return;
        }

        if (paymentIntent.status === 'succeeded') {
          toast.success('Paiement réussi !');
        }
      } else {
        toast.success('Commande passée avec succès !');
      }

      clearCart();
      navigate(`/order-success/${orderId}`);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expirée');
        navigate('/login?redirect=/checkout');
        return;
      }
      toast.error(err.response?.data?.error || 'Erreur lors de la commande');
    }

    setPlacing(false);
  };

    const qc = useQueryClient();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'Tunisie',
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await userAPI.createAddress(addressForm);
      toast.success('Adresse ajoutée !');
      setShowAddressForm(false);
      setAddressForm({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'Tunisie' });
      qc.invalidateQueries(['addresses']);
      
      // Auto-select the newly created address and proceed to next step
      if (res.data) {
        setSelectedAddress(res.data);
        setStep(1);
      }
    } catch (err) {
      toast.error("Erreur lors de l'ajout de l'adresse");
    }
    setSavingAddress(false);
  };

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: 900 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 40, textAlign: 'center' }}>Validation de la commande</h1>
      
      {/* Steps Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, left: 0, right: 0, height: 2, background: 'var(--color-border)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 16, left: 0, width: `${(step / (STEPS.length - 1)) * 100}%`, height: 2, background: 'var(--color-primary)', zIndex: 0, transition: 'width 0.3s ease' }} />
        
        {STEPS.map((label, idx) => (
          <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step > idx ? 'var(--color-primary)' : step === idx ? 'var(--color-primary)' : 'var(--color-surface-2)',
              color: step >= idx ? 'white' : 'var(--color-text-muted)',
              border: step >= idx ? 'none' : '2px solid var(--color-border)',
              fontWeight: 700, fontSize: 14, transition: 'all 0.3s ease'
            }}>
              {step > idx ? <CheckIcon /> : idx + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: step === idx ? 700 : 500, color: step >= idx ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-surface)', padding: 32, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
        
        {/* STEP 0 */}
        {step === 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Choisissez une adresse de livraison</h2>
              {!showAddressForm && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddressForm(true)}>+ Nouvelle adresse</button>
              )}
            </div>

            {showAddressForm && (
              <form onSubmit={handleCreateAddress} style={{ background: 'var(--color-surface-2)', padding: 24, borderRadius: 'var(--radius-md)', marginBottom: 32, border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Nouvelle adresse</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group"><label className="form-label">Nom complet</label><input className="form-input" value={addressForm.full_name} onChange={e => setAddressForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={addressForm.phone} onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))} required /></div>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}><label className="form-label">Adresse (Ligne 1)</label><input className="form-input" value={addressForm.address_line1} onChange={e => setAddressForm(f => ({ ...f, address_line1: e.target.value }))} required /></div>
                <div className="form-group" style={{ marginBottom: 16 }}><label className="form-label">Appartement, suite, etc. (Optionnel)</label><input className="form-input" value={addressForm.address_line2} onChange={e => setAddressForm(f => ({ ...f, address_line2: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="form-group"><label className="form-label">Ville</label><input className="form-input" value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">Gouvernorat</label><input className="form-input" value={addressForm.state} onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">Code postal</label><input className="form-input" value={addressForm.postal_code} onChange={e => setAddressForm(f => ({ ...f, postal_code: e.target.value }))} required /></div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline" type="button" onClick={() => setShowAddressForm(false)}>Annuler</button>
                  <button className="btn btn-primary" type="submit" disabled={savingAddress}>{savingAddress ? 'Ajout...' : "Ajouter l'adresse"}</button>
                </div>
              </form>
            )}

            {!showAddressForm && safeAddresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Vous n'avez pas encore d'adresse enregistrée.</p>
                <button className="btn btn-primary" onClick={() => setShowAddressForm(true)}>+ Ajouter une adresse</button>
              </div>
            ) : (
              !showAddressForm && (
                <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
                  {safeAddresses.map(addr => (
                    <div key={addr.id} onClick={() => setSelectedAddress(addr)} style={{ 
                      padding: 20, border: `2px solid ${selectedAddress?.id === addr.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start',
                      background: selectedAddress?.id === addr.id ? 'var(--color-surface-primary)' : 'transparent', transition: 'all 0.2s'
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>
                        {selectedAddress?.id === addr.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{addr.full_name}</h4>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{addr.address_line1}</p>
                        {addr.address_line2 && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{addr.address_line2}</p>}
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{addr.city}, {addr.state}, {addr.postal_code}</p>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>{addr.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-lg" onClick={() => setStep(1)} disabled={!selectedAddress}>Continuer vers la livraison</button>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 24, fontWeight: 700 }}>Mode de livraison</h2>
            <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
              {safeShipping.map(method => {
                const isFree = subtotal >= (method.free_shipping_threshold || Infinity);
                return (
                  <div key={method.id} onClick={() => setSelectedShipping(method)} style={{ 
                    padding: 20, border: `2px solid ${selectedShipping?.id === method.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: selectedShipping?.id === method.id ? 'var(--color-surface-primary)' : 'transparent', transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selectedShipping?.id === method.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700 }}>{method.name}</h4>
                        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 2 }}>{method.estimated_days_min} - {method.estimated_days_max} jours ouvrables</p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: isFree ? 'var(--color-success)' : 'var(--color-text)' }}>
                      {isFree ? 'Gratuit' : `${parseFloat(method.price).toFixed(3)} DT`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline btn-lg" onClick={() => setStep(0)}>Retour</button>
              <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} disabled={!selectedShipping}>Continuer vers le paiement</button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 24, fontWeight: 700 }}>Mode de paiement</h2>
            <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
              {PAYMENT_METHODS.map(m => (
                <div key={m.id} onClick={() => setPaymentMethod(m.id)} style={{ 
                  padding: 20, border: `2px solid ${paymentMethod === m.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center',
                  background: paymentMethod === m.id ? 'var(--color-surface-primary)' : 'transparent', transition: 'all 0.2s'
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {paymentMethod === m.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700 }}>{m.label}</h4>
                    <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 2 }}>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <div style={{ padding: 24, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 32, background: 'var(--color-surface-2)' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Informations de la carte</label>
                <div style={{ background: 'white', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline btn-lg" onClick={() => setStep(1)}>Retour</button>
              <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Vérifier la commande</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 24, fontWeight: 700 }}>Résumé de votre commande</h2>
            
            <div style={{ background: 'var(--color-surface-2)', padding: 24, borderRadius: 'var(--radius-md)', marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Sous-total ({cart.total_items} articles)</span>
                <span style={{ fontWeight: 600 }}>{subtotal.toFixed(3)} DT</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15, color: 'var(--color-success)' }}>
                  <span>Réduction (Code promo)</span>
                  <span style={{ fontWeight: 600 }}>-{discount.toFixed(3)} DT</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 15 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Livraison ({selectedShipping?.name})</span>
                <span style={{ fontWeight: 600 }}>{shippingCost === 0 ? 'Gratuit' : `${shippingCost.toFixed(3)} DT`}</span>
              </div>
              <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>Total à payer</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-accent)' }}>{total.toFixed(3)} DT</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline btn-lg" onClick={() => setStep(2)} disabled={placing}>Retour</button>
              <button className="btn btn-accent btn-lg" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? 'Traitement en cours...' : `Payer ${total.toFixed(3)} DT`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
}
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore, useWishlistStore } from '../../services/store';
import { userAPI, notificationAPI } from '../../services/api';
import ProductCard from '../../components/products/ProductCard';

// ==================== PROFILE PAGE ====================
export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Tunisie',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [saving, setSaving] = useState(false);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await userAPI.getAddresses();
      const data = res.data;
      return Array.isArray(data) ? data : Array.isArray(data.addresses) ? data.addresses : Array.isArray(data.data) ? data.data : [];
    },
  });

  const safeAddresses = Array.isArray(addresses) ? addresses : [];

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(profileForm);
      updateUser(res.data);
      toast.success('Profil mis à jour !');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setSaving(true);
    try {
      await userAPI.changePassword(passwordForm);
      toast.success('Mot de passe changé !');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.old_password || 'Erreur');
    }
    setSaving(false);
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAPI.createAddress(addressForm);
      toast.success('Adresse ajoutée !');
      setShowAddressForm(false);
      setAddressForm({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'Tunisie' });
      qc.invalidateQueries(['addresses']);
    } catch (err) {
      toast.error('Erreur lors de l\'ajout de l\'adresse');
    }
    setSaving(false);
  };

  const TABS = [
    { id: 'profile', label: 'Mon profil' },
    { id: 'orders', label: 'Mes commandes (Suivi)' },
    { id: 'addresses', label: 'Adresses' },
    { id: 'security', label: 'Sécurité' },
  ];

  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px 0 80px', minHeight: '80vh', background: 'var(--color-surface-2)' }}>
      <div className="container" style={{ maxWidth: 900 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40, background: 'var(--color-surface)', padding: 32, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(230,57,70,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{user?.first_name} {user?.last_name}</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          
          <div style={{ width: 240, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => {
                if (t.id === 'orders') navigate('/account/orders');
                else setActiveTab(t.id);
              }} style={{
                width: '100%', padding: '16px 20px', textAlign: 'left', background: activeTab === t.id ? 'rgba(230,57,70,0.05)' : 'transparent',
                border: 'none', borderLeft: activeTab === t.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                borderBottom: '1px solid var(--color-border)', cursor: 'pointer', fontSize: 15, fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)', transition: 'all 0.2s', fontFamily: 'var(--font-body)'
              }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, background: 'var(--color-surface)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Informations personnelles</h2>
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">Prénom</label>
                      <input className="form-input" value={profileForm.first_name} onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nom</label>
                      <input className="form-input" value={profileForm.last_name} onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Téléphone</label>
                    <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Carnet d'adresses</h2>
                  {!showAddressForm && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddressForm(true)}>+ Ajouter une adresse</button>
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
                      <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Ajout...' : 'Ajouter l\'adresse'}</button>
                    </div>
                  </form>
                )}

                {safeAddresses.length === 0 && !showAddressForm ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px 0' }}>Aucune adresse enregistrée</p>
                ) : (
                  <div style={{ display: 'grid', gap: 16 }}>
                    {safeAddresses.map(addr => (
                      <div key={addr.id} style={{ border: `1px solid ${addr.is_default ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', padding: 20, position: 'relative' }}>
                        {addr.is_default && (
                          <span style={{ position: 'absolute', top: 20, right: 20, fontSize: 11, fontWeight: 700, background: 'rgba(230,57,70,0.1)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: 100 }}>Défaut</span>
                        )}
                        <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{addr.full_name}</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 4 }}>{addr.address_line1} {addr.address_line2}</p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 8 }}>{addr.city}, {addr.postal_code}</p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Tél: {addr.phone}</p>

                        {!addr.is_default && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ marginTop: 16 }}
                            onClick={() => userAPI.setDefaultAddress(addr.id).then(() => { qc.invalidateQueries(['addresses']); toast.success('Adresse par défaut mise à jour'); })}
                          >
                            Définir par défaut
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Sécurité du compte</h2>
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
                  <div className="form-group">
                    <label className="form-label">Ancien mot de passe</label>
                    <input className="form-input" type="password" value={passwordForm.old_password} onChange={e => setPasswordForm(f => ({ ...f, old_password: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nouveau mot de passe</label>
                    <input className="form-input" type="password" value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirmer le nouveau mot de passe</label>
                    <input className="form-input" type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} required />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Mise à jour...' : 'Changer le mot de passe'}</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== WISHLIST ====================
export function WishlistPage() {
  const { items, fetchWishlist } = useWishlistStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <div>
      <h1>Wishlist</h1>
      {items.length === 0 ? (
        <p>Aucun favori</p>
      ) : (
        items.map(p => <ProductCard key={p.id} product={p} />)
      )}
    </div>
  );
}

// ==================== NOTIFICATIONS ====================
export function NotificationsPage() {
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications().then(r => r.data),
  });

  const notifications = Array.isArray(data)
    ? data
    : data?.results || [];

  return (
    <div>
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p>Aucune notification</p>
      ) : (
        notifications.map(n => (
          <div key={n.id}>
            <p>{n.title}</p>
            <p>{n.message}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default ProfilePage;
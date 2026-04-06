import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    date_of_birth: user?.date_of_birth || '',
  });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userAPI.getAddresses().then(r => r.data),
  });

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
    try {
      await userAPI.changePassword(passwordForm);
      toast.success('Mot de passe changé !');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.old_password || 'Erreur');
    }
  };

  const TABS = [
    { id: 'profile', label: 'Mon profil' },
    { id: 'addresses', label: 'Adresses' },
    { id: 'security', label: 'Sécurité' },
  ];

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36, background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-surface-3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>{user?.first_name} {user?.last_name}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 2 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {user?.is_email_verified && <span style={{ fontSize: 11, background: 'rgba(45,198,83,0.1)', color: '#15803D', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>Email vérifié</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Informations personnelles</h2>
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input className="form-input" value={profileForm.first_name} onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input className="form-input" value={profileForm.last_name} onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
                <span className="form-hint">L'email ne peut pas être modifié</span>
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+216 XX XXX XXX" />
              </div>
              <div className="form-group">
                <label className="form-label">Date de naissance</label>
                <input type="date" className="form-input" value={profileForm.date_of_birth} onChange={e => setProfileForm(f => ({ ...f, date_of_birth: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Mes adresses</h2>
            </div>
            {addresses.length === 0 ? (
              <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>Aucune adresse enregistrée</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {addresses.map(addr => (
                  <div key={addr.id} style={{ background: 'white', border: `1.5px solid ${addr.is_default ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{addr.type === 'home' ? 'Domicile' : addr.type === 'work' ? 'Travail' : 'Autre'}</span>
                        {addr.is_default && <span style={{ fontSize: 10, background: 'rgba(10,10,15,0.08)', fontWeight: 700, padding: '2px 7px', borderRadius: '100px' }}>Défaut</span>}
                      </div>
                      {!addr.is_default && (
                        <button onClick={() => userAPI.setDefaultAddress(addr.id).then(() => qc.invalidateQueries(['addresses']))}
                          style={{ fontSize: 11, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                          Définir par défaut
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
                      {addr.full_name}<br />
                      {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                      {addr.city}, {addr.state} {addr.postal_code}<br />
                      {addr.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Changer le mot de passe</h2>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 400 }}>
              <div className="form-group">
                <label className="form-label">Mot de passe actuel</label>
                <input type="password" className="form-input" value={passwordForm.old_password} onChange={e => setPasswordForm(f => ({ ...f, old_password: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <input type="password" className="form-input" value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} required />
                <span className="form-hint">Minimum 8 caractères</span>
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe</label>
                <input type="password" className="form-input" value={passwordForm.confirm_password} onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} required />
              </div>
              <button className="btn btn-primary" type="submit">Changer le mot de passe</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== WISHLIST PAGE ====================
export function WishlistPage() {
  const { items, fetchWishlist, toggle } = useWishlistStore();

  React.useEffect(() => { fetchWishlist(); }, []);

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 28 }}>
          Mes favoris {items.length > 0 && <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-muted)' }}>({items.length})</span>}
        </h1>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Aucun favori</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Ajoutez des produits à vos favoris en cliquant sur le cœur</p>
            <Link to="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>Découvrir les produits</Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== NOTIFICATIONS PAGE ====================
export function NotificationsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications().then(r => r.data),
  });

  const notifications = data?.results || data || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const NOTIF_ICONS = {
    order_confirmed: { bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
    order_shipped: { bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
    order_delivered: { bg: 'rgba(45,198,83,0.1)', color: '#15803D' },
    order_cancelled: { bg: 'rgba(230,57,70,0.1)', color: 'var(--color-accent)' },
    promo: { bg: 'rgba(244,162,97,0.1)', color: '#D97706' },
    default: { bg: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' },
  };

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 680 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>Notifications</h1>
            {unreadCount > 0 && <p style={{ color: 'var(--color-accent)', fontSize: 14, fontWeight: 600, marginTop: 4 }}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>}
          </div>
          {unreadCount > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => notificationAPI.markAllRead().then(() => refetch())}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1.5" style={{ marginBottom: 14 }}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <p style={{ color: 'var(--color-text-muted)' }}>Aucune notification</p>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            {notifications.map((notif, i) => {
              const style = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
              return (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  style={{ borderBottom: i < notifications.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  onClick={() => !notif.is_read && notificationAPI.markRead(notif.id).then(() => refetch())}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontWeight: notif.is_read ? 500 : 700, fontSize: 14 }}>{notif.title}</p>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: 12 }}>
                        {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{notif.message}</p>
                  </div>
                  {!notif.is_read && <div className="notification-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;

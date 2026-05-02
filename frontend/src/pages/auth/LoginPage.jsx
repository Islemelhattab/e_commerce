// LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../services/store';

const EyeIcon = ({ show }) => show ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };
    const result = await login(payload);
    if (result.success) {
      toast.success('Connexion réussie !');
      navigate(redirect);
    } else {
      const msg = result.error?.detail || result.error?.non_field_errors?.[0] || 'Email ou mot de passe incorrect';
      toast.error(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-2)', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Shop<span style={{ color: 'var(--color-accent)' }}>Wave</span>
          </Link>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '40px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Bon retour !</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 28 }}>Connectez-vous à votre compte ShopWave</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email" className="form-input" placeholder="votre@email.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mot de passe</span>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
                  Oublié ?
                </Link>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} className="form-input" placeholder="••••••••" required
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: 44 }} autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                  <EyeIcon show={showPass} />
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={isLoading} style={{ width: '100%', marginTop: 4 }}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--color-text-muted)' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

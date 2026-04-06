import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../services/store';
import { authAPI } from '../../services/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    cin: '', password: '', password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1 = personal, 2 = credentials

  const update = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.first_name) errs.first_name = 'Requis';
    if (!form.last_name) errs.last_name = 'Requis';
    if (!form.email) errs.email = 'Requis';
    if (form.password.length < 8) errs.password = 'Minimum 8 caractères';
    if (form.password !== form.password_confirm) errs.password_confirm = 'Les mots de passe ne correspondent pas';

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const result = await register(form);
    if (result.success) {
      toast.success('Compte créé ! Vérifiez votre email.');
      navigate('/');
    } else {
      const apiErrs = result.error || {};
      setErrors(apiErrs);
      toast.error(apiErrs.email?.[0] || apiErrs.detail || 'Erreur lors de la création du compte');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-2)', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Shop<span style={{ color: 'var(--color-accent)' }}>Wave</span>
          </Link>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '40px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Créer un compte</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 28 }}>Rejoignez des milliers de clients ShopWave</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input className={`form-input ${errors.first_name ? 'error' : ''}`} placeholder="Mohamed" value={form.first_name} onChange={e => update('first_name', e.target.value)} />
                {errors.first_name && <span className="form-error">{errors.first_name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input className={`form-input ${errors.last_name ? 'error' : ''}`} placeholder="Ben Ali" value={form.last_name} onChange={e => update('last_name', e.target.value)} />
                {errors.last_name && <span className="form-error">{errors.last_name}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="votre@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
              {errors.email && <span className="form-error">{errors.email[0] || errors.email}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input type="tel" className="form-input" placeholder="+216 XX XXX XXX" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CIN</label>
                <input className={`form-input ${errors.cin ? 'error' : ''}`} placeholder="12345678" value={form.cin} onChange={e => update('cin', e.target.value)} />
                {errors.cin && <span className="form-error">{errors.cin[0] || errors.cin}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe *</label>
              <input type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Minimum 8 caractères" value={form.password} onChange={e => update('password', e.target.value)} />
              {errors.password && <span className="form-error">{errors.password[0] || errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe *</label>
              <input type="password" className={`form-input ${errors.password_confirm ? 'error' : ''}`} placeholder="Répétez votre mot de passe" value={form.password_confirm} onChange={e => update('password_confirm', e.target.value)} />
              {errors.password_confirm && <span className="form-error">{errors.password_confirm}</span>}
            </div>

            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              En créant un compte, vous acceptez nos{' '}
              <Link to="/terms" style={{ color: 'var(--color-primary)' }}>Conditions générales</Link>{' '}et notre{' '}
              <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>Politique de confidentialité</Link>.
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={isLoading} style={{ width: '100%' }}>
              {isLoading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--color-text-muted)' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Erreur, réessayez');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-2)', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Shop<span style={{ color: 'var(--color-accent)' }}>Wave</span>
          </Link>
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '40px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(45,198,83,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Email envoyé !</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
                Si cet email existe, vous recevrez un lien de réinitialisation sous peu.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Retour à la connexion</Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Mot de passe oublié</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 28 }}>Entrez votre email pour recevoir un lien de réinitialisation</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="votre@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
                <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>← Retour à la connexion</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

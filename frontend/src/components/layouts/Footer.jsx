import React from 'react';
import { Link } from 'react-router-dom';

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.1 1.16 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-primary)', color: 'white', marginTop: 80 }}>
      {/* Newsletter */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '48px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                Restez informé des meilleures offres
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>
                Inscrivez-vous à notre newsletter et recevez 10% de réduction sur votre première commande.
              </p>
            </div>
            <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', gap: 0 }}>
              <input
                type="email"
                placeholder="Votre adresse email"
                style={{
                  flex: 1, padding: '14px 20px', background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.12)', borderRight: 'none',
                  borderRadius: '12px 0 0 12px', color: 'white', fontFamily: 'var(--font-body)',
                  fontSize: 14, outline: 'none'
                }}
              />
              <button
                type="submit"
                className="btn btn-accent"
                style={{ borderRadius: '0 12px 12px 0', padding: '14px 24px', whiteSpace: 'nowrap' }}
              >
                S'inscrire
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div style={{ padding: '56px 0 40px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.03em' }}>
                Shop<span style={{ color: 'var(--color-accent)' }}>Wave</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, marginBottom: 24, maxWidth: 280 }}>
                Votre marketplace de confiance en Tunisie. Des milliers de produits, 
                des prix compétitifs, une livraison rapide.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { icon: <FacebookIcon />, href: '#' },
                  { icon: <InstagramIcon />, href: '#' },
                  { icon: <TwitterIcon />, href: '#' },
                ].map((s, i) => (
                  <a
                    key={i} href={s.href}
                    style={{
                      width: 38, height: 38, borderRadius: '8px',
                      background: 'rgba(255,255,255,0.08)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: 'Boutique',
                links: [
                  { label: 'Tous les produits', to: '/products' },
                  { label: 'Nouveautés', to: '/products?is_new=true' },
                  { label: 'Promotions', to: '/products?discount=true' },
                  { label: 'Meilleures ventes', to: '/products?ordering=-sales_count' },
                ]
              },
              {
                title: 'Mon compte',
                links: [
                  { label: 'Mon profil', to: '/account/profile' },
                  { label: 'Mes commandes', to: '/account/orders' },
                  { label: 'Mes favoris', to: '/account/wishlist' },
                  { label: 'Notifications', to: '/account/notifications' },
                ]
              },
              {
                title: 'Aide',
                links: [
                  { label: 'FAQ', to: '/faq' },
                  { label: 'Livraison & retours', to: '/shipping' },
                  { label: 'Conditions générales', to: '/terms' },
                  { label: 'Politique de confidentialité', to: '/privacy' },
                ]
              }
            ].map((col) => (
              <div key={col.title}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>
                  {col.title}
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(link => (
                    <li key={link.to}>
                      <Link to={link.to} style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 14, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.target.style.color = 'white'}
                        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <a href="mailto:contact@shopwave.tn" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>
              <MailIcon /> contact@shopwave.tn
            </a>
            <a href="tel:+21671000000" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>
              <PhoneIcon /> +216 71 000 000
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            © 2024 ShopWave. Tous droits réservés.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Visa', 'Mastercard', 'PayPal', 'COD'].map(m => (
              <span key={m} style={{
                padding: '4px 10px', background: 'rgba(255,255,255,0.08)',
                borderRadius: '6px', fontSize: 11, fontWeight: 700,
                color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em'
              }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

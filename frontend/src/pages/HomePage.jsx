import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productAPI } from '../services/api';
import ProductCard from '../components/products/ProductCard';

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const TruckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
  </svg>
);
const HeadsetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z"/>
    <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
  </svg>
);

const CATEGORIES = [
  { name: 'Électronique', slug: 'electronics', color: '#EEF2FF', emoji: null, count: '1,240+' },
  { name: 'Mode', slug: 'fashion', color: '#FFF1F2', emoji: null, count: '3,580+' },
  { name: 'Maison', slug: 'home', color: '#F0FDF4', emoji: null, count: '890+' },
  { name: 'Sports', slug: 'sports', color: '#FFF7ED', emoji: null, count: '650+' },
  { name: 'Beauté', slug: 'beauty', color: '#FDF4FF', emoji: null, count: '420+' },
  { name: 'Livres', slug: 'books', color: '#F0F9FF', emoji: null, count: '2,100+' },
];

export default function HomePage() {
  const navigate = useNavigate();

  const { data: featured = [] } = useQuery({
    queryKey: ['featured'],
    queryFn: () => productAPI.getFeatured().then(r => r.data),
  });
  const { data: newArrivals = [] } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: () => productAPI.getNewArrivals().then(r => r.data),
  });
  const { data: bestSellers = [] } = useQuery({
    queryKey: ['best-sellers'],
    queryFn: () => productAPI.getBestSellers().then(r => r.data),
  });

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="container">
          <div className="hero__grid">
            <div>
              <div className="hero__eyebrow">Nouvelle Collection 2024</div>
              <h1 className="hero__title">
                Découvrez le<br/>
                Shopping <em>Réinventé</em>
              </h1>
              <p className="hero__subtitle">
                Des milliers de produits premium, des prix imbattables, 
                une expérience d'achat fluide et sécurisée.
              </p>
              <div className="hero__actions">
                <Link to="/products" className="btn btn-accent btn-xl">
                  Découvrir maintenant
                </Link>
                <Link to="/category/new" className="btn btn-outline btn-xl" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  Nouveautés
                </Link>
              </div>
              <div className="hero__stats">
                <div>
                  <div className="hero__stat-num">50K+</div>
                  <div className="hero__stat-label">Produits</div>
                </div>
                <div>
                  <div className="hero__stat-num">200K+</div>
                  <div className="hero__stat-label">Clients</div>
                </div>
                <div>
                  <div className="hero__stat-num">4.9★</div>
                  <div className="hero__stat-label">Note moyenne</div>
                </div>
              </div>
            </div>
            <div className="hero__image">
              <div style={{
                background: 'linear-gradient(135deg, rgba(230,57,70,0.1), rgba(244,162,97,0.1))',
                aspectRatio: '4/5', borderRadius: 'var(--radius-xl)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BADGES ===== */}
      <section style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, padding: '0' }}>
            {[
              { icon: <TruckIcon />, title: 'Livraison rapide', desc: 'En 24-48h partout en Tunisie' },
              { icon: <ShieldIcon />, title: 'Paiement sécurisé', desc: '100% sécurisé et chiffré' },
              { icon: <RefreshIcon />, title: 'Retour facile', desc: '30 jours pour changer d\'avis' },
              { icon: <HeadsetIcon />, title: 'Support 24/7', desc: 'Nous sommes là pour vous' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '24px 32px',
                borderRight: i < 3 ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)'
              }}>
                <div style={{ color: 'var(--color-accent)', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)' }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Catégories</h2>
              <p className="section-subtitle">Explorez notre catalogue par catégorie</p>
            </div>
            <Link to="/products" className="btn btn-ghost" style={{ gap: 8 }}>
              Tout voir <ArrowRightIcon />
            </Link>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={`category-card animate-fadeInUp stagger-${i + 1}`}
                style={{ textDecoration: 'none', background: cat.color }}
              >
                <div className="category-card__overlay">
                  <div>
                    <div className="category-card__name">{cat.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{cat.count} produits</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      {featured.length > 0 && (
        <section style={{ padding: '0 0 64px' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Produits en vedette</h2>
                <p className="section-subtitle">Sélectionnés par notre équipe</p>
              </div>
              <Link to="/products?featured=true" className="btn btn-ghost" style={{ gap: 8 }}>
                Tout voir <ArrowRightIcon />
              </Link>
            </div>
            <div className="product-grid">
              {featured.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PROMO BANNER ===== */}
      <section style={{ padding: '0 0 64px' }}>
        <div className="container">
          <div className="promo-banner">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: 12 }}>
                Offre limitée
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: 'white', marginBottom: 12, fontFamily: 'var(--font-display)' }}>
                Soldes d'été — Jusqu'à <span style={{ color: 'var(--color-accent)' }}>60% OFF</span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 28, maxWidth: 480 }}>
                Profitez de nos meilleures offres sur une sélection de produits premium. 
                Durée limitée, ne manquez pas cette opportunité !
              </p>
              <Link to="/products?discount=true" className="btn btn-accent btn-lg">
                Voir les offres
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEW ARRIVALS ===== */}
      {newArrivals.length > 0 && (
        <section style={{ padding: '0 0 64px', background: 'var(--color-surface-2)' }}>
          <div className="container" style={{ paddingTop: 64 }}>
            <div className="section-header">
              <div>
                <h2 className="section-title">Nouveautés</h2>
                <p className="section-subtitle">Les dernières arrivées dans notre boutique</p>
              </div>
              <Link to="/products?is_new=true" className="btn btn-ghost" style={{ gap: 8 }}>
                Tout voir <ArrowRightIcon />
              </Link>
            </div>
            <div className="product-grid">
              {newArrivals.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== BEST SELLERS ===== */}
      {bestSellers.length > 0 && (
        <section style={{ padding: '64px 0' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Meilleures ventes</h2>
                <p className="section-subtitle">Les plus populaires du moment</p>
              </div>
              <Link to="/products?ordering=-sales_count" className="btn btn-ghost" style={{ gap: 8 }}>
                Tout voir <ArrowRightIcon />
              </Link>
            </div>
            <div className="product-grid">
              {bestSellers.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

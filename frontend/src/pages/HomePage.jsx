import React from 'react';
import { Link } from 'react-router-dom';
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

const CURATED_BLOCKS = [
  { title: 'Marques tunisiennes', detail: 'Une sélection locale mise à jour régulièrement.' },
  { title: 'Produits pratiques', detail: 'Des articles utiles pour la maison et le quotidien.' },
  { title: 'Offres limitées', detail: 'Des promotions temporaires sur des produits populaires.' },
];

const SHOPPING_IDEAS = [
  { name: 'Travail et bureau', desc: 'Voir les produits utiles pour travailler', target: '/category/electronics' },
  { name: 'Confort maison', desc: 'Voir les produits pour la maison', target: '/category/home' },
  { name: 'Sport et forme', desc: 'Voir les produits pour le sport', target: '/category/sports' },
  { name: 'Soins et beauté', desc: 'Voir les produits beauté', target: '/category/beauty' },
  { name: 'Pack détente du soir', desc: 'Sélection rapide pour se relaxer', target: '/products?category_slug=home&ordering=-average_rating' },
];

export default function HomePage() {
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
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productAPI.getCategories().then(r => r.data.results || r.data || []),
  });

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="hero hero--radar">
        <div className="container">
          <div className="hero__grid">
            <div>
              <div className="hero__eyebrow">Nos meilleures sélections</div>
              <h1 className="hero__title">
                Le shopping devient
                <br />
                une <em>expérience simple</em>
              </h1>
              <p className="hero__subtitle">
                Découvrez des produits utiles, bien notés et adaptés à vos besoins,
                avec une navigation claire et rapide.
              </p>
              <div className="hero__actions">
                <Link to="/products" className="btn btn-accent btn-xl">
                  Voir les produits
                </Link>
                <Link to="/products?is_new=true" className="btn btn-outline btn-xl" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  Nouveautés
                </Link>
              </div>
              <div className="hero__stats">
                <div>
                  <div className="hero__stat-num">12</div>
                  <div className="hero__stat-label">Sélections mensuelles</div>
                </div>
                <div>
                  <div className="hero__stat-num">24h</div>
                  <div className="hero__stat-label">Livraison express</div>
                </div>
                <div>
                  <div className="hero__stat-num">4.9★</div>
                  <div className="hero__stat-label">Satisfaction clients</div>
                </div>
              </div>
            </div>
            <div className="hero__image">
              <div className="hero-radar-card">
                <div className="hero-radar-card__header">
                  <span>Sélection active</span>
                  <span>LIVE</span>
                </div>
                <div className="hero-radar-grid">
                  {CURATED_BLOCKS.map((item) => (
                    <div key={item.title} className="hero-radar-grid__item">
                      <h4>{item.title}</h4>
                      <p>{item.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="hero-radar-card__footer">Mise à jour des offres chaque semaine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="curation-strip">
        <div className="container curation-strip__inner">
          <p>Des produits clairs, utiles et faciles à comparer.</p>
          <Link to="/products?ordering=-created_at" className="btn btn-primary btn-sm">
            Voir les nouveautés
          </Link>
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
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={`category-card animate-fadeInUp stagger-${i + 1}`}
                style={{ 
                  textDecoration: 'none', 
                  backgroundImage: `url(${cat.image || 'https://via.placeholder.com/400?text=ShopWave'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="category-card__overlay">
                  <div>
                    <div className="category-card__name">{cat.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{cat.products_count || 0} produits</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mood-lab">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Idées d'achat</h2>
              <p className="section-subtitle">Choisissez un besoin pour aller plus vite.</p>
            </div>
          </div>
          <div className="mood-lab__grid">
            {SHOPPING_IDEAS.map((idea) => (
              <Link key={idea.name} to={idea.target} className="mood-lab__card">
                <h3>{idea.name}</h3>
                <p>{idea.desc}</p>
                <span>Voir la sélection</span>
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
                Offre spéciale
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: 'white', marginBottom: 12, fontFamily: 'var(--font-display)' }}>
                Promotions du moment — Jusqu'à <span style={{ color: 'var(--color-accent)' }}>40% OFF</span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 28, maxWidth: 480 }}>
                Profitez des meilleures réductions sur une sélection de produits
                populaires. Offre limitée.
              </p>
              <Link to="/products?discount=true" className="btn btn-accent btn-lg">
                Voir les promotions
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

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productAPI, reviewAPI } from '../services/api';
import { useCartStore, useWishlistStore, useAuthStore } from '../services/store';
import ProductCard from '../components/products/ProductCard';

const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'var(--color-accent)' : 'none'} stroke={filled ? 'var(--color-accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const RefreshCcwIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
  </svg>
);

function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s} type="button"
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 2, transition: 'transform 0.1s', transform: hover >= s ? 'scale(1.2)' : 'scale(1)' }}
        >
          <svg width={size} height={size} viewBox="0 0 24 24"
            fill={(hover || value) >= s ? '#F59E0B' : 'none'}
            stroke={(hover || value) >= s ? '#F59E0B' : '#D1D1E0'}
            strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productAPI.getProduct(slug).then(r => r.data),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => reviewAPI.getProductReviews(product.id).then(r => r.data.results || r.data),
    enabled: !!product?.id,
  });

  const { data: similar = [] } = useQuery({
    queryKey: ['similar', slug],
    queryFn: () => productAPI.getSimilar(slug).then(r => r.data),
    enabled: !!product,
  });

  const inWishlist = isInWishlist(product?.id);
  const images = product?.images || [];
  const currentPrice = selectedVariant?.price || product?.price;

  const handleAddToCart = async () => {
    if (!product?.in_stock) return;
    setAddingToCart(true);
    const result = await addToCart(product.id, selectedVariant?.id, quantity);
    setAddingToCart(false);
    if (result.success) {
      toast.success('Produit ajouté au panier !');
    } else if (result.requiresAuth) {
      toast.error('Veuillez vous connecter avant de continuer');
      navigate(`/login?redirect=/products/${slug}`);
    } else {
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    await toggle(product.id);
    toast.success(inWishlist ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      await reviewAPI.createReview({ product: product.id, ...reviewForm });
      toast.success('Avis publié avec succès !');
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch {
      toast.error('Erreur lors de la publication');
    }
    setSubmittingReview(false);
  };

  if (isLoading) return (
    <div className="container" style={{ padding: '48px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[200, 100, 60, 80, 120].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 24, width: `${w}px` }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Produit non trouvé</div>;

  return (
    <div style={{ padding: '32px 0 80px' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb" style={{ marginBottom: 32 }}>
          <a href="/">Accueil</a><span className="breadcrumb-sep">/</span>
          <a href="/products">Produits</a><span className="breadcrumb-sep">/</span>
          {product.category && <><a href={`/category/${product.category.slug}`}>{product.category.name}</a><span className="breadcrumb-sep">/</span></>}
          <span style={{ color: 'var(--color-text)' }}>{product.name}</span>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, marginBottom: 64 }}>
          {/* Images */}
          <div>
            <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--color-surface-2)', aspectRatio: '1', marginBottom: 12, position: 'relative' }}>
              {images[selectedImage] ? (
                <img src={images[selectedImage].image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%239090A8' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M3 9l4-4 4 4 4-4 4 4'/%3E%3Ccircle cx='9' cy='14' r='2'/%3E%3C/svg%3E";
                    e.target.style.objectFit = 'none';
                    e.target.style.background = 'var(--color-surface-3, #F0F0F8)';
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                </div>
              )}
              {product.discount_percentage > 0 && (
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                  <span className="badge badge-sale" style={{ fontSize: 13 }}>-{product.discount_percentage}%</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    style={{
                      width: 72, height: 72, flexShrink: 0, border: i === selectedImage ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer', background: 'var(--color-surface-2)', padding: 0,
                      transition: 'border-color 0.15s'
                    }}
                  >
                    <img src={img.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%239090A8' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M3 9l4-4 4 4 4-4 4 4'/%3E%3Ccircle cx='9' cy='14' r='2'/%3E%3C/svg%3E";
                        e.target.style.objectFit = 'none';
                        e.target.style.background = 'var(--color-surface-3, #F0F0F8)';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && (
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                {product.brand.name}
              </div>
            )}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <StarRating value={Math.round(product.average_rating)} />
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                {parseFloat(product.average_rating).toFixed(1)} ({product.review_count} avis)
              </span>
              {product.sales_count > 0 && (
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>• {product.sales_count} ventes</span>
              )}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--color-primary)' }}>
                {parseFloat(currentPrice).toFixed(3)} DT
              </span>
              {product.compare_price && (
                <>
                  <span style={{ fontSize: 20, color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                    {parseFloat(product.compare_price).toFixed(3)} DT
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent)', background: 'var(--color-accent-muted)', padding: '3px 8px', borderRadius: '100px' }}>
                    -{product.discount_percentage}%
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
                {product.short_description}
              </p>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, color: 'var(--color-text-secondary)' }}>
                  Variante
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                      style={{
                        padding: '8px 16px', border: `2px solid ${selectedVariant?.id === v.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-sm)', background: selectedVariant?.id === v.id ? 'var(--color-primary)' : 'transparent',
                        color: selectedVariant?.id === v.id ? 'white' : 'var(--color-text)', fontSize: 13, fontWeight: 600,
                        cursor: v.stock > 0 ? 'pointer' : 'not-allowed', opacity: v.stock > 0 ? 1 : 0.4,
                        fontFamily: 'var(--font-body)', transition: 'all 0.15s'
                      }}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: product.in_stock ? 'var(--color-success)' : 'var(--color-error)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: product.in_stock ? 'var(--color-success)' : 'var(--color-error)' }}>
                {product.in_stock ? `En stock (${product.stock} disponibles)` : 'Rupture de stock'}
              </span>
            </div>

            {/* Qty + Add to cart */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div className="qty-control" style={{ height: 52 }}>
                <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 44, height: 52, fontSize: 18 }}>−</button>
                <span className="qty-value" style={{ width: 48, fontSize: 16, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} style={{ width: 44, height: 52, fontSize: 18 }} disabled={quantity >= product.stock}>+</button>
              </div>
              <button
                className="btn btn-accent btn-lg"
                style={{ flex: 1, height: 52 }}
                onClick={handleAddToCart}
                disabled={!product.in_stock || addingToCart}
              >
                {addingToCart ? 'Ajout...' : product.in_stock ? 'Ajouter au panier' : 'Indisponible'}
              </button>
              <button
                className="btn btn-icon"
                style={{ width: 52, height: 52, flexShrink: 0 }}
                onClick={handleWishlist}
                title="Ajouter aux favoris"
              >
                <HeartIcon filled={inWishlist} />
              </button>
            </div>

            <button
              className="btn btn-outline"
              style={{ width: '100%', marginBottom: 28 }}
              onClick={async () => {
                const result = await addToCart(product.id, selectedVariant?.id, quantity);
                if (result.success) {
                  navigate('/checkout');
                } else if (result.requiresAuth) {
                  toast.error('Connexion requise pour le paiement');
                  navigate(`/login?redirect=/products/${slug}`);
                } else {
                  toast.error('Impossible de lancer le paiement');
                }
              }}
            >
              Acheter maintenant
            </button>

            {/* Trust signals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
              {[
                { icon: <TruckIcon />, text: 'Livraison en 24-48h partout en Tunisie' },
                { icon: <ShieldIcon />, text: 'Paiement 100% sécurisé' },
                { icon: <RefreshCcwIcon />, text: 'Retour gratuit sous 30 jours' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="tabs">
            {[
              { id: 'description', label: 'Description' },
              { id: 'specs', label: 'Caractéristiques' },
              { id: 'reviews', label: `Avis (${product.review_count})` },
            ].map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div style={{ maxWidth: 720, lineHeight: 1.8, color: 'var(--color-text-secondary)', fontSize: 15 }}>
              {product.description}
            </div>
          )}

          {activeTab === 'specs' && (
            <div style={{ maxWidth: 600 }}>
              {product.attributes?.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {product.attributes.map((attr, i) => (
                      <tr key={attr.id} style={{ background: i % 2 === 0 ? 'var(--color-surface-2)' : 'transparent' }}>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', width: '40%' }}>{attr.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14 }}>{attr.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>Aucune caractéristique disponible</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48 }}>
              {/* Reviews list */}
              <div>
                {reviews.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', padding: '20px 0' }}>Aucun avis pour ce produit</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {reviews.map(review => (
                      <div key={review.id} style={{ padding: '20px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                              {review.user_name || 'Client vérifié'}
                              {review.is_verified_purchase && (
                                <span style={{ fontSize: 11, color: 'var(--color-success)', fontWeight: 600, marginLeft: 8 }}>✓ Achat vérifié</span>
                              )}
                            </div>
                            <StarRating value={review.rating} size={14} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {review.title && <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{review.title}</p>}
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Write review */}
              <div style={{ background: 'var(--color-surface-2)', padding: 24, borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Laisser un avis</h4>
                {!isAuthenticated ? (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 12, fontSize: 14 }}>Connectez-vous pour laisser un avis</p>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>Se connecter</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>Note *</label>
                      <StarRating value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Titre</label>
                      <input className="form-input" placeholder="Résumez votre expérience" value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Commentaire *</label>
                      <textarea
                        className="form-input" rows={4} required
                        placeholder="Décrivez votre expérience avec ce produit..."
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={submittingReview}>
                      {submittingReview ? 'Publication...' : 'Publier l\'avis'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Similar Products */}
        {similar.length > 0 && (
          <section style={{ marginTop: 80 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
              Achat dans la meme categorie
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              Completez votre achat avec des produits proches de cette selection.
            </p>
            <div className="product-grid">
              {similar.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

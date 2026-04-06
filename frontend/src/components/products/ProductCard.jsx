import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore, useWishlistStore, useAuthStore } from '../../services/store';

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const CartAddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
    <line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/>
  </svg>
);

const StarRating = ({ rating, count }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="product-card__rating">
      <div className="product-card__stars">
        {stars.map((s) => (
          <svg key={s} width="12" height="12" viewBox="0 0 24 24"
            fill={s <= Math.round(rating) ? '#F59E0B' : 'none'}
            stroke={s <= Math.round(rating) ? '#F59E0B' : '#D1D1E0'}
            strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        ))}
      </div>
      {count > 0 && <span className="product-card__review-count">({count})</span>}
    </div>
  );
};

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.in_stock) return;
    const result = await addToCart(product.id);
    if (result.success) {
      toast.success('Ajouté au panier !', { icon: null });
    } else {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await toggle(product.id);
    toast.success(inWishlist ? 'Retiré des favoris' : 'Ajouté aux favoris', { icon: null });
  };

  const primaryImage = product.primary_image;
  const hasDiscount = product.discount_percentage > 0;

  return (
    <div className={`product-card animate-fadeInUp stagger-${(index % 6) + 1}`}>
      <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="product-card__image-wrap">
          {primaryImage ? (
            <img src={primaryImage} alt={product.name} className="product-card__image" loading="lazy" />
          ) : (
            <div className="product-card__image" style={{ background: 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4 4-4 4 4"/>
                <circle cx="9" cy="14" r="2"/>
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="product-card__badge">
            {hasDiscount && <span className="badge badge-sale">-{product.discount_percentage}%</span>}
            {product.is_new && !hasDiscount && <span className="badge badge-new">Nouveau</span>}
            {!product.in_stock && <span className="badge badge-out">Rupture</span>}
          </div>

          {/* Hover Actions */}
          <div className="product-card__actions">
            <button
              className={`product-card__action-btn ${inWishlist ? 'active' : ''}`}
              onClick={handleWishlist}
              title="Ajouter aux favoris"
            >
              <HeartIcon filled={inWishlist} />
            </button>
            <button className="product-card__action-btn" title="Aperçu rapide">
              <EyeIcon />
            </button>
          </div>

          {/* Add to Cart (hover) */}
          {product.in_stock && (
            <button className="product-card__add-to-cart" onClick={handleAddToCart}>
              <CartAddIcon />
              Ajouter au panier
            </button>
          )}
        </div>

        <div className="product-card__body">
          {product.brand_name && <div className="product-card__brand">{product.brand_name}</div>}
          <h3 className="product-card__name">{product.name}</h3>
          <StarRating rating={product.average_rating} count={product.review_count} />
          <div className="product-card__price">
            <span className="price-current">{parseFloat(product.price).toFixed(3)} DT</span>
            {hasDiscount && (
              <>
                <span className="price-compare">{parseFloat(product.compare_price).toFixed(3)} DT</span>
                <span className="price-discount">-{product.discount_percentage}%</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

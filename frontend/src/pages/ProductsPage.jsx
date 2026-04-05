import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productAPI } from '../services/api';
import ProductCard from '../components/products/ProductCard';

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Nouveautés' },
  { value: 'price', label: 'Prix croissant' },
  { value: '-price', label: 'Prix décroissant' },
  { value: '-sales_count', label: 'Meilleures ventes' },
  { value: '-average_rating', label: 'Mieux notés' },
];

const RATINGS = [5, 4, 3, 2, 1];

function FilterGroup({ title, open, onToggle, children }) {
  return (
    <div className="filter-group">
      <div className="filter-group__title" onClick={onToggle}>
        <span>{title}</span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
          <ChevronDown />
        </span>
      </div>
      {open && <div style={{ paddingTop: 4 }}>{children}</div>}
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: categorySlug } = useParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    ordering: searchParams.get('ordering') || '-created_at',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    min_rating: searchParams.get('min_rating') || '',
    category_slug: categorySlug || searchParams.get('category_slug') || '',
    brand: searchParams.get('brand') || '',
    in_stock: searchParams.get('in_stock') || '',
  });
  const [openGroups, setOpenGroups] = useState({ sort: true, price: true, rating: true, brand: true, stock: true });
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const queryParams = {
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    page,
    page_size: 24,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productAPI.getProducts(queryParams).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => productAPI.getBrands().then(r => r.data),
  });

  const products = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 24);

  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    setSearchParams(params);
    setPage(1);
  }, [filters]);

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilter = (key) => updateFilter(key, '');
  const clearAllFilters = () => setFilters({ search: '', ordering: '-created_at', min_price: '', max_price: '', min_rating: '', category_slug: '', brand: '', in_stock: '' });

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) => v && k !== 'ordering').length;
  const toggleGroup = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const FilterSidebar = () => (
    <aside className="filter-sidebar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>Filtres</h3>
        {activeFiltersCount > 0 && (
          <button onClick={clearAllFilters} style={{ fontSize: 12, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            Réinitialiser ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterGroup title="Trier par" open={openGroups.sort} onToggle={() => toggleGroup('sort')}>
        {SORT_OPTIONS.map(opt => (
          <div key={opt.value} className="filter-option" onClick={() => updateFilter('ordering', opt.value)}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${filters.ordering === opt.value ? 'var(--color-primary)' : 'var(--color-border-dark)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {filters.ordering === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />}
            </div>
            <label style={{ cursor: 'pointer', fontSize: 14, color: filters.ordering === opt.value ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: filters.ordering === opt.value ? 600 : 400 }}>
              {opt.label}
            </label>
          </div>
        ))}
      </FilterGroup>

      {/* Price */}
      <FilterGroup title="Prix (DT)" open={openGroups.price} onToggle={() => toggleGroup('price')}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number" placeholder="Min" value={filters.min_price}
            onChange={e => updateFilter('min_price', e.target.value)}
            className="form-input" style={{ padding: '8px 10px', fontSize: 13 }}
          />
          <input
            type="number" placeholder="Max" value={filters.max_price}
            onChange={e => updateFilter('max_price', e.target.value)}
            className="form-input" style={{ padding: '8px 10px', fontSize: 13 }}
          />
        </div>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup title="Note minimum" open={openGroups.rating} onToggle={() => toggleGroup('rating')}>
        {RATINGS.map(r => (
          <div key={r} className="filter-option" onClick={() => updateFilter('min_rating', filters.min_rating == r ? '' : r)}>
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${filters.min_rating == r ? 'var(--color-primary)' : 'var(--color-border-dark)'}`, background: filters.min_rating == r ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {filters.min_rating == r && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < r ? '#F59E0B' : 'none'} stroke={i < r ? '#F59E0B' : '#D1D1E0'} strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              ))}
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>& plus</span>
            </div>
          </div>
        ))}
      </FilterGroup>

      {/* Brands */}
      {brandsData?.length > 0 && (
        <FilterGroup title="Marque" open={openGroups.brand} onToggle={() => toggleGroup('brand')}>
          {brandsData.slice(0, 10).map(brand => (
            <div key={brand.id} className="filter-option" onClick={() => updateFilter('brand', filters.brand === brand.slug ? '' : brand.slug)}>
              <input type="checkbox" readOnly checked={filters.brand === brand.slug} style={{ width: 15, height: 15, accentColor: 'var(--color-primary)' }} />
              <label style={{ cursor: 'pointer' }}>{brand.name}</label>
            </div>
          ))}
        </FilterGroup>
      )}

      {/* Stock */}
      <FilterGroup title="Disponibilité" open={openGroups.stock} onToggle={() => toggleGroup('stock')}>
        <div className="filter-option" onClick={() => updateFilter('in_stock', filters.in_stock === 'true' ? '' : 'true')}>
          <input type="checkbox" readOnly checked={filters.in_stock === 'true'} style={{ width: 15, height: 15, accentColor: 'var(--color-primary)' }} />
          <label style={{ cursor: 'pointer' }}>En stock uniquement</label>
        </div>
      </FilterGroup>
    </aside>
  );

  return (
    <div style={{ padding: '32px 0 64px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 6 }}>
            {categorySlug ? `Catégorie: ${categorySlug}` : filters.search ? `Résultats pour "${filters.search}"` : 'Tous les produits'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {isFetching ? 'Recherche...' : `${totalCount} produit${totalCount !== 1 ? 's' : ''} trouvé${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {filters.search && <FilterTag label={`Recherche: ${filters.search}`} onRemove={() => clearFilter('search')} />}
            {filters.min_price && <FilterTag label={`Min: ${filters.min_price} DT`} onRemove={() => clearFilter('min_price')} />}
            {filters.max_price && <FilterTag label={`Max: ${filters.max_price} DT`} onRemove={() => clearFilter('max_price')} />}
            {filters.min_rating && <FilterTag label={`${filters.min_rating}★ & plus`} onRemove={() => clearFilter('min_rating')} />}
            {filters.brand && <FilterTag label={`Marque: ${filters.brand}`} onRemove={() => clearFilter('brand')} />}
            {filters.in_stock && <FilterTag label="En stock" onRemove={() => clearFilter('in_stock')} />}
          </div>
        )}

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <FilterSidebar />

          {/* Products */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoading ? (
              <div className="product-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="product-card">
                    <div className="skeleton" style={{ aspectRatio: 1 }} />
                    <div style={{ padding: 16 }}>
                      <div className="skeleton" style={{ height: 16, marginBottom: 8, width: '60%' }} />
                      <div className="skeleton" style={{ height: 20, marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 18, width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Aucun produit trouvé</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Essayez de modifier vos filtres</p>
                <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={clearAllFilters}>Réinitialiser les filtres</button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                          border: p === page ? 'none' : '1.5px solid var(--color-border)',
                          background: p === page ? 'var(--color-primary)' : 'transparent',
                          color: p === page ? 'white' : 'var(--color-text-secondary)',
                          fontWeight: p === page ? 700 : 400, cursor: 'pointer',
                          fontFamily: 'var(--font-body)', fontSize: 14,
                          transition: 'all 0.15s'
                        }}
                      >{p}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)',
      borderRadius: '100px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)'
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'inherit', padding: 0 }}>
        <XIcon />
      </button>
    </span>
  );
}

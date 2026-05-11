import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCardDark from './ProductCardDark';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * eBay-style section: dark background, big title with truncation,
 * "Tout afficher" link top-right, 2-col mobile / 4-col desktop horizontal scroll grid.
 *
 * Props:
 *  - title: section title (e.g. "Tubes, conduits et tuyaux pour le système...")
 *  - subtitle: small text (e.g. "Nos recommandations pour vous")
 *  - products: optional pre-loaded array. If absent, will fetch from API.
 *  - fetchUrl: API path to fetch products (relative)
 *  - viewAllHref: link target for "Tout afficher"
 */
const ProductShowcase = ({
  title,
  subtitle = 'Nos recommandations pour vous',
  products: passedProducts,
  fetchUrl,
  viewAllHref = '/products',
  testId = 'product-showcase',
}) => {
  const hasPassedProducts = Array.isArray(passedProducts);
  const [products, setProducts] = useState(hasPassedProducts ? passedProducts : []);
  const [loading, setLoading] = useState(!hasPassedProducts && !!fetchUrl);

  // Re-sync when passedProducts updates from parent (async fetch in HomePage)
  useEffect(() => {
    if (hasPassedProducts) setProducts(passedProducts);
  }, [passedProducts, hasPassedProducts]);

  useEffect(() => {
    if (hasPassedProducts || !fetchUrl) return;
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${API_URL}${fetchUrl}`)
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res.data) ? res.data : res.data?.products || [];
        setProducts(data.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [fetchUrl, hasPassedProducts]);

  // Hide only if parent explicitly says no products and won't load any
  if (hasPassedProducts && passedProducts.length === 0 && !fetchUrl) {
    // Show loading skeleton for a brief moment in case parent is still fetching
    // Render skeleton always (better UX than empty)
  }

  return (
    <section
      className="bg-black text-white py-8 sm:py-10 px-4 sm:px-6 md:px-12 lg:px-24"
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-1">
        <h2
          className="font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight line-clamp-2 flex-1"
          data-testid={`${testId}-title`}
        >
          {title}
        </h2>
        <Link
          to={viewAllHref}
          className="text-white text-sm sm:text-base underline whitespace-nowrap hover:text-slate-300 flex-shrink-0 pb-1"
          data-testid={`${testId}-view-all`}
        >
          Tout afficher
        </Link>
      </div>
      {subtitle && (
        <p className="text-slate-400 text-sm sm:text-base mb-5">{subtitle}</p>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((p) => (
            <ProductCardDark key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductShowcase;

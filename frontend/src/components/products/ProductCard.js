import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye } from 'lucide-react';

const conditionLabels = {
  new: 'Neuf',
  used: 'Occasion',
  refurbished: 'Reconditionné'
};

const conditionColors = {
  new: 'bg-emerald-500',
  used: 'bg-amber-500',
  refurbished: 'bg-blue-500'
};

const ProductCard = ({ product, onAddToCart, onAddToWishlist }) => {
  const {
    id,
    title,
    price,
    images,
    condition,
    stock,
    compatible_brands = [],
    oem_reference
  } = product;

  const mainImage = images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image';

  return (
    <div 
      className="group bg-white border border-slate-200 hover:border-slate-900 transition-all duration-200 flex flex-col product-card"
      data-testid={`product-card-${id}`}
    >
      {/* Image Container */}
      <Link to={`/products/${id}`} className="block aspect-square w-full bg-slate-50 overflow-hidden relative">
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover image-zoom"
          loading="lazy"
        />
        {/* Condition Badge */}
        <span className={`absolute top-3 left-3 ${conditionColors[condition]} text-white text-xs font-bold px-2 py-1 uppercase`}>
          {conditionLabels[condition]}
        </span>
        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToWishlist?.(id);
            }}
            className="p-2 bg-white border border-slate-200 hover:border-slate-900 transition-colors"
            data-testid={`wishlist-btn-${id}`}
          >
            <Heart size={18} />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Brands */}
        {compatible_brands.length > 0 && (
          <p className="text-xs text-slate-500 mb-1">
            {compatible_brands.slice(0, 3).join(' • ')}
          </p>
        )}

        {/* Title */}
        <Link to={`/products/${id}`}>
          <h3 className="font-medium text-slate-900 line-clamp-2 mb-2 hover:text-[#FF3333] transition-colors">
            {title}
          </h3>
        </Link>

        {/* OEM Reference */}
        {oem_reference && (
          <p className="text-xs font-mono text-slate-400 mb-2">
            Réf: {oem_reference}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price & Stock */}
        <div className="mt-2">
          <p className="text-xl font-bold text-slate-900 price-tag">
            {price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
          <p className={`text-sm mt-1 ${stock > 5 ? 'stock-available' : stock > 0 ? 'stock-low' : 'stock-out'}`}>
            {stock > 5 ? 'En stock' : stock > 0 ? `Plus que ${stock} en stock` : 'Rupture de stock'}
          </p>
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart?.(id)}
          disabled={stock === 0}
          className="mt-4 w-full bg-[#0A0F1C] hover:bg-[#1F2937] disabled:bg-slate-300 text-white py-2.5 font-semibold transition-colors flex items-center justify-center gap-2 btn-transition"
          data-testid={`add-to-cart-${id}`}
        >
          <ShoppingCart size={18} />
          Ajouter au panier
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

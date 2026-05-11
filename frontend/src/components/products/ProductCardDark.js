import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MoreVertical } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const conditionLabels = {
  new: '🆕 NEUF',
  used: '♻️ OCCASION',
  refurbished: '🔧 RECOND.',
};

/**
 * eBay-style product card: dark theme, large image, heart + menu icons,
 * title 2-line truncated, big price.
 */
const ProductCardDark = ({ product, onAddToWishlist }) => {
  const { id, title, price, images, condition } = product;
  const { isAuthenticated } = useAuth();
  const mainImage = images?.[0] || 'https://via.placeholder.com/400x400/0A0F1C/FFFFFF?text=AUTOPARTS';

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return;
    }
    try {
      if (onAddToWishlist) {
        onAddToWishlist(id);
      } else {
        await axios.post(`${API_URL}/api/wishlist/${id}`, {}, { withCredentials: true });
        toast.success('Ajouté aux favoris');
      }
    } catch (err) { /* silent */ }
  };

  return (
    <Link
      to={`/products/${id}`}
      className="group block"
      data-testid={`product-card-dark-${id}`}
    >
      {/* Image with rounded corners */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 mb-3">
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Condition mini badge (top-left) */}
        {condition && (
          <span
            className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full"
            data-testid={`condition-badge-${id}`}
          >
            {conditionLabels[condition] || condition}
          </span>
        )}
        {/* Heart button (top-right) */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label="Ajouter aux favoris"
          data-testid={`heart-btn-${id}`}
        >
          <Heart size={18} className="text-white" />
        </button>
      </div>

      {/* Title + menu */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-white font-medium text-sm sm:text-base leading-snug line-clamp-2 flex-1">
          {title}
        </h3>
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="text-slate-400 p-0.5 flex-shrink-0"
          aria-label="Plus d'options"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Price */}
      <p className="text-white font-bold text-lg sm:text-xl" data-testid={`price-${id}`}>
        {Number(price).toLocaleString('fr-FR')} €
      </p>
    </Link>
  );
};

export default ProductCardDark;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WishlistPage = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchWishlist = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/wishlist`, { withCredentials: true });
        setWishlist(response.data);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, navigate]);

  const handleRemove = async (productId) => {
    try {
      await axios.delete(`${API_URL}/api/wishlist/${productId}`, { withCredentials: true });
      setWishlist(wishlist.filter((p) => p.id !== productId));
      toast.success('Produit retiré de la wishlist');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId);
      toast.success('Produit ajouté au panier');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="wishlist-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="px-6 md:px-12 lg:px-24">
          <Link to="/account" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4">
            <ChevronLeft size={18} />
            Retour au compte
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Ma wishlist</h1>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200">
            <Heart size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Votre wishlist est vide</h2>
            <p className="text-slate-500 mb-8">Ajoutez des produits à votre wishlist pour les retrouver plus tard</p>
            <Link to="/products">
              <Button>Découvrir nos produits</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <div 
                key={product.id} 
                className="bg-white border border-slate-200 flex flex-col"
                data-testid={`wishlist-item-${product.id}`}
              >
                <Link to={`/products/${product.id}`} className="block aspect-square bg-slate-50 overflow-hidden">
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/400'}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-medium text-slate-900 line-clamp-2 hover:text-[#FF3333] transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-xl font-bold mt-2">
                    {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className={`text-sm mt-1 ${product.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? 'En stock' : 'Rupture de stock'}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0}
                      className="flex-1 bg-[#0A0F1C] hover:bg-[#1F2937]"
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      <ShoppingCart size={16} className="mr-2" />
                      Ajouter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRemove(product.id)}
                      className="px-3"
                      data-testid={`remove-wishlist-${product.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;

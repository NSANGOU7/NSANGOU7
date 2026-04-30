import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import FreeShippingBar from '../components/common/FreeShippingBar';
import { toast } from 'sonner';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success('Produit retiré du panier');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour commander');
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white" data-testid="cart-page">
        <div className="px-6 md:px-12 lg:px-24 py-16 text-center">
          <ShoppingBag size={64} className="mx-auto text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Votre panier</h1>
          <p className="text-slate-500 mb-8">Connectez-vous pour voir votre panier</p>
          <Link to="/login">
            <Button data-testid="login-to-cart">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 md:px-12 lg:px-24 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="cart-page">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 py-8">
        <div className="px-6 md:px-12 lg:px-24">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Votre panier</h1>
          <p className="text-slate-600 mt-2">
            {cart.items.length} article{cart.items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {cart.items.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-cart">
            <ShoppingBag size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Votre panier est vide</h2>
            <p className="text-slate-500 mb-8">Découvrez nos produits et trouvez la pièce qu'il vous faut</p>
            <Link to="/products">
              <Button data-testid="browse-products">Voir les produits</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4" data-testid="cart-items">
              <FreeShippingBar subtotal={cart.total} />
              {cart.items.map((item) => (
                <div 
                  key={item.product_id} 
                  className="border border-slate-200 p-4 flex gap-4"
                  data-testid={`cart-item-${item.product_id}`}
                >
                  {/* Image */}
                  <Link to={`/products/${item.product_id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 bg-slate-50">
                      <img
                        src={item.product?.images?.[0] || 'https://via.placeholder.com/100'}
                        alt={item.product?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product_id}`}>
                      <h3 className="font-medium text-slate-900 hover:text-[#FF3333] transition-colors line-clamp-2">
                        {item.product?.title}
                      </h3>
                    </Link>
                    {item.product?.oem_reference && (
                      <p className="text-xs font-mono text-slate-400 mt-1">
                        Réf: {item.product.oem_reference}
                      </p>
                    )}
                    <p className="font-bold text-lg mt-2">
                      {item.product?.price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      data-testid={`remove-${item.product_id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="flex items-center border border-slate-200">
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-slate-50"
                        disabled={item.quantity <= 1}
                        data-testid={`decrease-${item.product_id}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 py-1 border-x border-slate-200 text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-slate-50"
                        data-testid={`increase-${item.product_id}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="font-semibold">
                      {item.subtotal?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1" data-testid="order-summary">
              <div className="bg-slate-50 border border-slate-200 p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Sous-total</span>
                    <span>{cart.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Livraison</span>
                    <span className={cart.total >= 99 ? 'text-emerald-600' : ''}>
                      {cart.total >= 99 ? 'Gratuite' : '9,90 €'}
                    </span>
                  </div>
                  {cart.total < 99 && (
                    <p className="text-xs text-slate-500">
                      Plus que {(99 - cart.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} pour la livraison gratuite
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                      {(cart.total + (cart.total >= 99 ? 0 : 9.90)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">TVA incluse</p>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-[#0A0F1C] hover:bg-[#1F2937] text-white py-6 font-semibold"
                  data-testid="checkout-btn"
                >
                  Passer commande
                  <ArrowRight size={18} className="ml-2" />
                </Button>

                <Link 
                  to="/products" 
                  className="block text-center text-sm text-slate-600 hover:text-slate-900 mt-4"
                >
                  Continuer mes achats
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;

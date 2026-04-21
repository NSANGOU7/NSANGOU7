import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AccountPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersRes, wishlistRes] = await Promise.all([
          axios.get(`${API_URL}/api/orders`, { withCredentials: true }),
          axios.get(`${API_URL}/api/wishlist`, { withCredentials: true })
        ]);
        setOrders(ordersRes.data);
        setWishlist(wishlistRes.data);
      } catch (error) {
        console.error('Error fetching account data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // If we're on a sub-route, render the Outlet
  if (location.pathname !== '/account') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="account-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="px-6 md:px-12 lg:px-24">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mon Compte</h1>
          <p className="text-slate-600 mt-2">Bonjour, {user?.name}</p>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white border border-slate-200 p-4 space-y-1">
              <Link
                to="/account"
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/account') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                data-testid="nav-dashboard"
              >
                <User size={18} />
                Tableau de bord
              </Link>
              <Link
                to="/account/orders"
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/account/orders') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                data-testid="nav-orders"
              >
                <Package size={18} />
                Mes commandes
              </Link>
              <Link
                to="/account/wishlist"
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/account/wishlist') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                data-testid="nav-wishlist"
              >
                <Heart size={18} />
                Ma wishlist
              </Link>
              <Link
                to="/account/settings"
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/account/settings') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                data-testid="nav-settings"
              >
                <Settings size={18} />
                Paramètres
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-slate-50 text-red-600 transition-colors"
                data-testid="nav-logout"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </nav>
          </div>

          {/* Main Content - Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-6">
                <p className="text-3xl font-bold">{orders.length}</p>
                <p className="text-sm text-slate-500 mt-1">Commandes</p>
              </div>
              <div className="bg-white border border-slate-200 p-6">
                <p className="text-3xl font-bold">{wishlist.length}</p>
                <p className="text-sm text-slate-500 mt-1">Wishlist</p>
              </div>
              <div className="bg-white border border-slate-200 p-6">
                <p className="text-3xl font-bold">{user?.addresses?.length || 0}</p>
                <p className="text-sm text-slate-500 mt-1">Adresses</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Commandes récentes</h2>
                <Link to="/account/orders" className="text-sm text-[#FF3333] hover:underline">
                  Voir tout
                </Link>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Aucune commande pour le moment</p>
                  <Link to="/products">
                    <Button className="mt-4">Découvrir nos produits</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      to={`/account/orders/${order.id}`}
                      className="flex items-center justify-between p-4 border border-slate-100 hover:border-slate-200 transition-colors"
                      data-testid={`order-${order.id}`}
                    >
                      <div>
                        <p className="font-medium">Commande #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')} • {order.items?.length} article(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {order.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                        <span className={`text-xs px-2 py-1 ${
                          order.status === 'delivered' ? 'status-delivered' :
                          order.status === 'shipped' ? 'status-shipped' :
                          order.status === 'confirmed' ? 'status-confirmed' :
                          'status-pending'
                        }`}>
                          {order.status === 'pending_payment' ? 'En attente' :
                           order.status === 'confirmed' ? 'Confirmée' :
                           order.status === 'shipped' ? 'Expédiée' :
                           order.status === 'delivered' ? 'Livrée' : order.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist Preview */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Ma wishlist</h2>
                <Link to="/account/wishlist" className="text-sm text-[#FF3333] hover:underline">
                  Voir tout
                </Link>
              </div>
              {wishlist.length === 0 ? (
                <div className="text-center py-8">
                  <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Votre wishlist est vide</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {wishlist.slice(0, 4).map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="group"
                    >
                      <div className="aspect-square bg-slate-50 mb-2 overflow-hidden">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/200'}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                      <p className="text-sm font-bold">
                        {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;

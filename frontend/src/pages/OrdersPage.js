import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronLeft, Truck, Check, Clock, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const statusLabels = {
  pending_payment: 'En attente de paiement',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée'
};

const statusIcons = {
  pending_payment: Clock,
  confirmed: Check,
  shipped: Truck,
  delivered: Package
};

const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/orders`, { withCredentials: true });
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="orders-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="px-6 md:px-12 lg:px-24">
          <Link to="/account" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4">
            <ChevronLeft size={18} />
            Retour au compte
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Mes commandes</h1>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200">
            <Package size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucune commande</h2>
            <p className="text-slate-500 mb-8">Vous n'avez pas encore passé de commande</p>
            <Link to="/products" className="text-[#FF3333] font-medium hover:underline">
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = statusIcons[order.status] || Clock;
              return (
                <div 
                  key={order.id} 
                  className="bg-white border border-slate-200 p-6"
                  data-testid={`order-card-${order.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="font-mono text-sm text-slate-500">#{order.id}</p>
                      <p className="font-semibold mt-1">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        <StatusIcon size={16} />
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-slate-100 pt-4 mb-4">
                    <div className="flex flex-wrap gap-4">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-slate-50 flex-shrink-0">
                            <img
                              src={`https://via.placeholder.com/64?text=${encodeURIComponent(item.title?.slice(0, 2) || 'P')}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                            <p className="text-xs text-slate-500">Qté: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="flex items-center justify-center w-16 h-16 bg-slate-100 text-sm text-slate-500">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-slate-100 gap-4">
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <CreditCard size={16} />
                        {order.payment_method === 'stripe' ? 'Carte bancaire' : 'Virement'}
                      </span>
                      {order.tracking_number && (
                        <span className="flex items-center gap-1">
                          <Truck size={16} />
                          Suivi: {order.tracking_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">
                        {order.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

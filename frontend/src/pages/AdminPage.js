import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Flame, Settings, ChevronRight, TrendingUp, AlertTriangle, DollarSign, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/stats`, { withCredentials: true }),
          axios.get(`${API_URL}/api/admin/sales-chart`, { withCredentials: true }),
        ]);
        setStats(statsRes.data);
        setSalesChart(chartRes.data?.series || []);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isAdmin, navigate]);

  const isActive = (path) => location.pathname === path;

  // If on sub-route, render Outlet
  if (location.pathname !== '/admin') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-page">
      {/* Header */}
      <div className="bg-[#0A0F1C] text-white py-4">
        <div className="px-6 md:px-12 lg:px-24 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xl font-bold">
              AUTO<span className="text-[#FF3333]">PARTS</span>
            </Link>
            <span className="ml-4 text-sm text-slate-400">Administration</span>
          </div>
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            Retour au site
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-60px)] hidden md:block">
          <nav className="p-4 space-y-1">
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/admin') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
              data-testid="admin-nav-dashboard"
            >
              <LayoutDashboard size={18} />
              Tableau de bord
            </Link>
            <Link
              to="/admin/products"
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/admin/products') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
              data-testid="admin-nav-products"
            >
              <Package size={18} />
              Produits
            </Link>
            <Link
              to="/admin/orders"
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/admin/orders') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
              data-testid="admin-nav-orders"
            >
              <ShoppingCart size={18} />
              Commandes
            </Link>
            <Link
              to="/admin/auctions"
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/admin/auctions') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
              data-testid="admin-nav-auctions"
            >
              <Flame size={18} />
              Enchères
            </Link>
            <Link
              to="/admin/chat"
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/admin/chat') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
              data-testid="admin-nav-chat"
            >
              <Users size={18} />
              Chat en direct
            </Link>
            <Link
              to="/admin/offers"
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive('/admin/offers') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
              data-testid="admin-nav-offers"
            >
              <TrendingUp size={18} />
              Offres clients
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 p-6 animate-pulse h-32" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="stat-card" data-testid="stat-revenue">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="stat-value text-emerald-600">
                        {stats?.revenue?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                      </p>
                      <p className="stat-label">Chiffre d'affaires</p>
                    </div>
                    <DollarSign size={24} className="text-emerald-600" />
                  </div>
                </div>

                <div className="stat-card" data-testid="stat-orders">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="stat-value">{stats?.orders?.total || 0}</p>
                      <p className="stat-label">Commandes totales</p>
                    </div>
                    <ShoppingCart size={24} className="text-slate-400" />
                  </div>
                </div>

                <div className="stat-card" data-testid="stat-products">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="stat-value">{stats?.products?.total || 0}</p>
                      <p className="stat-label">Produits</p>
                    </div>
                    <Package size={24} className="text-slate-400" />
                  </div>
                </div>

                <div className="stat-card" data-testid="stat-auctions">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="stat-value text-[#FF3333]">{stats?.active_auctions || 0}</p>
                      <p className="stat-label">Enchères actives</p>
                    </div>
                    <Flame size={24} className="text-[#FF3333]" />
                  </div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-amber-50 border border-amber-200 p-4 flex items-center gap-4">
                  <AlertTriangle size={24} className="text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-800">{stats?.products?.low_stock || 0}</p>
                    <p className="text-sm text-amber-700">Produits stock faible</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 flex items-center gap-4">
                  <ShoppingCart size={24} className="text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-800">{stats?.orders?.pending || 0}</p>
                    <p className="text-sm text-blue-700">En attente de paiement</p>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-4">
                  <Users size={24} className="text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-800">{stats?.total_users || 0}</p>
                    <p className="text-sm text-emerald-700">Utilisateurs inscrits</p>
                  </div>
                </div>
              </div>

              {/* Sales Chart 30 days */}
              <div className="bg-white border border-slate-200 p-6 mb-8" data-testid="sales-chart">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp size={18} /> Ventes des 30 derniers jours
                  </h2>
                  <span className="text-xs text-slate-500">
                    Total : {salesChart.reduce((s, p) => s + (p.revenue || 0), 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF3333" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#FF3333" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(d) => d?.slice(5)}
                        interval={Math.ceil(salesChart.length / 8)}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        formatter={(v, name) =>
                          name === 'revenue'
                            ? [`${Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, 'CA']
                            : [v, 'Commandes']
                        }
                        labelFormatter={(d) => `Date : ${d}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#FF3333"
                        strokeWidth={2}
                        fill="url(#revGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Commandes récentes</h2>
                  <Link to="/admin/orders" className="text-sm text-[#FF3333] hover:underline flex items-center gap-1">
                    Voir tout
                    <ChevronRight size={16} />
                  </Link>
                </div>
                {stats?.recent_orders?.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Aucune commande récente</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold">Commande</th>
                          <th className="text-left py-3 px-4 font-semibold">Client</th>
                          <th className="text-left py-3 px-4 font-semibold">Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Statut</th>
                          <th className="text-right py-3 px-4 font-semibold">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recent_orders?.map((order) => (
                          <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                            <td className="py-3 px-4">{order.user_name}</td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold">
                              {order.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;

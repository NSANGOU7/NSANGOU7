import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Truck, Check, Clock, Search, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const statusOptions = [
  { value: 'pending_payment', label: 'En attente de paiement', color: 'bg-amber-100 text-amber-700' },
  { value: 'confirmed', label: 'Confirmée', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'shipped', label: 'Expédiée', color: 'bg-blue-100 text-blue-700' },
  { value: 'delivered', label: 'Livrée', color: 'bg-emerald-100 text-emerald-700' }
];

const AdminOrdersPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/orders`, { withCredentials: true });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.tracking_number || '');
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    setUpdating(true);
    try {
      await axios.put(
        `${API_URL}/api/orders/${selectedOrder.id}/status`,
        { 
          status: newStatus,
          tracking_number: trackingNumber || null
        },
        { withCredentials: true }
      );
      toast.success('Commande mise à jour');
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/export-orders`,
        { withCredentials: true, responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `commandes_autoparts_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export CSV téléchargé');
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchQuery || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return Package;
      case 'shipped': return Truck;
      case 'confirmed': return Check;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-orders-page">
      {/* Header */}
      <div className="bg-[#0A0F1C] text-white py-4">
        <div className="px-6 md:px-12 lg:px-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-slate-400 hover:text-white">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <Link to="/" className="text-xl font-bold">
                AUTO<span className="text-[#FF3333]">PARTS</span>
              </Link>
              <span className="ml-4 text-sm text-slate-400">Gestion des commandes</span>
            </div>
          </div>
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            Retour au site
          </Link>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher par ID, email, nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="order-search"
              />
            </div>
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="status-filter">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Export Button */}
          <Button
            onClick={handleExportCSV}
            variant="outline"
            data-testid="export-csv-btn"
          >
            Exporter CSV
          </Button>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Aucune commande trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold">Commande</th>
                    <th className="text-left py-4 px-4 font-semibold">Client</th>
                    <th className="text-left py-4 px-4 font-semibold">Date</th>
                    <th className="text-left py-4 px-4 font-semibold">Articles</th>
                    <th className="text-left py-4 px-4 font-semibold">Statut</th>
                    <th className="text-right py-4 px-4 font-semibold">Montant</th>
                    <th className="text-right py-4 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    const statusOption = statusOptions.find(s => s.value === order.status);
                    return (
                      <tr 
                        key={order.id} 
                        className="border-b border-slate-100 hover:bg-slate-50"
                        data-testid={`order-row-${order.id}`}
                      >
                        <td className="py-4 px-4">
                          <p className="font-mono text-xs">#{order.id.slice(0, 8)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium">{order.user_name}</p>
                          <p className="text-xs text-slate-500">{order.user_email}</p>
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {new Date(order.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-4">
                          {order.items?.length || 0} article{(order.items?.length || 0) !== 1 ? 's' : ''}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium w-fit ${statusOption?.color || 'bg-slate-100'}`}>
                            <StatusIcon size={14} />
                            {statusOption?.label || order.status}
                          </span>
                          {order.tracking_number && (
                            <p className="text-xs text-slate-500 mt-1">
                              Suivi: {order.tracking_number}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-bold">
                          {order.total?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => openOrderModal(order)}
                              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              data-testid={`view-order-${order.id}`}
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 mt-4">
          {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} affichée{filteredOrders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Commande #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="font-medium">{selectedOrder.user_name}</p>
                  <p className="text-sm">{selectedOrder.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Adresse de livraison</p>
                <div className="bg-slate-50 p-3 text-sm">
                  <p>{selectedOrder.shipping_address?.street}</p>
                  <p>{selectedOrder.shipping_address?.postal_code} {selectedOrder.shipping_address?.city}</p>
                  <p>{selectedOrder.shipping_address?.country}</p>
                  <p>Tél: {selectedOrder.shipping_address?.phone}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-slate-500 mb-2">Articles</p>
                <div className="border border-slate-200 divide-y divide-slate-100">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-slate-500">Qté: {item.quantity}</p>
                      </div>
                      <p className="font-bold">
                        {item.subtotal?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-slate-50">
                    <p className="font-semibold">Total</p>
                    <p className="font-bold text-lg">
                      {selectedOrder.total?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-medium mb-3">Mettre à jour le statut</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">Statut</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger data-testid="update-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">N° de suivi</label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Ex: 1Z999AA10123456784"
                      data-testid="tracking-number-input"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Fermer
                </Button>
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="bg-[#0A0F1C] hover:bg-[#1F2937]"
                  data-testid="update-order-btn"
                >
                  {updating ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrdersPage;

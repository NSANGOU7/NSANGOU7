import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame, Plus, X, Clock, Users, Trash2, AlertCircle } from 'lucide-react';
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

const AdminAuctionsPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    starting_price: '',
    duration_days: '7'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auctionsRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/auctions`, { withCredentials: true }),
        axios.get(`${API_URL}/api/products?limit=100&is_auction=false`, { withCredentials: true })
      ]);
      setAuctions(auctionsRes.data);
      setProducts(productsRes.data.products || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.starting_price) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSaving(true);
    try {
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + parseInt(formData.duration_days));

      await axios.post(
        `${API_URL}/api/auctions`,
        {
          product_id: formData.product_id,
          starting_price: parseFloat(formData.starting_price),
          end_time: endTime.toISOString()
        },
        { withCredentials: true }
      );
      
      toast.success('Enchère créée avec succès');
      setShowModal(false);
      setFormData({ product_id: '', starting_price: '', duration_days: '7' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (auctionId) => {
    if (!window.confirm('Clôturer cette enchère définitivement ?')) return;
    
    try {
      await axios.post(`${API_URL}/api/admin/auctions/${auctionId}/close`, {}, { withCredentials: true });
      toast.success('Enchère clôturée');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la clôture');
    }
  };

  const handleDelete = async (auctionId) => {
    if (!window.confirm('Supprimer cette enchère définitivement ? Cette action est irréversible.')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/auctions/${auctionId}`, { withCredentials: true });
      toast.success('Enchère supprimée');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatus = (auction) => {
    if (auction.status === 'closed') return { label: 'Clôturée', color: 'bg-slate-100 text-slate-700' };
    const endDate = new Date(auction.end_time);
    if (endDate < new Date()) return { label: 'Expirée', color: 'bg-red-100 text-red-700' };
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-700' };
  };

  const getTimeLeft = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Terminée';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}j ${hours}h`;
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-auctions-page">
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
              <span className="ml-4 text-sm text-slate-400">Gestion des enchères</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Enchères</h1>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#FF3333] hover:bg-[#E60000] text-white"
            data-testid="create-auction-btn"
          >
            <Plus size={18} className="mr-2" />
            Créer une enchère
          </Button>
        </div>

        {/* Auctions Table */}
        <div className="bg-white border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto" />
            </div>
          ) : auctions.length === 0 ? (
            <div className="p-12 text-center">
              <Flame size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 mb-4">Aucune enchère pour le moment</p>
              <Button onClick={() => setShowModal(true)} className="bg-[#FF3333] hover:bg-[#E60000]">
                Créer la première enchère
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold">Produit</th>
                    <th className="text-right py-4 px-4 font-semibold">Prix départ</th>
                    <th className="text-right py-4 px-4 font-semibold">Prix actuel</th>
                    <th className="text-center py-4 px-4 font-semibold">Offres</th>
                    <th className="text-center py-4 px-4 font-semibold">Temps restant</th>
                    <th className="text-center py-4 px-4 font-semibold">Statut</th>
                    <th className="text-right py-4 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map((auction) => {
                    const status = getStatus(auction);
                    return (
                      <tr key={auction.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`auction-row-${auction.id}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 flex-shrink-0">
                              {auction.product?.images?.[0] && (
                                <img src={auction.product.images[0]} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium line-clamp-1">{auction.product?.title || 'Produit supprimé'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-600">
                          {auction.starting_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="py-4 px-4 text-right font-bold">
                          {auction.current_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="flex items-center justify-center gap-1">
                            <Users size={14} />
                            {auction.bids?.length || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-sm">
                          <span className="flex items-center justify-center gap-1">
                            <Clock size={14} />
                            {getTimeLeft(auction.end_time)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {auction.status !== 'closed' && (
                              <button
                                onClick={() => handleClose(auction.id)}
                                className="px-3 py-1 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200"
                                data-testid={`close-auction-${auction.id}`}
                              >
                                Clôturer
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(auction.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
                              data-testid={`delete-auction-${auction.id}`}
                            >
                              <Trash2 size={16} />
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
      </div>

      {/* Create Auction Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle enchère</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Produit *</label>
              <Select value={formData.product_id} onValueChange={(val) => setFormData({ ...formData, product_id: val })}>
                <SelectTrigger data-testid="auction-product-select">
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">Aucun produit disponible</div>
                  ) : (
                    products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} - {p.price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Seuls les produits non-enchères apparaissent</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Prix de départ (€) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.starting_price}
                onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                placeholder="Ex: 100.00"
                required
                data-testid="auction-starting-price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Durée de l'enchère</label>
              <Select value={formData.duration_days} onValueChange={(val) => setFormData({ ...formData, duration_days: val })}>
                <SelectTrigger data-testid="auction-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 jour</SelectItem>
                  <SelectItem value="3">3 jours</SelectItem>
                  <SelectItem value="5">5 jours</SelectItem>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="10">10 jours</SelectItem>
                  <SelectItem value="14">14 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800">
                Le produit sera automatiquement marqué comme enchère et retiré de la vente directe.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#FF3333] hover:bg-[#E60000] text-white">
                {saving ? 'Création...' : 'Créer l\'enchère'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuctionsPage;

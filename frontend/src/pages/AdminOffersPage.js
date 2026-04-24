import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Tag, Check, X, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminOffersPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Response modal
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [action, setAction] = useState(''); // accepted or rejected
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) { navigate('/'); return; }
    fetchOffers();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/offers`, { withCredentials: true });
      setOffers(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openResponseModal = (offer, actionType) => {
    setSelectedOffer(offer);
    setAction(actionType);
    setAdminMessage('');
  };

  const handleSubmitResponse = async () => {
    if (!selectedOffer) return;
    
    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/api/admin/offers/${selectedOffer.id}/respond`,
        { status: action, admin_message: adminMessage },
        { withCredentials: true }
      );
      toast.success(`Offre ${action === 'accepted' ? 'acceptée' : 'refusée'}`);
      setSelectedOffer(null);
      fetchOffers();
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOffers = offers.filter(o => statusFilter === 'all' || o.status === statusFilter);
  const pendingCount = offers.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-offers-page">
      <div className="bg-[#0A0F1C] text-white py-4">
        <div className="px-6 md:px-12 lg:px-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-slate-400 hover:text-white">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <Link to="/" className="text-xl font-bold">AUTO<span className="text-[#FF3333]">PARTS</span></Link>
              <span className="ml-4 text-sm text-slate-400">Offres clients</span>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="bg-[#FF3333] text-white px-3 py-1 rounded-full text-sm font-bold">
              {pendingCount} en attente
            </span>
          )}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'pending', label: 'En attente' },
            { value: 'accepted', label: 'Acceptées' },
            { value: 'rejected', label: 'Refusées' },
            { value: 'all', label: 'Toutes' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 text-sm font-medium ${statusFilter === f.value ? 'bg-[#0A0F1C] text-white' : 'bg-white border border-slate-200'}`}
              data-testid={`filter-${f.value}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto" />
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center">
            <Tag size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Aucune offre {statusFilter !== 'all' ? `"${statusFilter}"` : ''}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOffers.map(offer => (
              <div key={offer.id} className="bg-white border border-slate-200 p-6" data-testid={`offer-${offer.id}`}>
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{offer.product_title}</p>
                    <p className="text-sm text-slate-500">De {offer.user_name} ({offer.user_email})</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(offer.created_at).toLocaleString('fr-FR')}
                    </p>
                    {offer.message && (
                      <div className="mt-3 bg-slate-50 p-3 text-sm">
                        <MessageSquare size={14} className="inline mr-1 text-slate-400" />
                        {offer.message}
                      </div>
                    )}
                    {offer.admin_message && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 p-3 text-sm">
                        <strong>Votre réponse :</strong> {offer.admin_message}
                      </div>
                    )}
                  </div>
                  <div className="text-right md:min-w-[200px]">
                    <p className="text-sm text-slate-500">Prix original</p>
                    <p className="text-lg line-through text-slate-400">{offer.product_price?.toFixed(2)} €</p>
                    <p className="text-sm text-slate-500 mt-2">Offre</p>
                    <p className="text-2xl font-bold text-[#FF3333]">{offer.amount?.toFixed(2)} €</p>
                    <p className="text-xs text-slate-400">
                      -{((1 - offer.amount / offer.product_price) * 100).toFixed(0)}%
                    </p>
                    {offer.status === 'pending' ? (
                      <div className="flex gap-2 mt-3 justify-end">
                        <Button
                          onClick={() => openResponseModal(offer, 'accepted')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          size="sm"
                          data-testid={`accept-${offer.id}`}
                        >
                          <Check size={14} className="mr-1" />
                          Accepter
                        </Button>
                        <Button
                          onClick={() => openResponseModal(offer, 'rejected')}
                          className="bg-red-500 hover:bg-red-600 text-white"
                          size="sm"
                          data-testid={`reject-${offer.id}`}
                        >
                          <X size={14} className="mr-1" />
                          Refuser
                        </Button>
                      </div>
                    ) : (
                      <span className={`inline-block mt-3 px-3 py-1 text-xs font-bold uppercase ${
                        offer.status === 'accepted' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {offer.status === 'accepted' ? '✓ Acceptée' : '✗ Refusée'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'accepted' ? '✓ Accepter l\'offre' : '✗ Refuser l\'offre'}
            </DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Produit</p>
                <p className="font-semibold">{selectedOffer.product_title}</p>
                <p className="text-sm text-slate-500 mt-2">Offre de {selectedOffer.user_name}</p>
                <p className="text-2xl font-bold">{selectedOffer.amount?.toFixed(2)} €</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message au client (optionnel)</label>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="w-full p-3 border border-slate-200 focus:border-slate-900 outline-none min-h-[100px]"
                  placeholder={action === 'accepted' 
                    ? 'Ex: Offre acceptée. Finalisez votre achat dans les 48h.' 
                    : 'Ex: Je ne peux pas descendre en dessous de X€.'}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedOffer(null)}>Annuler</Button>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={submitting}
                  className={action === 'accepted' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
                  data-testid="confirm-response-btn"
                >
                  {submitting ? 'Envoi...' : (action === 'accepted' ? 'Accepter' : 'Refuser')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOffersPage;

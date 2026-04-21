import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Users, Flame, ChevronLeft, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEnded, setIsEnded] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [useProxyBid, setUseProxyBid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAuction = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/auctions/${id}`);
        setAuction(response.data);
        setBidAmount((response.data.current_price + 10).toFixed(2));
      } catch (error) {
        console.error('Error fetching auction:', error);
        toast.error('Enchère non trouvée');
        navigate('/auctions');
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
    
    // Poll for updates every 10 seconds
    const pollInterval = setInterval(fetchAuction, 10000);
    return () => clearInterval(pollInterval);
  }, [id, navigate]);

  useEffect(() => {
    if (!auction) return;

    const calculateTimeLeft = () => {
      const endDate = new Date(auction.end_time);
      const now = new Date();
      const difference = endDate - now;

      if (difference <= 0) {
        setIsEnded(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const handleBid = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour enchérir');
      navigate('/login');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.current_price) {
      toast.error(`L'offre doit être supérieure à ${auction.current_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      return;
    }

    setSubmitting(true);
    try {
      const bidData = { amount };
      if (useProxyBid && maxBid) {
        bidData.max_bid = parseFloat(maxBid);
      }

      const response = await axios.post(
        `${API_URL}/api/auctions/${id}/bid`,
        bidData,
        { withCredentials: true }
      );

      toast.success(response.data.message);
      
      // Refresh auction data
      const auctionRes = await axios.get(`${API_URL}/api/auctions/${id}`);
      setAuction(auctionRes.data);
      setBidAmount((auctionRes.data.current_price + 10).toFixed(2));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enchère');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-200" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 w-3/4" />
              <div className="h-6 bg-slate-200 w-1/2" />
              <div className="h-12 bg-slate-200 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) return null;

  const product = auction.product;
  const mainImage = product?.images?.[0] || 'https://via.placeholder.com/800x800?text=No+Image';
  const isWinning = user && auction.highest_bidder_id === user._id;

  return (
    <div className="min-h-screen bg-white" data-testid="auction-detail-page">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="px-6 md:px-12 lg:px-24">
          <Link to="/auctions" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ChevronLeft size={18} />
            Retour aux enchères
          </Link>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square bg-slate-50 overflow-hidden border border-slate-200">
              <img
                src={mainImage}
                alt={product?.title}
                className="w-full h-full object-contain"
              />
              {/* Live Badge */}
              {!isEnded && (
                <div className="absolute top-4 left-4 bg-[#FF3333] text-white text-sm font-bold px-4 py-2 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse-dot" />
                  EN DIRECT
                </div>
              )}
              {isEnded && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">ENCHÈRE TERMINÉE</span>
                </div>
              )}
            </div>
          </div>

          {/* Auction Info */}
          <div className="space-y-6" data-testid="auction-info">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                {product?.title}
              </h1>
              {product?.oem_reference && (
                <p className="font-mono text-sm text-slate-500">
                  Réf. OEM: {product.oem_reference}
                </p>
              )}
            </div>

            {/* Timer */}
            <div className="bg-slate-900 text-white p-6" data-testid="auction-timer">
              <p className="text-sm uppercase tracking-wide mb-2">
                {isEnded ? 'Enchère terminée' : 'Temps restant'}
              </p>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold font-mono">{String(timeLeft.days).padStart(2, '0')}</p>
                  <p className="text-xs text-slate-400">JOURS</p>
                </div>
                <span className="text-3xl font-bold">:</span>
                <div>
                  <p className="text-3xl font-bold font-mono">{String(timeLeft.hours).padStart(2, '0')}</p>
                  <p className="text-xs text-slate-400">HEURES</p>
                </div>
                <span className="text-3xl font-bold">:</span>
                <div>
                  <p className="text-3xl font-bold font-mono">{String(timeLeft.minutes).padStart(2, '0')}</p>
                  <p className="text-xs text-slate-400">MIN</p>
                </div>
                <span className="text-3xl font-bold">:</span>
                <div>
                  <p className="text-3xl font-bold font-mono text-[#FF3333]">{String(timeLeft.seconds).padStart(2, '0')}</p>
                  <p className="text-xs text-slate-400">SEC</p>
                </div>
              </div>
            </div>

            {/* Current Price */}
            <div className="border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide">Enchère actuelle</p>
                  <p className="text-4xl font-bold price-tag">
                    {auction.current_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Prix de départ</p>
                  <p className="text-lg font-medium text-slate-400 line-through">
                    {auction.starting_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                <span>{auction.bids?.length || 0} offre{(auction.bids?.length || 0) !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Winning Status */}
            {isAuthenticated && isWinning && !isEnded && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                <Check size={24} className="text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-700">Vous êtes le meilleur enchérisseur !</p>
                  <p className="text-sm text-emerald-600">Restez vigilant, quelqu'un pourrait surenchérir.</p>
                </div>
              </div>
            )}

            {/* Bid Form */}
            {!isEnded && (
              <form onSubmit={handleBid} className="space-y-4" data-testid="bid-form">
                <div>
                  <label className="block text-sm font-medium mb-2">Votre offre (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={auction.current_price + 1}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Min: ${(auction.current_price + 1).toFixed(2)} €`}
                    className="text-lg"
                    data-testid="bid-amount-input"
                  />
                </div>

                {/* Proxy Bidding */}
                <div className="border border-slate-200 p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useProxyBid}
                      onChange={(e) => setUseProxyBid(e.target.checked)}
                      className="w-5 h-5"
                      data-testid="proxy-bid-checkbox"
                    />
                    <div>
                      <p className="font-medium">Enchère automatique (Proxy bidding)</p>
                      <p className="text-sm text-slate-500">Le système enchérira automatiquement pour vous jusqu'à votre maximum</p>
                    </div>
                  </label>
                  {useProxyBid && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">Montant maximum (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min={parseFloat(bidAmount) + 1}
                        value={maxBid}
                        onChange={(e) => setMaxBid(e.target.value)}
                        placeholder="Ex: 2000.00"
                        data-testid="max-bid-input"
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting || isEnded}
                  className="w-full bg-[#FF3333] hover:bg-[#E60000] text-white py-6 text-lg font-semibold"
                  data-testid="place-bid-btn"
                >
                  <Flame size={20} className="mr-2" />
                  {submitting ? 'Envoi en cours...' : 'Placer mon enchère'}
                </Button>

                <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
                  <AlertCircle size={14} />
                  En enchérissant, vous vous engagez à acheter si vous gagnez.
                </p>
              </form>
            )}

            {/* Ended Message */}
            {isEnded && (
              <div className="bg-slate-100 p-6 text-center">
                <p className="text-lg font-semibold mb-2">Cette enchère est terminée</p>
                {auction.highest_bidder_id ? (
                  <p className="text-slate-600">
                    Vendu pour {auction.current_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                ) : (
                  <p className="text-slate-600">Aucune offre reçue</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bid History */}
        <div className="mt-12" data-testid="bid-history">
          <h2 className="text-xl font-semibold mb-4">Historique des enchères</h2>
          {auction.bids?.length === 0 ? (
            <p className="text-slate-500">Aucune enchère pour le moment</p>
          ) : (
            <div className="border border-slate-200">
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 font-semibold text-sm">
                <span>Enchérisseur</span>
                <span>Montant</span>
                <span>Date</span>
              </div>
              {[...(auction.bids || [])].reverse().map((bid, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-3 gap-4 p-4 border-t border-slate-100 ${index === 0 ? 'bg-emerald-50' : ''}`}
                >
                  <span className="font-medium">{bid.user_name}</span>
                  <span className="font-bold">
                    {bid.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <span className="text-slate-500 text-sm">
                    {new Date(bid.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Description */}
        {product?.description && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Description du produit</h2>
            <p className="text-slate-700 leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionDetailPage;

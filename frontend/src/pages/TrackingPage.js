import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, Check, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TrackingPage = () => {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('number') || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async (e) => {
    e?.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setNotFound(false);
    setOrder(null);

    try {
      const response = await axios.get(`${API_URL}/api/tracking/${encodeURIComponent(trackingNumber.trim())}`);
      setOrder(response.data);
    } catch (error) {
      setNotFound(true);
      toast.error('Numéro de suivi introuvable');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { id: 'confirmed', label: 'Commande confirmée', icon: CheckCircle2 },
    { id: 'preparing', label: 'En préparation', icon: Package },
    { id: 'shipped', label: 'Expédiée', icon: Truck },
    { id: 'delivered', label: 'Livrée', icon: Check }
  ];

  const getStepIndex = (status) => {
    const statusMap = {
      'pending_payment': -1,
      'confirmed': 0,
      'preparing': 1,
      'shipped': 2,
      'delivered': 3
    };
    return statusMap[status] ?? 0;
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="tracking-page">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A0F1C] to-slate-800 text-white py-12 md:py-16">
        <div className="px-6 md:px-12 lg:px-24 max-w-4xl mx-auto text-center">
          <Truck size={48} className="mx-auto mb-4 text-[#FF3333]" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Suivez votre commande
          </h1>
          <p className="text-slate-300 mb-8">
            Entrez votre numéro de suivi pour connaître l'état d'avancement de votre livraison
          </p>

          <form onSubmit={handleTrack} className="max-w-xl mx-auto">
            <div className="flex gap-2 bg-white rounded-full p-1.5">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="Ex: AUTO-XXXXXX-XXXX"
                className="flex-1 px-6 py-3 bg-transparent outline-none text-slate-900 text-center sm:text-left"
                data-testid="tracking-input"
              />
              <button
                type="submit"
                disabled={loading || !trackingNumber.trim()}
                className="bg-[#FF3333] hover:bg-[#E60000] text-white px-6 py-3 rounded-full font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                data-testid="track-btn"
              >
                <Search size={18} />
                <span className="hidden sm:inline">Suivre</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-12 lg:px-24 py-8 max-w-4xl mx-auto">
        {notFound && (
          <div className="bg-amber-50 border border-amber-200 p-6 text-center" data-testid="tracking-not-found">
            <p className="font-semibold text-amber-800 mb-2">Numéro de suivi introuvable</p>
            <p className="text-sm text-amber-700">
              Vérifiez votre numéro de suivi ou contactez notre service client.
            </p>
          </div>
        )}

        {order && (
          <div className="space-y-6" data-testid="tracking-result">
            {/* Order Header */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Numéro de commande</p>
                  <p className="font-mono font-semibold">#{order.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Numéro de suivi</p>
                  <p className="font-mono font-bold text-[#FF3333]">{order.tracking_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date de commande</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white border border-slate-200 p-6 md:p-8">
              <h2 className="font-semibold text-lg mb-8">État de la livraison</h2>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200">
                  <div 
                    className="h-full bg-[#3B5BFF] transition-all duration-500"
                    style={{
                      width: `${(getStepIndex(order.status) / (statusSteps.length - 1)) * 100}%`
                    }}
                  />
                </div>

                {/* Steps */}
                <div className="relative grid grid-cols-4 gap-2">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= getStepIndex(order.status);
                    const isCurrent = index === getStepIndex(order.status);
                    
                    return (
                      <div key={step.id} className="text-center" data-testid={`step-${step.id}`}>
                        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 transition-colors ${
                          isCompleted 
                            ? 'bg-[#3B5BFF] text-white' 
                            : 'bg-slate-200 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                          <Icon size={20} />
                        </div>
                        <p className={`text-xs md:text-sm font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            {order.shipping_address && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Adresse de livraison
                </h2>
                <p className="text-slate-700">
                  {order.shipping_address.street}<br />
                  {order.shipping_address.postal_code} {order.shipping_address.city}<br />
                  {order.shipping_address.country}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="font-semibold text-lg mb-4">Articles commandés</h2>
              <div className="divide-y divide-slate-100">
                {order.items?.map((item, index) => (
                  <div key={index} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-slate-500">Quantité: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      {item.subtotal?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                ))}
                <div className="py-3 flex items-center justify-between">
                  <p className="font-semibold">Total</p>
                  <p className="text-xl font-bold">
                    {order.total?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!order && !notFound && !loading && (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">
              Entrez votre numéro de suivi ci-dessus pour commencer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;

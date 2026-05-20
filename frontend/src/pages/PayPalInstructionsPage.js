import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Copy, Check, AlertCircle, Clock, CreditCard, Mail } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import PayPalSmartButtons from '../components/payment/PayPalSmartButtons';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PayPalInstructionsPage = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const paypalUrl = searchParams.get('paypal_url') || '';

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`, { withCredentials: true });
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Commande non trouvée');
        navigate('/account/orders');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, navigate]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copié dans le presse-papier');
  };

  const effectivePaypalUrl = paypalUrl || (order?.paypal_url) || `https://www.paypal.me/payement671/${order?.total?.toFixed(2) || '0'}EUR`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="paypal-instructions-page">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-none mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="font-bold text-2xl italic">P</span>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Finalisez votre paiement</p>
              <h1 className="text-2xl font-bold">Paiement via PayPal</h1>
            </div>
          </div>
        </div>

        {/* Order Info */}
        {order && (
          <div className="bg-white border border-slate-200 p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Numéro de commande</p>
                <p className="font-mono font-bold">#{order.id.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Montant à payer</p>
                <p className="text-3xl font-bold text-blue-700">
                  {order.total?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-white border border-slate-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard size={24} className="text-blue-600" />
            Instructions de paiement
          </h2>

          {/* Step 1 — PayPal Smart Buttons (works on mobile & desktop) */}
          <div className="mb-6 pl-12 relative">
            <div className="absolute left-0 top-0 w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2">Payer en un clic avec PayPal</h3>
            <p className="text-sm text-slate-600 mb-3">
              Cliquez sur le bouton PayPal ou Carte ci-dessous. Vous pouvez payer même sans compte PayPal (par carte).
            </p>
            <PayPalSmartButtons
              orderId={orderId}
              onSuccess={() => {
                toast.success('Commande validée ! Vous allez être redirigé.');
                setTimeout(() => navigate(`/checkout/success?order_id=${orderId}`), 1500);
              }}
            />
          </div>

          {/* Step 2 */}
          <div className="mb-6 pl-12 relative">
            <div className="absolute left-0 top-0 w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2">Ou copiez le lien PayPal</h3>
            <p className="text-sm text-slate-600 mb-3">
              Si le bouton ne fonctionne pas, copiez ce lien et collez-le dans votre navigateur :
            </p>
            <div className="flex gap-2 bg-slate-50 border border-slate-200 p-3">
              <input
                type="text"
                value={effectivePaypalUrl}
                readOnly
                className="flex-1 bg-transparent outline-none font-mono text-sm"
                data-testid="paypal-link-input"
              />
              <button
                onClick={() => handleCopy(effectivePaypalUrl)}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:border-slate-400 text-sm"
                data-testid="copy-paypal-link"
              >
                {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-6 pl-12 relative">
            <div className="absolute left-0 top-0 w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2">Ajoutez la référence de commande</h3>
            <p className="text-sm text-slate-600 mb-3">
              Dans PayPal, dans le champ "Ajouter une note" (optionnel mais recommandé), indiquez :
            </p>
            <div className="flex gap-2 bg-amber-50 border border-amber-200 p-3">
              <code className="flex-1 font-mono text-sm font-bold">
                Commande #{order?.id?.slice(0, 8) || 'XXXXXXXX'}
              </code>
              <button
                onClick={() => handleCopy(`Commande #${order?.id?.slice(0, 8)}`)}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-amber-200 text-sm"
              >
                <Copy size={14} /> Copier
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className="pl-12 relative">
            <div className="absolute left-0 top-0 w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2">Attendez la confirmation</h3>
            <p className="text-sm text-slate-600">
              Après votre paiement, notre équipe vérifiera la réception et vous enverra un email 
              de confirmation sous 24h. Votre commande sera alors expédiée.
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Important</p>
            <p className="text-sm text-amber-800 mt-1">
              Votre commande reste en attente jusqu'à la réception du paiement. 
              Le traitement commencera après validation manuelle par notre équipe.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-blue-50 border border-blue-200 p-4 mb-6 flex items-start gap-3">
          <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Une question ?</p>
            <p className="text-sm text-blue-800 mt-1">
              Contactez-nous via le chat en bas à droite de la page ou par WhatsApp :{' '}
              <a href="https://wa.me/33761524533" className="font-semibold underline">07 61 52 45 33</a>
            </p>
          </div>
        </div>

        {/* Tracking Info */}
        {order?.tracking_number && (
          <div className="bg-white border border-slate-200 p-6 mb-6">
            <p className="text-sm text-slate-500 mb-1">Votre numéro de suivi</p>
            <p className="font-mono font-bold text-xl text-[#FF3333] mb-3">{order.tracking_number}</p>
            <Link
              to={`/suivi?number=${order.tracking_number}`}
              className="text-sm text-[#3B5BFF] hover:underline flex items-center gap-1"
            >
              <Clock size={14} />
              Suivre ma commande
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/account/orders" className="flex-1">
            <Button variant="outline" className="w-full" data-testid="view-orders-btn">
              Voir mes commandes
            </Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button className="w-full bg-[#0A0F1C] hover:bg-[#1F2937]">
              Continuer mes achats
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PayPalInstructionsPage;

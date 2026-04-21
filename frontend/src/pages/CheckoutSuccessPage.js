import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/payments/status/${sessionId}`,
          { withCredentials: true }
        );

        if (response.data.payment_status === 'paid') {
          setStatus('success');
          setPaymentInfo(response.data);
        } else {
          // Keep polling
          setTimeout(checkPaymentStatus, 2000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
      }
    };

    checkPaymentStatus();
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" data-testid="checkout-success-loading">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-[#0A0F1C] animate-spin mb-4" />
          <h1 className="text-2xl font-bold mb-2">Vérification du paiement...</h1>
          <p className="text-slate-500">Veuillez patienter quelques instants</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" data-testid="checkout-error">
        <div className="text-center max-w-md px-4">
          <XCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Une erreur est survenue</h1>
          <p className="text-slate-500 mb-8">
            Nous n'avons pas pu vérifier votre paiement. Si vous avez été débité, 
            votre commande sera traitée automatiquement.
          </p>
          <div className="flex flex-col gap-4">
            <Link to="/account/orders">
              <Button className="w-full">Voir mes commandes</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="w-full">Contacter le support</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center" data-testid="checkout-success">
      <div className="text-center max-w-md px-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Commande confirmée !</h1>
        <p className="text-slate-500 mb-8">
          Merci pour votre achat. Vous recevrez un email de confirmation avec les détails de votre commande.
        </p>

        {paymentInfo && (
          <div className="bg-slate-50 border border-slate-200 p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">Détails du paiement</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Montant</span>
                <span className="font-medium">
                  {(paymentInfo.amount_total / 100).toLocaleString('fr-FR', { style: 'currency', currency: paymentInfo.currency?.toUpperCase() || 'EUR' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut</span>
                <span className="text-emerald-600 font-medium">Payé</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Link to="/account/orders">
            <Button className="w-full bg-[#0A0F1C] hover:bg-[#1F2937]" data-testid="view-orders-btn">
              Voir mes commandes
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="w-full">
              Continuer mes achats
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;

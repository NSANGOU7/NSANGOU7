import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Check, AlertCircle, Mail, Building2, Clock } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BankTransferPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [orderRes, bankRes] = await Promise.all([
          axios.get(`${API_URL}/api/orders/${orderId}`, { withCredentials: true }),
          axios.get(`${API_URL}/api/bank-info`)
        ]);
        setOrder(orderRes.data);
        setBankInfo(bankRes.data);
      } catch (e) {
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetch();
  }, [orderId]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copié dans le presse-papier');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full" /></div>;
  }

  if (!order || !bankInfo) return null;

  const reference = `CMD-${order.id?.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="bank-transfer-page">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 mb-6">
          <Building2 size={40} className="mb-4" />
          <h1 className="text-2xl font-bold">Paiement par virement bancaire</h1>
          <p className="text-slate-300 mt-1">Suivez les instructions pour finaliser votre commande</p>
        </div>

        {/* Order Info */}
        <div className="bg-white border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Commande</p>
              <p className="font-mono font-bold">#{order.id?.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Montant à virer</p>
              <p className="text-3xl font-bold">{order.total?.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Coordonnées bancaires</h2>

          <div className="space-y-4">
            {/* IBAN */}
            <div>
              <label className="text-sm text-slate-500 mb-1 block">IBAN</label>
              <div className="flex gap-2 bg-slate-50 border border-slate-200 p-3">
                <code className="flex-1 font-mono text-sm md:text-base break-all" data-testid="bank-iban">{bankInfo.iban}</code>
                <button
                  onClick={() => handleCopy(bankInfo.iban, 'iban')}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:border-slate-400 text-sm shrink-0"
                  data-testid="copy-iban"
                >
                  {copied === 'iban' ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                </button>
              </div>
            </div>

            {/* BIC */}
            <div>
              <label className="text-sm text-slate-500 mb-1 block">BIC / SWIFT</label>
              <div className="flex gap-2 bg-slate-50 border border-slate-200 p-3">
                <code className="flex-1 font-mono text-sm md:text-base" data-testid="bank-bic">{bankInfo.bic}</code>
                <button
                  onClick={() => handleCopy(bankInfo.bic, 'bic')}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:border-slate-400 text-sm"
                >
                  {copied === 'bic' ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                </button>
              </div>
            </div>

            {/* Holder */}
            <div>
              <label className="text-sm text-slate-500 mb-1 block">Titulaire du compte</label>
              <p className="font-medium p-3 bg-slate-50 border border-slate-200">{bankInfo.holder}</p>
            </div>

            {/* Reference */}
            <div>
              <label className="text-sm text-slate-500 mb-1 block">Référence du virement *</label>
              <div className="flex gap-2 bg-amber-50 border border-amber-300 p-3">
                <code className="flex-1 font-mono text-lg font-bold text-amber-900">{reference}</code>
                <button
                  onClick={() => handleCopy(reference, 'ref')}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-amber-300 hover:border-amber-500 text-sm"
                  data-testid="copy-ref"
                >
                  {copied === 'ref' ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                </button>
              </div>
              <p className="text-xs text-amber-700 mt-1">⚠️ Indiquez cette référence dans le libellé de votre virement</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Délai de traitement</p>
            <p className="text-sm text-amber-800 mt-1">
              Votre commande sera expédiée dès réception du virement (2-3 jours ouvrés selon votre banque).
            </p>
          </div>
        </div>

        {order.tracking_number && (
          <div className="bg-white border border-slate-200 p-6 mb-6">
            <p className="text-sm text-slate-500 mb-1">Numéro de suivi</p>
            <p className="font-mono font-bold text-xl text-[#FF3333]">{order.tracking_number}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 mb-6 flex items-start gap-3">
          <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Une question ?</p>
            <p className="text-sm text-blue-800 mt-1">
              Contactez-nous via le chat ou WhatsApp :{' '}
              <a href="https://wa.me/33761524533" className="font-semibold underline">Cliquez ici</a>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/account/orders" className="flex-1">
            <Button variant="outline" className="w-full">Voir mes commandes</Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button className="w-full bg-[#0A0F1C] hover:bg-[#1F2937]">Continuer mes achats</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BankTransferPage;

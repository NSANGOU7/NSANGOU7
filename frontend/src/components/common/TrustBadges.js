import React from 'react';
import { Shield, Truck, RotateCcw, Headphones, Lock } from 'lucide-react';

export const TrustBadges = ({ variant = 'horizontal' }) => {
  const badges = [
    { icon: Shield, title: 'Paiement Sécurisé', subtitle: 'SSL 256-bit' },
    { icon: Truck, title: 'Livraison 48h', subtitle: 'France métropolitaine' },
    { icon: RotateCcw, title: 'Retours Gratuits', subtitle: '30 jours' },
    { icon: Headphones, title: 'Support 7j/7', subtitle: 'Par chat & email' },
  ];

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-3 items-center text-xs text-slate-500" data-testid="trust-badges-compact">
        <span className="flex items-center gap-1"><Lock size={12} /> Paiement sécurisé SSL</span>
        <span>•</span>
        <span>Garantie 30j</span>
        <span>•</span>
        <span>Livraison 48h</span>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6"
      data-testid="trust-badges"
    >
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <div key={b.title} className="flex items-center gap-3 px-3">
            <div className="w-10 h-10 flex-shrink-0 bg-slate-100 rounded-full flex items-center justify-center">
              <Icon size={18} className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{b.title}</p>
              <p className="text-xs text-slate-500">{b.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const PaymentMethodIcons = () => (
  <div className="flex items-center gap-2 flex-wrap" data-testid="payment-icons">
    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-[#1A1F71]">VISA</span>
    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold">
      <span className="text-[#EB001B]">●</span><span className="text-[#F79E1B]">●</span> MC
    </span>
    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-[#003087]">PayPal</span>
    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700">Stripe</span>
    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700">Virement</span>
  </div>
);

export default TrustBadges;

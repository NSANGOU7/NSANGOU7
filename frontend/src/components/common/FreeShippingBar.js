import React from 'react';
import { Truck, Check } from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 99;

const FreeShippingBar = ({ subtotal }) => {
  const reached = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      className={`p-4 rounded-lg border ${
        reached ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'
      }`}
      data-testid="free-shipping-bar"
    >
      <div className="flex items-center gap-2 mb-2">
        {reached ? (
          <>
            <Check size={18} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">
              Bravo ! Vous bénéficiez de la <span className="font-bold">livraison gratuite</span> 🎉
            </p>
          </>
        ) : (
          <>
            <Truck size={18} className="text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              Plus que <span className="font-bold">{remaining.toFixed(2).replace('.', ',')} €</span> pour la livraison gratuite !
            </p>
          </>
        )}
      </div>
      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${reached ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default FreeShippingBar;

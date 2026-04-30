import React, { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';

const STORAGE_KEY = 'autoparts_promo_dismissed';

const PromoBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="bg-[#FF3333] text-white text-sm py-2 px-4 flex items-center justify-center gap-3 relative"
      data-testid="promo-banner"
    >
      <Truck size={16} />
      <span className="font-medium">
        🚚 LIVRAISON GRATUITE en France métropolitaine dès 99€ d'achat — Garantie 30 jours retours gratuits
      </span>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded"
        data-testid="promo-banner-close"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default PromoBanner;

import React, { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const STORAGE_KEY = 'autoparts_promo_dismissed';

const PromoBanner = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

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
      className="bg-[#FF3333] text-white text-xs sm:text-sm py-2 px-10 flex items-center justify-center gap-3 relative"
      data-testid="promo-banner"
    >
      <Truck size={16} className="hidden sm:inline-block flex-shrink-0" />
      <span className="font-medium text-center">{t('promoBanner')}</span>
      <button
        onClick={dismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded"
        data-testid="promo-banner-close"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default PromoBanner;

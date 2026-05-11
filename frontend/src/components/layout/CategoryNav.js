import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disc, Settings, Zap, Car, Cog, Wind, Thermometer, Sofa, Wrench, Flame } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const categoryIcons = {
  engine: <Cog size={16} />,
  brakes: <Disc size={16} />,
  suspension: <Settings size={16} />,
  electrical: <Zap size={16} />,
  bodywork: <Car size={16} />,
  transmission: <Cog size={16} />,
  exhaust: <Wind size={16} />,
  cooling: <Thermometer size={16} />,
  interior: <Sofa size={16} />,
  accessories: <Wrench size={16} />
};

const CATEGORY_IDS = ['engine', 'brakes', 'suspension', 'electrical', 'bodywork', 'transmission', 'exhaust', 'cooling', 'interior', 'accessories'];

const CategoryNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('category');

  return (
    <nav className="bg-[#0A0F1C] text-white overflow-x-auto category-nav" data-testid="category-nav">
      <div className="px-6 md:px-12 lg:px-24 py-3">
        <div className="flex items-center gap-6 md:gap-8 whitespace-nowrap text-sm font-medium">
          {CATEGORY_IDS.map((id) => (
            <Link
              key={id}
              to={`/products?category=${id}`}
              className={`flex items-center gap-2 transition-colors category-item ${
                currentCategory === id
                  ? 'text-white active'
                  : 'text-slate-300 hover:text-white'
              }`}
              data-testid={`category-${id}`}
            >
              {categoryIcons[id]}
              {t(`cat_${id}`)}
            </Link>
          ))}
          <Link
            to="/auctions"
            className="flex items-center gap-2 text-[#FF3333] hover:text-red-400 transition-colors font-semibold uppercase"
            data-testid="auctions-nav-link"
          >
            <Flame size={16} />
            {t('cat_auctions')}
          </Link>
          <Link
            to="/suivi"
            className="flex items-center gap-2 text-white hover:text-slate-300 transition-colors ml-auto uppercase"
            data-testid="tracking-nav-link"
          >
            <Car size={16} />
            {t('trackOrder')}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default CategoryNav;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disc, Settings, Zap, Car, Cog, Wind, Thermometer, Sofa, Wrench, Flame } from 'lucide-react';

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

const categories = [
  { id: 'engine', name: 'Moteur' },
  { id: 'brakes', name: 'Freinage' },
  { id: 'suspension', name: 'Suspension' },
  { id: 'electrical', name: 'Électricité' },
  { id: 'bodywork', name: 'Carrosserie' },
  { id: 'transmission', name: 'Transmission' },
  { id: 'exhaust', name: 'Échappement' },
  { id: 'cooling', name: 'Refroidissement' },
  { id: 'interior', name: 'Intérieur' },
  { id: 'accessories', name: 'Accessoires' }
];

const CategoryNav = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('category');

  return (
    <nav className="bg-[#0A0F1C] text-white overflow-x-auto category-nav" data-testid="category-nav">
      <div className="px-6 md:px-12 lg:px-24 py-3">
        <div className="flex items-center gap-6 md:gap-8 whitespace-nowrap text-sm font-medium">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className={`flex items-center gap-2 transition-colors category-item ${
                currentCategory === cat.id 
                  ? 'text-white active' 
                  : 'text-slate-300 hover:text-white'
              }`}
              data-testid={`category-${cat.id}`}
            >
              {categoryIcons[cat.id]}
              {cat.name}
            </Link>
          ))}
          <Link
            to="/auctions"
            className="flex items-center gap-2 text-[#FF3333] hover:text-red-400 transition-colors font-semibold"
            data-testid="auctions-nav-link"
          >
            <Flame size={16} />
            ENCHÈRES
          </Link>
          <Link
            to="/suivi"
            className="flex items-center gap-2 text-white hover:text-slate-300 transition-colors ml-auto"
            data-testid="tracking-nav-link"
          >
            <Car size={16} />
            SUIVRE MA COMMANDE
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default CategoryNav;

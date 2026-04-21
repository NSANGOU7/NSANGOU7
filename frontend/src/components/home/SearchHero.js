import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, Hash, Phone } from 'lucide-react';

const SearchHero = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plaque');
  const [searchValue, setSearchValue] = useState('');

  const tabs = [
    { id: 'plaque', label: 'Plaque', icon: Search, placeholder: 'AB-123-CD' },
    { id: 'vehicule', label: 'Véhicule', icon: Car, placeholder: 'Marque, modèle, année...' },
    { id: 'reference', label: 'Référence', icon: Hash, placeholder: 'Référence OEM...' }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    
    if (activeTab === 'reference') {
      navigate(`/products?oem=${encodeURIComponent(searchValue)}`);
    } else if (activeTab === 'vehicule') {
      navigate(`/products?search=${encodeURIComponent(searchValue)}`);
    } else {
      // Plaque - search by immatriculation
      navigate(`/products?search=${encodeURIComponent(searchValue)}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 md:py-16" data-testid="search-hero">
      <div className="px-6 md:px-12 lg:px-24 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
            Trouvez votre pièce<br className="md:hidden" /> en quelques clics
          </h1>
          <p className="text-slate-600">Plus de 30 000 références en stock</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-4" data-testid="search-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchValue('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-[#3B5BFF] text-white shadow-lg shadow-blue-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative bg-white border-2 border-slate-200 rounded-full p-1.5 focus-within:border-[#3B5BFF] transition-colors">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                placeholder={activeTabData.placeholder}
                className="w-full px-6 py-3 bg-transparent outline-none text-lg text-center md:text-left font-medium"
                data-testid="search-hero-input"
              />
            </div>
          </form>

          {/* Car Image */}
          <div className="relative my-6 rounded-3xl overflow-hidden bg-slate-100" data-testid="car-image">
            <div className="aspect-[16/9] relative">
              <img
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=675&fit=crop"
                alt="Voiture vue arrière"
                className="w-full h-full object-cover"
              />
              {/* Blurred plate overlay */}
              <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-32 h-8 md:w-44 md:h-12 bg-[#3B5BFF] rounded backdrop-blur-lg opacity-70" />
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSearch}
            className="w-full bg-[#3B5BFF] hover:bg-[#2d48d9] text-white py-5 rounded-full font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
            data-testid="find-part-btn"
          >
            <Search size={22} />
            Trouver ma pièce
          </button>

          {/* Helper Text */}
          <div className="mt-8 text-center" data-testid="expert-help">
            <p className="text-slate-600 mb-2">Besoin d'aide pour trouver votre pièce ?</p>
            <p className="text-slate-800">
              Appelez un expert au WhatsApp{' '}
              <a
                href="https://wa.me/2250761524533"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B5BFF] font-semibold hover:underline"
                data-testid="whatsapp-1"
              >
                07 61 52 45 33
              </a>
              {' / '}
              <a
                href="https://wa.me/2250753106346"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B5BFF] font-semibold hover:underline"
                data-testid="whatsapp-2"
              >
                07 53 10 63 46
              </a>
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-slate-200" data-testid="hero-stats">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#3B5BFF]">30K+</p>
              <p className="text-xs md:text-sm text-slate-600 mt-1">Pièces</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <p className="text-2xl md:text-3xl font-bold text-[#3B5BFF]">700+</p>
              <p className="text-xs md:text-sm text-slate-600 mt-1">Clients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#3B5BFF]">4.8</p>
              <p className="text-xs md:text-sm text-slate-600 mt-1">Note moyenne</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchHero;

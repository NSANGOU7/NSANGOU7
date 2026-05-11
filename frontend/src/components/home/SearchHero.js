import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, Hash, Phone } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const BRANDS = [
  'BMW', 'Audi', 'Mercedes', 'Volkswagen', 'Peugeot', 'Renault', 'Citroën',
  'Ford', 'Opel', 'Toyota', 'Honda', 'Nissan', 'Fiat', 'Seat', 'Skoda',
  'Volvo', 'Jaguar', 'Land Rover', 'Porsche', 'Alfa Romeo', 'Mini', 'Dacia',
  'Hyundai', 'Kia', 'Mazda', 'Suzuki', 'Subaru', 'Mitsubishi', 'Lexus',
  'Jeep', 'Dodge', 'Tesla', 'Smart'
];

// Validate French license plate: AB-123-CD format (2 letters - 3 digits - 2 letters)
const PLATE_REGEX = /^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/;

const SearchHero = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plaque');
  const [searchValue, setSearchValue] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [plateError, setPlateError] = useState('');

  const tabs = [
    { id: 'plaque', label: 'Plaque', icon: Search, placeholder: 'AB-123-CD' },
    { id: 'vehicule', label: 'Véhicule', icon: Car, placeholder: 'Sélectionnez une marque' },
    { id: 'reference', label: 'Référence', icon: Hash, placeholder: 'Référence OEM...' }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  const validatePlate = (value) => {
    const normalized = value.toUpperCase().replace(/\s/g, '');
    if (!normalized) return true;
    return PLATE_REGEX.test(normalized);
  };

  const handleSearch = (e) => {
    e?.preventDefault();

    if (activeTab === 'plaque') {
      if (!searchValue.trim()) {
        setPlateError('Veuillez entrer un numéro de plaque');
        return;
      }
      if (!validatePlate(searchValue)) {
        setPlateError('Format invalide. Utilisez XX-123-XX (ex: AB-123-CD)');
        return;
      }
      setPlateError('');
      navigate(`/products?plate=${encodeURIComponent(searchValue)}`);
    } else if (activeTab === 'vehicule') {
      if (!selectedBrand) {
        setPlateError('Veuillez sélectionner une marque');
        return;
      }
      setPlateError('');
      navigate(`/products?brand=${encodeURIComponent(selectedBrand)}`);
    } else {
      if (!searchValue.trim()) return;
      navigate(`/products?oem=${encodeURIComponent(searchValue)}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 md:py-12" data-testid="search-hero">
      <div className="px-6 md:px-12 lg:px-24 max-w-4xl mx-auto">
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
                    setSelectedBrand('');
                    setPlateError('');
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

          {/* Search Input/Select */}
          <form onSubmit={handleSearch} className="mb-6">
            {activeTab === 'vehicule' ? (
              <div className="bg-white border-2 border-slate-200 rounded-full p-1.5 focus-within:border-[#3B5BFF] transition-colors">
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="border-0 bg-transparent text-lg h-12 focus:ring-0" data-testid="brand-select">
                    <SelectValue placeholder="Choisissez la marque de votre voiture" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {BRANDS.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className={`relative bg-white border-2 rounded-full p-1.5 transition-colors ${plateError ? 'border-red-400' : 'border-slate-200 focus-within:border-[#3B5BFF]'}`}>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value.toUpperCase());
                    setPlateError('');
                  }}
                  placeholder={activeTabData.placeholder}
                  className="w-full px-6 py-3 bg-transparent outline-none text-lg text-center md:text-left font-medium"
                  data-testid="search-hero-input"
                />
              </div>
            )}
            {plateError && (
              <p className="text-sm text-red-600 mt-2 text-center" data-testid="plate-error">{plateError}</p>
            )}
          </form>

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
                href="https://wa.me/33761524533"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B5BFF] font-semibold hover:underline"
                data-testid="whatsapp-expert"
              >
                07 61 52 45 33 / 07 53 10 63 46
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

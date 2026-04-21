import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock } from 'lucide-react';
import axios from 'axios';
import AuctionCard from '../components/auctions/AuctionCard';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/auctions`);
        setAuctions(response.data);
      } catch (error) {
        console.error('Error fetching auctions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  return (
    <div className="min-h-screen bg-white" data-testid="auctions-page">
      {/* Header Banner */}
      <div className="bg-[#0A0F1C] text-white py-12">
        <div className="px-6 md:px-12 lg:px-24">
          <div className="flex items-center gap-3 mb-4">
            <Flame size={32} className="text-[#FF3333]" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Enchères en direct</h1>
          </div>
          <p className="text-slate-300 max-w-2xl">
            Participez à nos enchères et trouvez des pièces automobiles à prix imbattables. 
            Enchérissez en temps réel et remportez les meilleures affaires !
          </p>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 p-4 mb-8 flex items-center gap-3">
          <Clock size={24} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Comment fonctionnent les enchères ?</p>
            <p className="text-sm text-amber-700">
              Placez votre offre avant la fin du temps imparti. L'enchérisseur le plus élevé remporte le produit. 
              Utilisez l'enchère automatique pour ne pas manquer votre chance !
            </p>
          </div>
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-100 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-16" data-testid="no-auctions">
            <Flame size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg text-slate-500 mb-4">Aucune enchère en cours pour le moment</p>
            <Link to="/products" className="text-[#FF3333] font-medium hover:underline">
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="auctions-grid">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionsPage;

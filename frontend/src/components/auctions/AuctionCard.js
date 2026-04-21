import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Flame } from 'lucide-react';

const AuctionCard = ({ auction }) => {
  const { id, product, current_price, starting_price, end_time, bids = [] } = auction;
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date(end_time);
      const now = new Date();
      const difference = endDate - now;

      if (difference <= 0) {
        setIsEnded(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [end_time]);

  const mainImage = product?.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image';
  const bidCount = bids.length;

  return (
    <div 
      className="group bg-white border border-slate-200 flex flex-col relative overflow-hidden"
      data-testid={`auction-card-${id}`}
    >
      {/* Live Badge */}
      {!isEnded && (
        <div className="absolute top-4 left-4 bg-[#FF3333] text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider flex items-center gap-2 z-10">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse-dot" />
          EN DIRECT
        </div>
      )}

      {/* Image */}
      <Link to={`/auctions/${id}`} className="block aspect-square w-full bg-slate-50 overflow-hidden relative">
        <img
          src={mainImage}
          alt={product?.title}
          className="w-full h-full object-cover image-zoom"
          loading="lazy"
        />
        {isEnded && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-xl">TERMINÉE</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <Link to={`/auctions/${id}`}>
          <h3 className="font-medium text-slate-900 line-clamp-2 mb-3 hover:text-[#FF3333] transition-colors">
            {product?.title}
          </h3>
        </Link>

        {/* Timer */}
        {!isEnded && (
          <div className="flex items-center gap-2 text-[#FF3333] mb-3">
            <Clock size={16} />
            <span className="font-mono font-bold auction-timer">
              {timeLeft.days > 0 && `${timeLeft.days}j `}
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Bids Info */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Users size={14} />
            {bidCount} offre{bidCount !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-300">|</span>
          <span>Début: {starting_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Current Bid */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Enchère actuelle</p>
          <p className="text-2xl font-bold text-slate-900 price-tag">
            {current_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>

        {/* Bid Button */}
        <Link
          to={`/auctions/${id}`}
          className={`w-full py-3 font-semibold transition-colors flex items-center justify-center gap-2 btn-transition ${
            isEnded 
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-[#0A0F1C] hover:bg-[#1F2937] text-white'
          }`}
          data-testid={`bid-btn-${id}`}
        >
          <Flame size={18} />
          {isEnded ? 'Voir les résultats' : 'Enchérir maintenant'}
        </Link>
      </div>
    </div>
  );
};

export default AuctionCard;

import React from 'react';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    name: 'Thomas L.',
    initial: 'T',
    rating: 5,
    date: 'Il y a 2 jours',
    comment: 'Pièce conforme à la description, livraison rapide. Je recommande !',
    product: 'Kit de freins Brembo GT',
    color: 'bg-blue-500'
  },
  {
    name: 'Marie D.',
    initial: 'M',
    rating: 5,
    date: 'Il y a 1 semaine',
    comment: 'Service client au top. Expert très compétent sur WhatsApp qui m\'a aidé à trouver la bonne référence.',
    product: 'Turbo Garrett GTX3582R',
    color: 'bg-emerald-500'
  },
  {
    name: 'Sophie B.',
    initial: 'S',
    rating: 5,
    date: 'Il y a 3 semaines',
    comment: 'Parfait ! J\'ai choisi le retrait en magasin avec la réduction de 15%, très bonne affaire.',
    product: 'Échappement Akrapovic',
    color: 'bg-purple-500'
  }
];

const StarRating = ({ rating, size = 18 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        fill={star <= rating ? '#F59E0B' : 'none'}
        strokeWidth={1.5}
        className={star <= rating ? 'text-amber-500' : 'text-slate-300'}
      />
    ))}
  </div>
);

const ReviewsSection = () => {
  return (
    <section className="py-16 md:py-20 bg-white" data-testid="reviews-section">
      <div className="px-6 md:px-12 lg:px-24 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 uppercase tracking-wider mb-4">
            Avis clients vérifiés
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Ils nous font confiance
          </h2>
          <div className="flex items-center justify-center gap-3">
            <StarRating rating={5} size={24} />
            <span className="text-2xl font-bold">4.8</span>
            <span className="text-slate-500">/ 5</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Plus de 700 avis</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative"
              data-testid={`review-${index}`}
            >
              {/* Quote icon */}
              <Quote size={28} className="text-slate-200 mb-4" fill="currentColor" />
              
              {/* Comment */}
              <p className="text-slate-700 leading-relaxed mb-6 min-h-[80px]">
                "{review.comment}"
              </p>

              {/* Stars */}
              <StarRating rating={review.rating} />

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
                <div className={`w-11 h-11 ${review.color} text-white rounded-full flex items-center justify-center font-bold`}>
                  {review.initial}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{review.name}</p>
                  <p className="text-xs text-slate-500">{review.date}</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 font-medium">
                  ✓ Vérifié
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;

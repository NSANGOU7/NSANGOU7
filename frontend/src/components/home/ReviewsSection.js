import React from 'react';
import { Star } from 'lucide-react';

const reviews = [
  {
    name: 'Thomas L.',
    rating: 5,
    date: 'Il y a 2 jours',
    comment: 'Pièce conforme à la description, livraison rapide. Je recommande !',
    product: 'Kit de freins Brembo GT'
  },
  {
    name: 'Marie D.',
    rating: 5,
    date: 'Il y a 1 semaine',
    comment: 'Service client au top. Expert très compétent sur WhatsApp qui m\'a aidé à trouver la bonne référence.',
    product: 'Turbo Garrett GTX3582R'
  },
  {
    name: 'Julien M.',
    rating: 4,
    date: 'Il y a 2 semaines',
    comment: 'Bon rapport qualité/prix. La pièce est arrivée en 48h comme annoncé.',
    product: 'Suspension KW V3'
  },
  {
    name: 'Sophie B.',
    rating: 5,
    date: 'Il y a 3 semaines',
    comment: 'Parfait ! J\'ai choisi le retrait en magasin avec la réduction de 15%, très bonne affaire.',
    product: 'Échappement Akrapovic'
  },
  {
    name: 'Karim A.',
    rating: 5,
    date: 'Il y a 1 mois',
    comment: 'Commande passée dimanche, reçue mardi. Pièce neuve, bien emballée. Merci !',
    product: 'Radiateur Mishimoto'
  },
  {
    name: 'Élodie P.',
    rating: 4,
    date: 'Il y a 1 mois',
    comment: 'Très bon service, pièce OEM authentique. Petit bémol sur les frais de livraison sinon parfait.',
    product: 'Pare-chocs M Performance'
  }
];

const StarRating = ({ rating, size = 16 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        fill={star <= rating ? '#FFA500' : 'none'}
        className={star <= rating ? 'text-orange-400' : 'text-slate-300'}
      />
    ))}
  </div>
);

const ReviewsSection = () => {
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const totalReviews = reviews.length;

  return (
    <section className="py-12 md:py-16 bg-slate-50 border-t border-slate-200" data-testid="reviews-section">
      <div className="px-6 md:px-12 lg:px-24 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Avis clients
          </h2>
          <div className="flex items-center justify-center gap-3 mb-2">
            <StarRating rating={Math.round(averageRating)} size={24} />
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-slate-600">/5</span>
          </div>
          <p className="text-slate-600">Basé sur {totalReviews} avis clients vérifiés</p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 p-6 hover:border-slate-900 transition-colors"
              data-testid={`review-${index}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3B5BFF] text-white rounded-full flex items-center justify-center font-bold">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{review.name}</p>
                    <p className="text-xs text-slate-500">{review.date}</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 font-medium">
                  Vérifié
                </span>
              </div>
              <StarRating rating={review.rating} />
              <p className="text-slate-700 my-3 leading-relaxed">"{review.comment}"</p>
              <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
                Produit : <span className="font-medium">{review.product}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-6 py-3">
            <Star fill="#FFA500" className="text-orange-400" size={20} />
            <span className="font-semibold">4.8/5</span>
            <span className="text-slate-400">•</span>
            <span className="text-sm text-slate-600">Plus de 700 clients satisfaits</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;

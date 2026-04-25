import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Flame, Star, Truck, Shield, Clock } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/products/ProductCard';
import AuctionCard from '../components/auctions/AuctionCard';
import SearchHero from '../components/home/SearchHero';
import ReviewsSection from '../components/home/ReviewsSection';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newArrivalsRes, auctionsRes] = await Promise.all([
          axios.get(`${API_URL}/api/products/featured`),
          axios.get(`${API_URL}/api/products/new-arrivals`),
          axios.get(`${API_URL}/api/auctions`)
        ]);
        setFeaturedProducts(featuredRes.data);
        setNewArrivals(newArrivalsRes.data);
        setAuctions(auctionsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter au panier');
      return;
    }
    try {
      await addToCart(productId);
      toast.success('Produit ajouté au panier');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  const handleAddToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter à la wishlist');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/wishlist/${productId}`, {}, { withCredentials: true });
      toast.success('Produit ajouté à la wishlist');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout à la wishlist');
    }
  };

  return (
    <div data-testid="home-page">
      {/* Hero Banner with car */}
      <section className="relative w-full h-[60vh] min-h-[400px] flex items-center bg-black" data-testid="hero-banner">
        <img
          src="https://images.unsplash.com/photo-1711386689622-1cda23e10217?w=1920&q=80"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="hero-gradient absolute inset-0" />
        <div className="relative z-20 text-white max-w-2xl px-6 md:px-12 lg:px-24">
          <span className="inline-block bg-[#FF3333] text-white text-xs font-bold px-3 py-1 uppercase tracking-wider mb-4">
            Livraison gratuite dès 99€
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Pièces Auto<br />
            <span className="text-[#FF3333]">Qualité Pro</span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-lg">
            Trouvez la pièce qu'il vous faut parmi des milliers de références. Neuves, occasion ou reconditionnées.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/products"
              className="bg-white text-[#0A0F1C] px-8 py-3 font-semibold hover:bg-slate-100 transition-colors"
              data-testid="cta-shop"
            >
              Voir le catalogue
            </Link>
            <Link
              to="/auctions"
              className="bg-[#FF3333] text-white px-8 py-3 font-semibold hover:bg-[#E60000] transition-colors flex items-center gap-2"
              data-testid="cta-auctions"
            >
              <Flame size={20} />
              Enchères en cours
            </Link>
          </div>
        </div>
      </section>

      {/* Search Hero with tabs */}
      <SearchHero />

      {/* Trust Badges */}
      <section className="bg-[#0A0F1C] text-white py-6">
        <div className="px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Truck size={24} className="text-[#FF3333]" />
              <div>
                <p className="font-semibold text-sm">Livraison Rapide</p>
                <p className="text-xs text-slate-400">24-48h en France</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-[#FF3333]" />
              <div>
                <p className="font-semibold text-sm">Garantie 2 ans</p>
                <p className="text-xs text-slate-400">Pièces neuves</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Star size={24} className="text-[#FF3333]" />
              <div>
                <p className="font-semibold text-sm">+10 000 Avis</p>
                <p className="text-xs text-slate-400">Clients satisfaits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-[#FF3333]" />
              <div>
                <p className="font-semibold text-sm">Support 7j/7</p>
                <p className="text-xs text-slate-400">Assistance pro</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      {auctions.length > 0 && (
        <section className="py-12 md:py-16 bg-slate-50" data-testid="auctions-section">
          <div className="px-6 md:px-12 lg:px-24">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-[#FF3333] rounded-full animate-pulse-dot" />
                <h2 className="text-2xl sm:text-3xl font-semibold section-title">Enchères en direct</h2>
              </div>
              <Link
                to="/auctions"
                className="flex items-center gap-1 text-sm font-medium text-[#0A0F1C] hover:text-[#FF3333] transition-colors"
                data-testid="view-all-auctions"
              >
                Voir tout
                <ChevronRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {auctions.slice(0, 4).map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 md:py-16" data-testid="featured-section">
        <div className="px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold section-title">Pièces en vedette</h2>
            <Link
              to="/products?is_featured=true"
              className="flex items-center gap-1 text-sm font-medium text-[#0A0F1C] hover:text-[#FF3333] transition-colors"
              data-testid="view-all-featured"
            >
              Voir tout
              <ChevronRight size={18} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-100 aspect-square animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 md:py-16 bg-[#0A0F1C]" data-testid="categories-section">
        <div className="px-6 md:px-12 lg:px-24">
          <h2 className="text-2xl sm:text-3xl font-semibold section-title text-white mb-8">
            Parcourir par catégorie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { id: 'engine', name: 'Moteur', image: 'https://images.unsplash.com/photo-1717068341307-454cd5d662a1?w=400' },
              { id: 'brakes', name: 'Freinage', image: 'https://images.unsplash.com/photo-1763087978864-fe5b2778c9f7?w=400' },
              { id: 'suspension', name: 'Suspension', image: 'https://images.unsplash.com/photo-1760836395716-7dd00b71311a?w=400' },
              { id: 'electrical', name: 'Électricité', image: 'https://images.unsplash.com/photo-1717068341695-9d33ffb66968?w=400' },
              { id: 'bodywork', name: 'Carrosserie', image: 'https://images.unsplash.com/photo-1664565239977-997eb1cdde86?w=400' }
            ].map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group relative aspect-square overflow-hidden"
                data-testid={`category-card-${cat.id}`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 md:py-16" data-testid="new-arrivals-section">
        <div className="px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold section-title">Nouveautés</h2>
            <Link
              to="/products?sort=newest"
              className="flex items-center gap-1 text-sm font-medium text-[#0A0F1C] hover:text-[#FF3333] transition-colors"
              data-testid="view-all-new"
            >
              Voir tout
              <ChevronRight size={18} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-100 aspect-square animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* Newsletter */}
      <section className="py-12 md:py-16 bg-slate-50" data-testid="newsletter-section">
        <div className="px-6 md:px-12 lg:px-24 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold section-title mb-4">
            Restez informé
          </h2>
          <p className="text-slate-600 mb-6">
            Inscrivez-vous à notre newsletter pour recevoir nos meilleures offres et les nouvelles enchères.
          </p>
          <form className="flex gap-0 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 border border-slate-200 border-r-0 outline-none focus:border-slate-900"
              data-testid="newsletter-input"
            />
            <button
              type="submit"
              className="bg-[#0A0F1C] text-white px-6 py-3 font-semibold hover:bg-[#1F2937] transition-colors"
              data-testid="newsletter-submit"
            >
              S'inscrire
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

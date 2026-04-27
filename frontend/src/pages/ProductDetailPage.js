import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Share2, MoreVertical, Zap, Info, MessageSquare, Tag, Car } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const conditionLabels = {
  new: 'Neuf',
  used: 'Occasion',
  refurbished: 'Reconditionné'
};

const PLATE_REGEX = /^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [showCompatModal, setShowCompatModal] = useState(false);
  const [plateInput, setPlateInput] = useState('');
  const [plateResult, setPlateResult] = useState(null);
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productRes, questionsRes] = await Promise.all([
          axios.get(`${API_URL}/api/products/${id}`),
          axios.get(`${API_URL}/api/products/${id}/questions`)
        ]);
        setProduct(productRes.data);
        setQuestions(questionsRes.data);
      } catch (error) {
        toast.error('Produit non trouvé');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter au panier');
      navigate('/login');
      return;
    }
    try {
      await addToCart(id, 1);
      toast.success('Produit ajouté au panier');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour acheter');
      navigate('/login');
      return;
    }
    try {
      await addToCart(id, 1);
      navigate('/checkout');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour suivre cet objet');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/wishlist/${id}`, {}, { withCredentials: true });
      toast.success('Ajouté à votre wishlist');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour faire une offre');
      navigate('/login');
      return;
    }
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    if (amount >= product.price) {
      toast.error('Votre offre doit être inférieure au prix affiché');
      return;
    }

    setSubmittingOffer(true);
    try {
      await axios.post(`${API_URL}/api/offers`,
        { product_id: id, amount, message: offerMessage },
        { withCredentials: true }
      );
      toast.success('Offre envoyée ! Le vendeur la validera sous 24h.');
      setShowOfferModal(false);
      setOfferAmount('');
      setOfferMessage('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleCheckCompatibility = () => {
    const normalized = plateInput.toUpperCase().replace(/\s/g, '');
    if (!PLATE_REGEX.test(normalized)) {
      setPlateResult({ valid: false, message: 'Format invalide. Utilisez XX-123-XX' });
      return;
    }
    // Simulated compatibility check based on brands in the product
    const hasCompatibility = product.compatible_brands?.length > 0;
    setPlateResult({
      valid: true,
      compatible: hasCompatibility,
      message: hasCompatibility
        ? `Cette pièce est probablement compatible avec votre véhicule (plaque ${normalized}). Vérifiez les marques : ${product.compatible_brands.join(', ')}.`
        : 'Compatibilité non vérifiée. Contactez le vendeur via le chat pour confirmation.'
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.title, url });
      } catch (e) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Lien copié');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-white rounded-full" />
      </div>
    );
  }

  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/800x800?text=No+Image'];
  const inCart = false; // could track from cart context
  const installment3x = (product.price / 3).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white" data-testid="product-detail-page">
      {/* Top Bar (eBay style) */}
      <div className="sticky top-0 z-20 bg-black border-b border-slate-800 py-4 px-4 md:px-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-900 rounded-full" data-testid="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold text-xl">Objet</h1>
        <div className="flex items-center gap-1">
          <Link to="/cart" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
            <ShoppingCart size={18} />
          </Link>
          <button onClick={handleShare} className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
            <Share2 size={18} />
          </button>
          <button className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
        {/* Compatibility Alert */}
        <button
          onClick={() => setShowCompatModal(true)}
          className="w-full bg-slate-900 rounded-2xl p-4 flex items-center gap-3 mb-4 hover:bg-slate-800 transition-colors text-left border border-slate-800"
          data-testid="compat-alert-btn"
        >
          <Car size={20} className="text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Vérifier la compatibilité avec mon véhicule</p>
            <p className="text-xs text-slate-400">Entrez votre plaque pour savoir si cette pièce correspond</p>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        {/* "DANS X PANIERS" badge */}
        <div className="mb-4">
          <span className="inline-block bg-[#FF3333] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase">
            {(product.views || 1) > 0 ? `Consulté par ${product.views || 1} personnes` : 'Nouveau'}
          </span>
        </div>

        {/* Image Gallery */}
        <div className="bg-slate-900 rounded-lg overflow-hidden mb-4" data-testid="image-gallery">
          <div className="aspect-video md:aspect-[4/3] relative">
            <img
              src={images[currentImageIndex]}
              alt={product.title}
              className="w-full h-full object-contain bg-black"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Wishlist counter */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleAddToWishlist}
            className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full hover:bg-slate-800"
            data-testid="wishlist-counter"
          >
            <Heart size={20} />
            <span className="text-sm">5</span>
          </button>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto mb-6" data-testid="thumbnails">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${currentImageIndex === idx ? 'border-white' : 'border-slate-700'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4 uppercase leading-tight">
          {product.title}
        </h2>

        {/* Seller info */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 bg-[#3B5BFF] rounded-full flex items-center justify-center font-bold text-lg">
            A
          </div>
          <div className="flex-1">
            <p className="text-[#3B5BFF] underline">autoparts_fr <span className="text-slate-400 no-underline">(67)</span></p>
            <p className="text-sm text-slate-400">99,5 % d'évaluations positives</p>
          </div>
          <button className="border border-slate-600 rounded-full px-4 py-1.5 text-sm hover:bg-slate-900">
            Message
          </button>
        </div>

        {/* Price */}
        <div className="mb-6">
          <p className="text-4xl md:text-5xl font-bold mb-1" data-testid="product-price">
            {product.price?.toFixed(2).replace('.', ',')} €
          </p>
          <p className="text-slate-400">ou Offre directe</p>
        </div>

        {/* Installments */}
        <div className="bg-slate-900 rounded-lg p-4 mb-4 flex items-center justify-between" data-testid="installments">
          <div>
            <p className="text-sm">
              <span className="font-bold">3 paiements sans intérêts</span> de <strong>{installment3x} EUR</strong> avec
            </p>
            <p className="text-lg font-bold italic">PayPal</p>
          </div>
          <ChevronRight size={20} />
        </div>

        {/* Shipping */}
        <div className="bg-slate-900 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">9,99 € de livraison</p>
            <p className="text-xs text-slate-400">Livraison estimée sous 2-5 jours ouvrés</p>
          </div>
          <ChevronRight size={20} />
        </div>

        {/* Condition */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
          <span className="text-slate-400 text-sm">État</span>
          <span className="font-semibold flex items-center gap-1">
            {conditionLabels[product.condition] || product.condition}
            <Info size={14} className="text-slate-400" />
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-8" data-testid="action-buttons">
          <button
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="w-full bg-[#3B5BFF] hover:bg-[#2d48d9] text-white py-4 rounded-full font-bold text-lg transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
            data-testid="buy-now-btn"
          >
            Achat immédiat
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full border-2 border-[#3B5BFF] text-[#3B5BFF] hover:bg-[#3B5BFF] hover:text-white py-4 rounded-full font-bold text-lg transition-colors"
            data-testid="add-to-cart-btn"
          >
            Ajouter au panier
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) { navigate('/login'); return; }
              setOfferAmount((product.price * 0.85).toFixed(2));
              setShowOfferModal(true);
            }}
            className="w-full border-2 border-[#3B5BFF] text-[#3B5BFF] hover:bg-[#3B5BFF] hover:text-white py-4 rounded-full font-bold text-lg transition-colors flex items-center justify-center gap-2"
            data-testid="make-offer-btn"
          >
            <Tag size={18} />
            Faire une offre
          </button>
          <button
            onClick={handleAddToWishlist}
            className="w-full border-2 border-[#3B5BFF] text-[#3B5BFF] hover:bg-[#3B5BFF] hover:text-white py-4 rounded-full font-bold text-lg transition-colors flex items-center justify-center gap-2"
            data-testid="watch-btn"
          >
            <Heart size={18} />
            Suivre cet objet
          </button>
        </div>

        {/* View counter */}
        <div className="bg-slate-900 rounded-2xl p-4 flex items-start gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap size={18} />
          </div>
          <p className="text-sm flex-1">
            <span className="font-bold">Plusieurs personnes ont consulté cet objet.</span> 
            {' '}<span className="text-slate-400">5 personnes l'ont suivi.</span>
          </p>
        </div>

        {/* About this item */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">À propos de cet objet</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">État</span>
              <span>{conditionLabels[product.condition] || product.condition}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Quantité</span>
              <span>{product.stock} disponible{product.stock !== 1 ? 's' : ''}</span>
            </div>
            {product.oem_reference && (
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Référence OEM</span>
                <span className="font-mono">{product.oem_reference}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Numéro de l'objet</span>
              <span className="font-mono">{product.id?.slice(0, 12).toUpperCase()}</span>
            </div>
            {product.compatible_brands?.length > 0 && (
              <div className="flex items-start justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Marques compatibles</span>
                <span className="text-right">{product.compatible_brands.join(', ')}</span>
              </div>
            )}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              Object.entries(product.specifications).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between py-2 border-b border-slate-800"
                  data-testid={`spec-row-${key}`}
                >
                  <span className="text-slate-400">{key}</span>
                  <span className="text-right">{value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Description de l'objet fournie par le vendeur</h3>
          <p className="text-slate-300 leading-relaxed">{product.description}</p>
        </div>

        {/* Questions Section (simplified) */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Questions ({questions.length})</h3>
          {questions.length === 0 ? (
            <p className="text-slate-400">Aucune question pour ce produit</p>
          ) : (
            <div className="space-y-4">
              {questions.slice(0, 3).map(q => (
                <div key={q.id} className="bg-slate-900 rounded-lg p-4">
                  <p className="font-semibold text-sm">Q: {q.question}</p>
                  <p className="text-xs text-slate-400 mt-1">Par {q.user_name}</p>
                  {q.answer && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <p className="text-sm text-slate-300">R: {q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Make Offer Modal */}
      <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
        <DialogContent className="bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Faire une offre</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOffer} className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">Prix demandé</p>
              <p className="text-2xl font-bold">{product.price?.toFixed(2)} €</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Votre offre (€) *</label>
              <Input
                type="number"
                step="0.01"
                min="1"
                max={product.price - 1}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder={(product.price * 0.85).toFixed(2)}
                required
                data-testid="offer-amount-input"
              />
              <p className="text-xs text-slate-400 mt-1">Doit être inférieur à {product.price?.toFixed(2)} €</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message (optionnel)</label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-md min-h-[80px]"
                placeholder="Expliquez pourquoi votre offre est juste..."
                data-testid="offer-message-input"
              />
            </div>
            <div className="bg-amber-900/30 border border-amber-700 rounded p-3 text-sm text-amber-200 flex gap-2">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <span>Le vendeur recevra votre offre et vous répondra par email sous 24h.</span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowOfferModal(false)} className="flex-1 bg-transparent border-slate-700 text-white hover:bg-slate-800">
                Annuler
              </Button>
              <Button type="submit" disabled={submittingOffer} className="flex-1 bg-[#3B5BFF] hover:bg-[#2d48d9]" data-testid="submit-offer-btn">
                {submittingOffer ? 'Envoi...' : 'Envoyer l\'offre'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compatibility Check Modal */}
      <Dialog open={showCompatModal} onOpenChange={setShowCompatModal}>
        <DialogContent className="bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Car size={20} />
              Vérifier la compatibilité
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Entrez votre plaque d'immatriculation pour vérifier si cette pièce est compatible avec votre véhicule.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Plaque (format XX-123-XX)</label>
              <Input
                value={plateInput}
                onChange={(e) => {
                  setPlateInput(e.target.value.toUpperCase());
                  setPlateResult(null);
                }}
                className="bg-slate-800 border-slate-700 text-white text-center text-lg font-mono"
                placeholder="AB-123-CD"
                maxLength={9}
                data-testid="plate-input"
              />
            </div>
            {plateResult && (
              <div className={`p-4 rounded-lg ${plateResult.valid && plateResult.compatible ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-200' : plateResult.valid ? 'bg-amber-900/30 border border-amber-700 text-amber-200' : 'bg-red-900/30 border border-red-700 text-red-200'}`}>
                <p className="text-sm">{plateResult.message}</p>
              </div>
            )}
            <Button
              onClick={handleCheckCompatibility}
              className="w-full bg-[#3B5BFF] hover:bg-[#2d48d9]"
              data-testid="check-compat-btn"
            >
              Vérifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage;

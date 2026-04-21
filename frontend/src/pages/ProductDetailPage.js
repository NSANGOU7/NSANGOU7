import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Truck, Shield, RotateCcw, Check, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const conditionLabels = {
  new: 'Neuf',
  used: 'Occasion',
  refurbished: 'Reconditionné'
};

const conditionColors = {
  new: 'bg-emerald-500',
  used: 'bg-amber-500',
  refurbished: 'bg-blue-500'
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [newQuestion, setNewQuestion] = useState('');

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
        console.error('Error fetching product:', error);
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
      await addToCart(id, quantity);
      toast.success('Produit ajouté au panier');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout au panier');
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter à la wishlist');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/wishlist/${id}`, {}, { withCredentials: true });
      toast.success('Produit ajouté à la wishlist');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout à la wishlist');
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour poser une question');
      return;
    }
    if (!newQuestion.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/products/${id}/questions`,
        { product_id: id, question: newQuestion },
        { withCredentials: true }
      );
      setQuestions([response.data, ...questions]);
      setNewQuestion('');
      toast.success('Question envoyée');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la question');
    }
  };

  if (loading) {
    return (
      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-200" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 w-3/4" />
              <div className="h-6 bg-slate-200 w-1/2" />
              <div className="h-12 bg-slate-200 w-1/3" />
              <div className="h-32 bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/800x800?text=No+Image'];

  return (
    <div className="min-h-screen bg-white" data-testid="product-detail-page">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="px-6 md:px-12 lg:px-24">
          <nav className="text-sm">
            <ol className="flex items-center gap-2 text-slate-500">
              <li><Link to="/" className="hover:text-slate-900">Accueil</Link></li>
              <li>/</li>
              <li><Link to="/products" className="hover:text-slate-900">Produits</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium truncate max-w-[200px]">{product.title}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4" data-testid="image-gallery">
            {/* Main Image */}
            <div className="relative aspect-square bg-slate-50 overflow-hidden border border-slate-200">
              <img
                src={images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-contain"
              />
              {/* Condition Badge */}
              <span className={`absolute top-4 left-4 ${conditionColors[product.condition]} text-white text-xs font-bold px-3 py-1.5 uppercase`}>
                {conditionLabels[product.condition]}
              </span>
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white border border-slate-200 hover:border-slate-900 transition-colors"
                    data-testid="prev-image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white border border-slate-200 hover:border-slate-900 transition-colors"
                    data-testid="next-image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 border-2 transition-colors ${
                      currentImageIndex === index ? 'border-slate-900' : 'border-slate-200'
                    }`}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6" data-testid="product-info">
            {/* Title & Reference */}
            <div>
              {product.compatible_brands?.length > 0 && (
                <p className="text-sm text-slate-500 mb-1">
                  {product.compatible_brands.join(' • ')}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                {product.title}
              </h1>
              {product.oem_reference && (
                <p className="font-mono text-sm text-slate-500">
                  Réf. OEM: {product.oem_reference}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="py-4 border-y border-slate-200">
              <p className="text-3xl font-bold price-tag">
                {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className={`mt-2 text-sm ${product.stock > 5 ? 'text-emerald-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {product.stock > 5 ? (
                  <span className="flex items-center gap-1"><Check size={16} /> En stock</span>
                ) : product.stock > 0 ? (
                  `Plus que ${product.stock} en stock`
                ) : (
                  'Rupture de stock'
                )}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Quantité:</label>
                <div className="flex items-center border border-slate-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-slate-50"
                    data-testid="decrease-qty"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-slate-200 font-medium" data-testid="quantity">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 hover:bg-slate-50"
                    data-testid="increase-qty"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-[#0A0F1C] hover:bg-[#1F2937] text-white py-6 text-lg font-semibold"
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingCart size={20} className="mr-2" />
                  Ajouter au panier
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddToWishlist}
                  className="px-4"
                  data-testid="add-to-wishlist-btn"
                >
                  <Heart size={20} />
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-200">
              <div className="text-center">
                <Truck size={24} className="mx-auto mb-2 text-slate-600" />
                <p className="text-xs text-slate-600">Livraison 24-48h</p>
              </div>
              <div className="text-center">
                <Shield size={24} className="mx-auto mb-2 text-slate-600" />
                <p className="text-xs text-slate-600">Garantie 2 ans</p>
              </div>
              <div className="text-center">
                <RotateCcw size={24} className="mx-auto mb-2 text-slate-600" />
                <p className="text-xs text-slate-600">Retour 30 jours</p>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Vendu par AutoParts</p>
                  <p className="text-sm text-slate-500">Vendeur professionnel • 99.5% avis positifs</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">4.9</p>
                  <p className="text-xs text-slate-500">sur 5</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12" data-testid="product-tabs">
          <Tabs defaultValue="description">
            <TabsList className="border-b border-slate-200 w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="description" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-6 py-3"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="compatibility" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-6 py-3"
              >
                Compatibilité
              </TabsTrigger>
              <TabsTrigger 
                value="questions" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-6 py-3"
              >
                Questions ({questions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="py-6">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed">{product.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="compatibility" className="py-6">
              <div className="space-y-6">
                {product.compatible_brands?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Marques compatibles</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.compatible_brands.map((brand) => (
                        <span key={brand} className="px-3 py-1 bg-slate-100 text-sm">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {product.compatible_models?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Modèles compatibles</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.compatible_models.map((model) => (
                        <span key={model} className="px-3 py-1 bg-slate-100 text-sm">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {product.compatible_years?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Années compatibles</h3>
                    <p className="text-slate-700">
                      {product.compatible_years[0]} - {product.compatible_years[product.compatible_years.length - 1]}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="questions" className="py-6">
              <div className="space-y-6">
                {/* Ask Question Form */}
                <form onSubmit={handleSubmitQuestion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Poser une question</label>
                    <textarea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Votre question sur ce produit..."
                      className="w-full p-3 border border-slate-200 focus:border-slate-900 outline-none min-h-[100px]"
                      data-testid="question-input"
                    />
                  </div>
                  <Button type="submit" data-testid="submit-question">
                    <MessageSquare size={18} className="mr-2" />
                    Envoyer la question
                  </Button>
                </form>

                {/* Questions List */}
                <div className="space-y-4">
                  {questions.length === 0 ? (
                    <p className="text-slate-500">Aucune question pour ce produit</p>
                  ) : (
                    questions.map((q) => (
                      <div key={q.id} className="border border-slate-200 p-4">
                        <div className="flex items-start gap-3">
                          <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1">Q</span>
                          <div className="flex-1">
                            <p className="font-medium">{q.question}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Par {q.user_name} • {new Date(q.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        {q.answer && (
                          <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-100">
                            <span className="bg-[#FF3333] text-white text-xs font-bold px-2 py-1">R</span>
                            <div className="flex-1">
                              <p className="text-slate-700">{q.answer}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                Par AutoParts • {new Date(q.answered_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

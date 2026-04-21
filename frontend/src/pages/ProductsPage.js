import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, X, ChevronDown, Grid, List } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/products/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const conditionOptions = [
  { value: 'all', label: 'Tous les états' },
  { value: 'new', label: 'Neuf' },
  { value: 'used', label: 'Occasion' },
  { value: 'refurbished', label: 'Reconditionné' }
];

const sortOptions = [
  { value: 'newest', label: 'Plus récent' },
  { value: 'oldest', label: 'Plus ancien' },
  { value: 'price_low', label: 'Prix croissant' },
  { value: 'price_high', label: 'Prix décroissant' },
  { value: 'title', label: 'Nom A-Z' }
];

const categoryNames = {
  engine: 'Moteur',
  brakes: 'Freinage',
  suspension: 'Suspension',
  electrical: 'Électricité',
  bodywork: 'Carrosserie',
  transmission: 'Transmission',
  exhaust: 'Échappement',
  cooling: 'Refroidissement',
  interior: 'Intérieur',
  accessories: 'Accessoires'
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const condition = searchParams.get('condition') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (search) params.set('search', search);
        if (condition && condition !== 'all') params.set('condition', condition);
        if (sort) params.set('sort', sort);
        if (page) params.set('page', page.toString());
        if (brand) params.set('brand', brand);
        if (minPrice) params.set('min_price', minPrice);
        if (maxPrice) params.set('max_price', maxPrice);
        params.set('is_auction', 'false');

        const response = await axios.get(`${API_URL}/api/products?${params.toString()}`);
        setProducts(response.data.products);
        setTotal(response.data.total);
        setPages(response.data.pages);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, search, condition, sort, page, brand, minPrice, maxPrice]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

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

  const activeFiltersCount = [category, condition, brand, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white" data-testid="products-page">
      {/* Page Header */}
      <div className="bg-slate-50 border-b border-slate-200 py-8">
        <div className="px-6 md:px-12 lg:px-24">
          {/* Breadcrumb */}
          <nav className="text-sm mb-4">
            <ol className="flex items-center gap-2 text-slate-500">
              <li><Link to="/" className="hover:text-slate-900">Accueil</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">
                {category ? categoryNames[category] || 'Produits' : search ? `Résultats pour "${search}"` : 'Tous les produits'}
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {category ? categoryNames[category] : search ? `Résultats pour "${search}"` : 'Tous les produits'}
          </h1>
          <p className="text-slate-600 mt-2">{total} produit{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              data-testid="toggle-filters"
            >
              <Filter size={18} />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="bg-[#FF3333] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-sm text-slate-500 hover:text-slate-900"
                data-testid="clear-filters"
              >
                <X size={16} className="mr-1" />
                Effacer les filtres
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Select value={sort} onValueChange={(value) => updateFilter('sort', value)}>
              <SelectTrigger className="w-[180px]" data-testid="sort-select">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-slate-50 border border-slate-200 p-6 mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="filters-panel">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">État</label>
              <Select value={condition || 'all'} onValueChange={(value) => updateFilter('condition', value)}>
                <SelectTrigger data-testid="condition-filter">
                  <SelectValue placeholder="Tous les états" />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prix min (€)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => updateFilter('min_price', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 focus:border-slate-900 outline-none"
                data-testid="min-price-filter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prix max (€)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => updateFilter('max_price', e.target.value)}
                placeholder="10000"
                className="w-full px-3 py-2 border border-slate-200 focus:border-slate-900 outline-none"
                data-testid="max-price-filter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marque</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => updateFilter('brand', e.target.value)}
                placeholder="Ex: BMW, Audi..."
                className="w-full px-3 py-2 border border-slate-200 focus:border-slate-900 outline-none"
                data-testid="brand-filter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Référence OEM</label>
              <input
                type="text"
                value={searchParams.get('oem') || ''}
                onChange={(e) => updateFilter('oem', e.target.value)}
                placeholder="Ex: 34116780711"
                className="w-full px-3 py-2 border border-slate-200 focus:border-slate-900 outline-none"
                data-testid="oem-filter"
              />
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-100 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16" data-testid="no-products">
            <p className="text-lg text-slate-500 mb-4">Aucun produit trouvé</p>
            <Button onClick={clearFilters}>Effacer les filtres</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12" data-testid="pagination">
                {page > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => updateFilter('page', (page - 1).toString())}
                    data-testid="prev-page"
                  >
                    Précédent
                  </Button>
                )}
                <span className="px-4 text-sm text-slate-600">
                  Page {page} sur {pages}
                </span>
                {page < pages && (
                  <Button
                    variant="outline"
                    onClick={() => updateFilter('page', (page + 1).toString())}
                    data-testid="next-page"
                  >
                    Suivant
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;

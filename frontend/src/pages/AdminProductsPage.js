import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronLeft, Search, Package, X, Save, Image } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import ImageUploader from '../components/admin/ImageUploader';
import SpecificationsEditor from '../components/admin/SpecificationsEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categories = [
  { id: 'engine', name: 'Moteur' },
  { id: 'brakes', name: 'Freinage' },
  { id: 'suspension', name: 'Suspension' },
  { id: 'electrical', name: 'Électricité' },
  { id: 'bodywork', name: 'Carrosserie' },
  { id: 'transmission', name: 'Transmission' },
  { id: 'exhaust', name: 'Échappement' },
  { id: 'cooling', name: 'Refroidissement' },
  { id: 'interior', name: 'Intérieur' },
  { id: 'accessories', name: 'Accessoires' }
];

const conditionOptions = [
  { value: 'new', label: 'Neuf' },
  { value: 'used', label: 'Occasion' },
  { value: 'refurbished', label: 'Reconditionné' }
];

const emptyProduct = {
  title: '',
  description: '',
  oem_reference: '',
  compatible_brands: '',
  compatible_models: '',
  compatible_years: '',
  category: 'engine',
  condition: 'new',
  price: '',
  stock: '',
  images: [],
  is_auction: false,
  specifications: {}
};

const AdminProductsPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/products?limit=100`, { withCredentials: true });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      description: product.description || '',
      oem_reference: product.oem_reference || '',
      compatible_brands: (product.compatible_brands || []).join(', '),
      compatible_models: (product.compatible_models || []).join(', '),
      compatible_years: (product.compatible_years || []).join(', '),
      category: product.category || 'engine',
      condition: product.condition || 'new',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      images: product.images || [],
      is_auction: product.is_auction || false,
      specifications: product.specifications || {}
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.price || !formData.stock) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    // Parse form data
    const productData = {
      title: formData.title,
      description: formData.description,
      oem_reference: formData.oem_reference || null,
      compatible_brands: formData.compatible_brands ? formData.compatible_brands.split(',').map(b => b.trim()).filter(Boolean) : [],
      compatible_models: formData.compatible_models ? formData.compatible_models.split(',').map(m => m.trim()).filter(Boolean) : [],
      compatible_years: formData.compatible_years ? formData.compatible_years.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y)) : [],
      category: formData.category,
      condition: formData.condition,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      images: formData.images || [],
      is_auction: formData.is_auction,
      specifications: formData.specifications || {}
    };

    try {
      if (editingProduct) {
        // Update existing product
        await axios.put(
          `${API_URL}/api/products/${editingProduct.id}`,
          productData,
          { withCredentials: true }
        );
        toast.success('Produit mis à jour avec succès');
      } else {
        // Create new product
        await axios.post(
          `${API_URL}/api/products`,
          productData,
          { withCredentials: true }
        );
        toast.success('Produit créé avec succès');
      }
      
      closeModal();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/products/${productId}`, { withCredentials: true });
      toast.success('Produit supprimé');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      await axios.put(
        `${API_URL}/api/products/${product.id}`,
        { is_featured: !product.is_featured },
        { withCredentials: true }
      );
      toast.success(product.is_featured ? 'Produit retiré des vedettes' : 'Produit mis en vedette');
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.oem_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-products-page">
      {/* Header */}
      <div className="bg-[#0A0F1C] text-white py-4">
        <div className="px-6 md:px-12 lg:px-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-slate-400 hover:text-white">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <Link to="/" className="text-xl font-bold">
                AUTO<span className="text-[#FF3333]">PARTS</span>
              </Link>
              <span className="ml-4 text-sm text-slate-400">Gestion des produits</span>
            </div>
          </div>
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            Retour au site
          </Link>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="product-search"
              />
            </div>
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="category-filter">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Add Button */}
          <Button
            onClick={openAddModal}
            className="bg-[#FF3333] hover:bg-[#E60000] text-white"
            data-testid="add-product-btn"
          >
            <Plus size={18} className="mr-2" />
            Ajouter un produit
          </Button>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold">Produit</th>
                    <th className="text-left py-4 px-4 font-semibold">Catégorie</th>
                    <th className="text-left py-4 px-4 font-semibold">État</th>
                    <th className="text-right py-4 px-4 font-semibold">Prix</th>
                    <th className="text-right py-4 px-4 font-semibold">Stock</th>
                    <th className="text-center py-4 px-4 font-semibold">Vedette</th>
                    <th className="text-right py-4 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className="border-b border-slate-100 hover:bg-slate-50"
                      data-testid={`product-row-${product.id}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 flex-shrink-0">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Image size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{product.title}</p>
                            {product.oem_reference && (
                              <p className="text-xs text-slate-500 font-mono">{product.oem_reference}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-slate-100 text-xs">
                          {categories.find(c => c.id === product.category)?.name || product.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-medium ${
                          product.condition === 'new' ? 'bg-emerald-100 text-emerald-700' :
                          product.condition === 'used' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {conditionOptions.find(c => c.value === product.condition)?.label || product.condition}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold">
                        {product.price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={product.stock < 5 ? 'text-amber-600 font-medium' : ''}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(product)}
                          className={`w-6 h-6 rounded border-2 ${
                            product.is_featured 
                              ? 'bg-[#FF3333] border-[#FF3333] text-white' 
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                          data-testid={`toggle-featured-${product.id}`}
                        >
                          {product.is_featured && '✓'}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            data-testid={`edit-product-${product.id}`}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            data-testid={`delete-product-${product.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 mt-4">
          {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} affiché{filteredProducts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Add/Edit Product Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4" data-testid="product-form">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Titre *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Kit de freins Brembo GT"
                required
                data-testid="product-title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description détaillée du produit..."
                className="w-full p-3 border border-slate-200 focus:border-slate-900 outline-none min-h-[100px]"
                required
                data-testid="product-description"
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prix (€) *</label>
                <Input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="199.99"
                  required
                  data-testid="product-price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock *</label>
                <Input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="10"
                  required
                  data-testid="product-stock"
                />
              </div>
            </div>

            {/* Category & Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie *</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger data-testid="product-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">État *</label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => handleSelectChange('condition', value)}
                >
                  <SelectTrigger data-testid="product-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* OEM Reference */}
            <div>
              <label className="block text-sm font-medium mb-1">Référence OEM</label>
              <Input
                name="oem_reference"
                value={formData.oem_reference}
                onChange={handleInputChange}
                placeholder="Ex: 34116780711"
                data-testid="product-oem"
              />
            </div>

            {/* Compatible Brands */}
            <div>
              <label className="block text-sm font-medium mb-1">Marques compatibles</label>
              <Input
                name="compatible_brands"
                value={formData.compatible_brands}
                onChange={handleInputChange}
                placeholder="BMW, Audi, Mercedes (séparées par des virgules)"
                data-testid="product-brands"
              />
            </div>

            {/* Compatible Models */}
            <div>
              <label className="block text-sm font-medium mb-1">Modèles compatibles</label>
              <Input
                name="compatible_models"
                value={formData.compatible_models}
                onChange={handleInputChange}
                placeholder="M3, RS4, C63 AMG (séparés par des virgules)"
                data-testid="product-models"
              />
            </div>

            {/* Compatible Years */}
            <div>
              <label className="block text-sm font-medium mb-1">Années compatibles</label>
              <Input
                name="compatible_years"
                value={formData.compatible_years}
                onChange={handleInputChange}
                placeholder="2018, 2019, 2020, 2021 (séparées par des virgules)"
                data-testid="product-years"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium mb-2">Images du produit</label>
              <ImageUploader
                images={formData.images}
                onChange={(newImages) => setFormData(prev => ({ ...prev, images: newImages }))}
              />
            </div>

            {/* Specifications (eBay-style characteristics) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Caractéristiques techniques
                <span className="text-slate-500 font-normal ml-2">(Cylindrée, Fabricant, Type de carburant…)</span>
              </label>
              <SpecificationsEditor
                specifications={formData.specifications}
                onChange={(newSpecs) => setFormData(prev => ({ ...prev, specifications: newSpecs }))}
              />
            </div>

            {/* Is Auction */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_auction"
                  checked={formData.is_auction}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                  data-testid="product-is-auction"
                />
                <span className="text-sm">Ce produit est une enchère</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={closeModal}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-[#0A0F1C] hover:bg-[#1F2937]"
                data-testid="save-product-btn"
              >
                {saving ? (
                  'Enregistrement...'
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {editingProduct ? 'Mettre à jour' : 'Créer le produit'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductsPage;

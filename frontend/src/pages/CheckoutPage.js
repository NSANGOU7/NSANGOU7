import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { ChevronLeft, CreditCard, Check, Truck, Shield, MapPin, Store, Tag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const countries = [
  { code: 'FR', name: 'France' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'MA', name: 'Maroc' },
  { code: 'TN', name: 'Tunisie' },
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'États-Unis' }
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, fetchCart } = useCart();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState('delivery'); // delivery or pickup
  
  // Shipping Address
  const [address, setAddress] = useState({
    street: '',
    city: '',
    postal_code: '',
    country: 'France',
    phone: ''
  });

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [saveCard, setSaveCard] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    }
    if (cart.items.length === 0) {
      navigate('/cart');
    }
  }, [isAuthenticated, cart, navigate]);

  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const savedAddress = user.addresses[0];
      setAddress({
        street: savedAddress.street || '',
        city: savedAddress.city || '',
        postal_code: savedAddress.postal_code || '',
        country: savedAddress.country || 'France',
        phone: savedAddress.phone || ''
      });
    }
  }, [user]);

  // Calculate totals
  const subtotal = cart.total;
  const discount = shippingMethod === 'pickup' ? subtotal * 0.15 : 0;
  const subtotalAfterDiscount = subtotal - discount;
  const shippingCost = shippingMethod === 'delivery' && subtotalAfterDiscount < 99 ? 9.90 : 0;
  const totalWithShipping = subtotalAfterDiscount + shippingCost;

  const handleShippingMethodNext = () => {
    setStep(2);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (shippingMethod === 'delivery') {
      if (!address.street || !address.city || !address.postal_code || !address.phone) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
    } else {
      if (!address.phone) {
        toast.error('Le téléphone est obligatoire pour le retrait');
        return;
      }
    }
    setStep(3);
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const orderResponse = await axios.post(
        `${API_URL}/api/orders`,
        {
          shipping_address: address,
          payment_method: paymentMethod,
          shipping_method: shippingMethod,
          save_card: saveCard
        },
        { withCredentials: true }
      );

      const order = orderResponse.data;

      if (paymentMethod === 'stripe' || paymentMethod === 'installments_3x' || paymentMethod === 'installments_4x') {
        const checkoutResponse = await axios.post(
          `${API_URL}/api/payments/create-checkout`,
          {
            order_id: order.id,
            origin_url: window.location.origin
          },
          { withCredentials: true }
        );
        window.location.href = checkoutResponse.data.url;
      } else if (paymentMethod === 'paypal') {
        // PayPal.me redirect - open in new tab
        if (order.paypal_url) {
          toast.info('Redirection vers PayPal...');
          window.open(order.paypal_url, '_blank');
          // Redirect user to a pending page
          setTimeout(() => {
            navigate(`/account/orders`);
            toast.success('Commande créée ! Finalisez votre paiement PayPal dans l\'onglet ouvert.');
          }, 1500);
        } else {
          toast.error('PayPal indisponible');
        }
      } else if (paymentMethod === 'bank_transfer') {
        toast.success('Commande créée. Instructions de virement envoyées par email.');
        await fetchCart();
        navigate(`/account/orders`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Livraison' },
    { num: 2, label: 'Adresse' },
    { num: 3, label: 'Paiement' }
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="checkout-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="px-6 md:px-12 lg:px-24">
          <Link to="/cart" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ChevronLeft size={18} />
            Retour au panier
          </Link>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        {/* Steps */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.num ? 'bg-[#0A0F1C] text-white' : 'bg-slate-200'}`}>
                  {step > s.num ? <Check size={16} /> : s.num}
                </span>
                <span className="hidden sm:inline font-medium">{s.label}</span>
              </div>
              {idx < steps.length - 1 && <div className="w-8 md:w-12 h-0.5 bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Method */}
            {step === 1 && (
              <div className="bg-white border border-slate-200 p-6" data-testid="shipping-method-form">
                <h2 className="text-xl font-semibold mb-6">Mode de livraison</h2>
                
                <div className="space-y-4">
                  {/* Delivery Option */}
                  <label 
                    className={`flex items-start gap-4 p-5 border-2 cursor-pointer transition-all ${
                      shippingMethod === 'delivery' 
                        ? 'border-[#0A0F1C] bg-slate-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid="method-delivery"
                  >
                    <input
                      type="radio"
                      name="shipping_method"
                      value="delivery"
                      checked={shippingMethod === 'delivery'}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="w-5 h-5 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Truck size={24} />
                        <div>
                          <p className="font-semibold">Livraison à domicile</p>
                          <p className="text-sm text-slate-500">Recevez votre commande chez vous en 24-48h</p>
                        </div>
                      </div>
                      <p className="text-sm mt-3 text-slate-600">
                        Frais de livraison : <strong>9,90 €</strong> (gratuit dès 99 €)
                      </p>
                    </div>
                  </label>

                  {/* Pickup Option */}
                  <label 
                    className={`flex items-start gap-4 p-5 border-2 cursor-pointer transition-all relative ${
                      shippingMethod === 'pickup' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid="method-pickup"
                  >
                    <span className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Tag size={12} />
                      -15% DE RÉDUCTION
                    </span>
                    <input
                      type="radio"
                      name="shipping_method"
                      value="pickup"
                      checked={shippingMethod === 'pickup'}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="w-5 h-5 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Store size={24} className="text-emerald-600" />
                        <div>
                          <p className="font-semibold">Retrait en magasin</p>
                          <p className="text-sm text-slate-500">Récupérez votre commande directement en magasin</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white border border-emerald-200">
                        <p className="text-sm text-emerald-700 font-medium flex items-center gap-1">
                          <MapPin size={14} />
                          123 Rue de l'Automobile, 75001 Paris
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Ouvert Lun-Ven 9h-18h, Sam 10h-16h
                        </p>
                      </div>
                      <p className="text-sm mt-3 text-emerald-700 font-semibold">
                        ✓ Économisez 15% sur le total de votre commande !
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  onClick={handleShippingMethodNext}
                  className="w-full mt-6 bg-[#0A0F1C] hover:bg-[#1F2937] text-white py-6 font-semibold"
                  data-testid="continue-to-address"
                >
                  Continuer
                </Button>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="bg-white border border-slate-200 p-6" data-testid="address-form">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  {shippingMethod === 'delivery' ? <Truck size={24} /> : <Store size={24} />}
                  {shippingMethod === 'delivery' ? 'Adresse de livraison' : 'Coordonnées pour le retrait'}
                </h2>

                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  {shippingMethod === 'delivery' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Pays *</label>
                        <Select 
                          value={address.country} 
                          onValueChange={(value) => setAddress({ ...address, country: value })}
                        >
                          <SelectTrigger data-testid="address-country">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Adresse *</label>
                        <Input
                          value={address.street}
                          onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          placeholder="123 Rue de Paris"
                          required
                          data-testid="address-street"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Code postal *</label>
                          <Input
                            value={address.postal_code}
                            onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                            placeholder="75001"
                            required
                            data-testid="address-postal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Ville *</label>
                          <Input
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            placeholder="Paris"
                            required
                            data-testid="address-city"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <Input
                      type="tel"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                      required
                      data-testid="address-phone"
                    />
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#0A0F1C] hover:bg-[#1F2937] text-white font-semibold"
                      data-testid="continue-to-payment"
                    >
                      Continuer vers le paiement
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="bg-white border border-slate-200 p-6" data-testid="payment-form">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CreditCard size={24} />
                  Mode de paiement
                </h2>

                <div className="space-y-3 mb-6">
                  {/* Stripe Card */}
                  <label 
                    className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-[#0A0F1C] bg-slate-50' : 'border-slate-200'}`}
                    data-testid="payment-stripe"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Carte bancaire</p>
                      <p className="text-sm text-slate-500">Visa, Mastercard, Apple Pay, Google Pay</p>
                    </div>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Visa</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">MC</span>
                    </div>
                  </label>

                  {/* Save Card Option */}
                  {paymentMethod === 'stripe' && (
                    <div className="ml-10 pl-4 py-2 border-l-2 border-slate-200">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="w-4 h-4"
                          data-testid="save-card-checkbox"
                        />
                        <span>Sauvegarder ma carte pour les prochains paiements</span>
                      </label>
                      <p className="text-xs text-slate-500 mt-1 ml-6">
                        Votre carte sera sécurisée via Stripe (token crypté, conforme PCI-DSS)
                      </p>
                    </div>
                  )}

                  {/* PayPal */}
                  <label 
                    className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-[#0A0F1C] bg-slate-50' : 'border-slate-200'}`}
                    data-testid="payment-paypal"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">PayPal</p>
                      <p className="text-sm text-slate-500">Payez avec votre compte PayPal</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 text-lg italic">PayPal</span>
                    </div>
                  </label>

                  {/* Installments 3x */}
                  <label 
                    className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${paymentMethod === 'installments_3x' ? 'border-[#0A0F1C] bg-slate-50' : 'border-slate-200'}`}
                    data-testid="payment-3x"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="installments_3x"
                      checked={paymentMethod === 'installments_3x'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Paiement en 3 fois sans frais</p>
                      <p className="text-sm text-slate-500">
                        3 × {(totalWithShipping / 3).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">3×</span>
                  </label>

                  {/* Installments 4x */}
                  <label 
                    className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${paymentMethod === 'installments_4x' ? 'border-[#0A0F1C] bg-slate-50' : 'border-slate-200'}`}
                    data-testid="payment-4x"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="installments_4x"
                      checked={paymentMethod === 'installments_4x'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Paiement en 4 fois sans frais</p>
                      <p className="text-sm text-slate-500">
                        4 × {(totalWithShipping / 4).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded">4×</span>
                  </label>

                  {/* Bank Transfer */}
                  <label 
                    className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${paymentMethod === 'bank_transfer' ? 'border-[#0A0F1C] bg-slate-50' : 'border-slate-200'}`}
                    data-testid="payment-bank"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Virement bancaire</p>
                      <p className="text-sm text-slate-500">Instructions envoyées par email</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 bg-[#0A0F1C] hover:bg-[#1F2937] text-white font-semibold"
                    data-testid="confirm-order"
                  >
                    {loading ? 'Traitement...' : 'Confirmer et payer'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1" data-testid="checkout-summary">
            <div className="bg-white border border-slate-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
              
              <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex gap-3">
                    <div className="w-14 h-14 bg-slate-50 flex-shrink-0">
                      <img
                        src={item.product?.images?.[0] || 'https://via.placeholder.com/64'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product?.title}</p>
                      <p className="text-xs text-slate-500">Qté: {item.quantity}</p>
                      <p className="text-sm font-bold">
                        {item.subtotal?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Sous-total</span>
                  <span>{subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                {shippingMethod === 'pickup' && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Réduction retrait (-15%)</span>
                    <span>-{discount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {shippingMethod === 'pickup' ? 'Retrait en magasin' : 'Livraison'}
                  </span>
                  <span className={shippingCost === 0 ? 'text-emerald-600' : ''}>
                    {shippingCost === 0 ? 'Gratuite' : `${shippingCost.toFixed(2)} €`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{totalWithShipping.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  <span>Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} />
                  <span>Numéro de suivi par email</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

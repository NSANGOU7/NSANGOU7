import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      {/* Hero */}
      <section className="bg-[#0A0F1C] text-white py-16 md:py-24">
        <div className="px-6 md:px-12 lg:px-24 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            À Propos d'AutoParts
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Depuis plus de 15 ans, AutoParts est votre partenaire de confiance pour toutes vos pièces automobiles. 
            Passionnés par l'automobile, nous mettons notre expertise à votre service pour vous proposer 
            les meilleures pièces au meilleur prix.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Notre Mission</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Faciliter l'accès aux pièces automobiles de qualité pour tous les passionnés 
                et professionnels. Nous croyons que chaque véhicule mérite les meilleures pièces, 
                qu'elles soient neuves, d'occasion ou reconditionnées.
              </p>
              <h2 className="text-2xl font-semibold mb-4">Nos Engagements</h2>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#FF3333] rounded-full mt-2" />
                  Pièces 100% contrôlées et garanties
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#FF3333] rounded-full mt-2" />
                  Livraison rapide en 24-48h
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#FF3333] rounded-full mt-2" />
                  Service client 7j/7
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#FF3333] rounded-full mt-2" />
                  Retours gratuits sous 30 jours
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 p-8">
              <h2 className="text-2xl font-semibold mb-6">Quelques chiffres</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-4xl font-bold text-[#FF3333]">15+</p>
                  <p className="text-sm text-slate-500">Années d'expérience</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#FF3333]">50K+</p>
                  <p className="text-sm text-slate-500">Clients satisfaits</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#FF3333]">100K+</p>
                  <p className="text-sm text-slate-500">Références</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#FF3333]">99.5%</p>
                  <p className="text-sm text-slate-500">Avis positifs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="contact-page">
      <section className="py-12 md:py-16">
        <div className="px-6 md:px-12 lg:px-24">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Contactez-nous</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl">
            {/* Contact Form */}
            <div>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prénom</label>
                    <Input placeholder="Jean" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom</label>
                    <Input placeholder="Dupont" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input type="email" placeholder="jean@exemple.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sujet</label>
                  <Input placeholder="Votre sujet" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    className="w-full p-3 border border-slate-200 focus:border-slate-900 outline-none min-h-[150px]"
                    placeholder="Votre message..."
                  />
                </div>
                <Button type="submit" className="w-full bg-[#0A0F1C] hover:bg-[#1F2937]">
                  Envoyer le message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6">
                <h2 className="text-lg font-semibold mb-4">Nos coordonnées</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-[#FF3333] mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-slate-600">123 Rue de l'Automobile<br />75001 Paris, France</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={20} className="text-[#FF3333] mt-0.5" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-slate-600">+33 1 23 45 67 89</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-[#FF3333] mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-slate-600">contact@automobilepart.fr</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-[#FF3333] mt-0.5" />
                    <div>
                      <p className="font-medium">Horaires</p>
                      <p className="text-slate-600">Lun - Ven: 9h - 18h<br />Sam: 10h - 16h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const CGVPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="cgv-page">
      <section className="py-12 md:py-16">
        <div className="px-6 md:px-12 lg:px-24 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Conditions Générales de Vente</h1>
          
          <div className="prose prose-slate max-w-none">
            <h2>Article 1 - Objet</h2>
            <p>Les présentes conditions générales de vente régissent les relations contractuelles entre AutoParts et ses clients.</p>
            
            <h2>Article 2 - Prix</h2>
            <p>Les prix sont indiqués en euros TTC. AutoParts se réserve le droit de modifier ses prix à tout moment.</p>
            
            <h2>Article 3 - Commande</h2>
            <p>Toute commande implique l'acceptation des présentes CGV. La validation de la commande vaut acceptation des prix et descriptions des produits.</p>
            
            <h2>Article 4 - Livraison</h2>
            <p>Les délais de livraison sont donnés à titre indicatif. AutoParts s'engage à livrer les produits dans un délai de 2 à 5 jours ouvrés.</p>
            
            <h2>Article 5 - Garantie</h2>
            <p>Tous nos produits neufs bénéficient d'une garantie de 2 ans. Les produits d'occasion sont garantis 6 mois.</p>
            
            <h2>Article 6 - Droit de rétractation</h2>
            <p>Conformément à la loi, vous disposez d'un délai de 14 jours pour exercer votre droit de rétractation.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const ReturnsPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="returns-page">
      <section className="py-12 md:py-16">
        <div className="px-6 md:px-12 lg:px-24 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Politique de Retour</h1>
          
          <div className="prose prose-slate max-w-none">
            <h2>Délai de retour</h2>
            <p>Vous disposez de 30 jours à compter de la réception de votre commande pour retourner un article.</p>
            
            <h2>Conditions de retour</h2>
            <ul>
              <li>Le produit doit être dans son emballage d'origine</li>
              <li>Le produit ne doit pas avoir été installé ou utilisé</li>
              <li>Le produit doit être accompagné de la facture</li>
            </ul>
            
            <h2>Procédure de retour</h2>
            <ol>
              <li>Connectez-vous à votre compte et accédez à "Mes commandes"</li>
              <li>Sélectionnez la commande concernée</li>
              <li>Cliquez sur "Demander un retour"</li>
              <li>Imprimez l'étiquette de retour fournie</li>
              <li>Déposez le colis dans un point relais</li>
            </ol>
            
            <h2>Remboursement</h2>
            <p>Le remboursement sera effectué sous 14 jours après réception et vérification du produit retourné.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export { AboutPage, ContactPage, CGVPage, ReturnsPage };

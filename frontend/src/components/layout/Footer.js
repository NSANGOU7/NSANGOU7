import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0A0F1C] text-white" data-testid="footer">
      <div className="px-6 md:px-12 lg:px-24 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <h2 className="font-bold text-2xl mb-4">
              AUTO<span className="text-[#FF3333]">PARTS</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Votre spécialiste en pièces automobiles de qualité. Neuves, d'occasion ou reconditionnées, nous avons la pièce qu'il vous faut.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Catégories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products?category=engine" className="text-slate-400 hover:text-white transition-colors">
                  Moteur
                </Link>
              </li>
              <li>
                <Link to="/products?category=brakes" className="text-slate-400 hover:text-white transition-colors">
                  Freinage
                </Link>
              </li>
              <li>
                <Link to="/products?category=suspension" className="text-slate-400 hover:text-white transition-colors">
                  Suspension
                </Link>
              </li>
              <li>
                <Link to="/products?category=electrical" className="text-slate-400 hover:text-white transition-colors">
                  Électricité
                </Link>
              </li>
              <li>
                <Link to="/products?category=bodywork" className="text-slate-400 hover:text-white transition-colors">
                  Carrosserie
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Liens Utiles</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  À Propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/cgv" className="text-slate-400 hover:text-white transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-slate-400 hover:text-white transition-colors">
                  Politique de Retour
                </Link>
              </li>
              <li>
                <Link to="/auctions" className="text-slate-400 hover:text-white transition-colors">
                  Enchères
                </Link>
              </li>
              <li>
                <Link to="/suivi" className="text-slate-400 hover:text-white transition-colors">
                  Suivre ma commande
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-slate-400">
                <MapPin size={18} className="flex-shrink-0" />
                <span>123 Rue de l'Automobile<br />75001 Paris, France</span>
              </li>
              <li>
                <a href="tel:+33123456789" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                  <Phone size={18} className="flex-shrink-0" />
                  <span>+33 1 23 45 67 89</span>
                </a>
              </li>
              <li>
                <a href="mailto:contact@autoparts.fr" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                  <Mail size={18} className="flex-shrink-0" />
                  <span>contact@autoparts.fr</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} AutoParts. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link to="/cgv" className="hover:text-white transition-colors">
              Mentions Légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

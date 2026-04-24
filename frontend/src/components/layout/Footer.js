import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

// TikTok SVG icon
const TikTokIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
  </svg>
);

// Snapchat SVG icon
const SnapchatIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.898-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.105-1.628-.225-3.654.3-4.837C7.898 1.077 11.241.807 12.203.807l.436-.015h.063z"/>
  </svg>
);

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
            <div className="flex gap-3" data-testid="social-links">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-[#1877F2] rounded-full flex items-center justify-center transition-colors"
                aria-label="Facebook"
                data-testid="social-facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/autoparts.eup?igsh=cDhlMGRncHR2anBi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 rounded-full flex items-center justify-center transition-colors"
                aria-label="Instagram"
                data-testid="social-instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@auto_france_33"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-black rounded-full flex items-center justify-center transition-colors"
                aria-label="TikTok"
                data-testid="social-tiktok"
              >
                <TikTokIcon size={16} />
              </a>
              <a
                href="https://www.snapchat.com/add/autopart.s?share_id=xcjz3hjYclQ&locale=fr-FR"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-[#FFFC00] hover:text-black rounded-full flex items-center justify-center transition-colors"
                aria-label="Snapchat"
                data-testid="social-snapchat"
              >
                <SnapchatIcon size={16} />
              </a>
              <a
                href="https://wa.me/message/RCG5UHW43X6SG1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-[#25D366] rounded-full flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
                data-testid="social-whatsapp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Catégories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products?category=engine" className="text-slate-400 hover:text-white transition-colors">Moteur</Link></li>
              <li><Link to="/products?category=brakes" className="text-slate-400 hover:text-white transition-colors">Freinage</Link></li>
              <li><Link to="/products?category=suspension" className="text-slate-400 hover:text-white transition-colors">Suspension</Link></li>
              <li><Link to="/products?category=electrical" className="text-slate-400 hover:text-white transition-colors">Électricité</Link></li>
              <li><Link to="/products?category=bodywork" className="text-slate-400 hover:text-white transition-colors">Carrosserie</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Liens Utiles</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">À Propos</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/cgv" className="text-slate-400 hover:text-white transition-colors">CGV</Link></li>
              <li><Link to="/returns" className="text-slate-400 hover:text-white transition-colors">Politique de Retour</Link></li>
              <li><Link to="/auctions" className="text-slate-400 hover:text-white transition-colors">Enchères</Link></li>
              <li><Link to="/suivi" className="text-slate-400 hover:text-white transition-colors">Suivre ma commande</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                <span>306 rue de la petite compagne<br />60730 Sainte Geneviève<br />France</span>
              </li>
              <li>
                <a href="https://wa.me/message/RCG5UHW43X6SG1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                  <MessageCircle size={18} className="flex-shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </li>
              <li>
                <a href="mailto:contact@autoparts.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                  <Mail size={18} className="flex-shrink-0" />
                  <span>contact@autoparts.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} AutoParts. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/cgv" className="hover:text-white transition-colors">Mentions Légales</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

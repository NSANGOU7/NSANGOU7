import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Wrench } from 'lucide-react';
import { Button } from '../components/ui/button';

const NotFoundPage = () => {
  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 text-center"
      data-testid="not-found-page"
    >
      <div className="relative mb-8">
        <Wrench size={80} className="text-slate-300" />
        <span className="absolute -top-2 -right-4 text-7xl font-black text-[#FF3333]">404</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">Page introuvable</h1>
      <p className="text-slate-600 max-w-md mb-8">
        Désolé, la pièce que vous cherchez n'est pas dans notre catalogue. Elle a peut-être été déplacée ou n'existe plus.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/" data-testid="not-found-home-btn">
          <Button className="bg-[#0A0F1C] hover:bg-[#1F2937] text-white">
            <Home size={16} className="mr-2" />
            Retour à l'accueil
          </Button>
        </Link>
        <Link to="/products" data-testid="not-found-catalog-btn">
          <Button variant="outline">
            <Search size={16} className="mr-2" />
            Voir le catalogue
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

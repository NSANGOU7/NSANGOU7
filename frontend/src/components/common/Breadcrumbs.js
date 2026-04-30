import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-2 text-sm text-slate-400 py-3 flex-wrap"
      data-testid="breadcrumbs"
    >
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-white transition-colors"
        data-testid="breadcrumb-home"
      >
        <Home size={14} />
        <span>Accueil</span>
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={14} className="text-slate-600" />
          {item.href && i < items.length - 1 ? (
            <Link to={item.href} className="hover:text-white transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-200 truncate max-w-xs">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;

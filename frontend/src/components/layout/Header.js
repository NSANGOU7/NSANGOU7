import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, LogOut, Package, Heart, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const Header = ({ onSearch, searchQuery, setSearchQuery }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50" data-testid="header">
      <div className="px-6 md:px-12 lg:px-24 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" data-testid="logo-link">
            <h1 className="font-bold text-xl md:text-2xl tracking-tight text-[#0A0F1C]">
              AUTO<span className="text-[#FF3333]">PARTS</span>
            </h1>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="flex w-full bg-slate-50 border border-slate-200 focus-within:border-slate-900 transition-colors">
              <input
                type="text"
                placeholder="Rechercher pièces, marques, références OEM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm"
                data-testid="search-input"
              />
              <button
                type="submit"
                className="px-4 bg-[#0A0F1C] text-white hover:bg-[#1F2937] transition-colors"
                data-testid="search-button"
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 hover:bg-slate-50 transition-colors"
              data-testid="cart-link"
            >
              <ShoppingCart size={24} className="text-[#0A0F1C]" />
              {itemCount > 0 && (
                <span className="cart-badge" data-testid="cart-badge">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-trigger">
                    <User size={20} />
                    <span className="hidden md:inline text-sm font-medium">{user.name}</span>
                    <ChevronDown size={16} className="hidden md:inline" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/account')} data-testid="account-link">
                    <User size={16} className="mr-2" />
                    Mon Compte
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account/orders')} data-testid="orders-link">
                    <Package size={16} className="mr-2" />
                    Mes Commandes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account/wishlist')} data-testid="wishlist-link">
                    <Heart size={16} className="mr-2" />
                    Ma Wishlist
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="admin-link">
                        <Settings size={16} className="mr-2" />
                        Administration
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                    <LogOut size={16} className="mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="outline" className="hidden md:flex items-center gap-2" data-testid="login-button">
                  <User size={18} />
                  Connexion
                </Button>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="login-button-mobile">
                  <User size={24} />
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden mt-4">
          <div className="flex w-full bg-slate-50 border border-slate-200 focus-within:border-slate-900">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm"
              data-testid="mobile-search-input"
            />
            <button type="submit" className="px-4 bg-[#0A0F1C] text-white">
              <Search size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white" data-testid="mobile-menu">
          <nav className="px-6 py-4 space-y-2">
            <Link to="/products?category=engine" className="block py-2 text-sm font-medium">Moteur</Link>
            <Link to="/products?category=brakes" className="block py-2 text-sm font-medium">Freinage</Link>
            <Link to="/products?category=suspension" className="block py-2 text-sm font-medium">Suspension</Link>
            <Link to="/products?category=electrical" className="block py-2 text-sm font-medium">Électricité</Link>
            <Link to="/products?category=bodywork" className="block py-2 text-sm font-medium">Carrosserie</Link>
            <Link to="/auctions" className="block py-2 text-sm font-medium text-[#FF3333]">Enchères</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

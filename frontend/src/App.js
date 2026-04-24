import React, { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

// Layout Components
import Header from "./components/layout/Header";
import CategoryNav from "./components/layout/CategoryNav";
import Footer from "./components/layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AuctionsPage from "./pages/AuctionsPage";
import AuctionDetailPage from "./pages/AuctionDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import OrdersPage from "./pages/OrdersPage";
import WishlistPage from "./pages/WishlistPage";
import AdminPage from "./pages/AdminPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminChatPage from "./pages/AdminChatPage";
import AdminAuctionsPage from "./pages/AdminAuctionsPage";
import AdminOffersPage from "./pages/AdminOffersPage";
import PayPalInstructionsPage from "./pages/PayPalInstructionsPage";
import BankTransferPage from "./pages/BankTransferPage";
import TrackingPage from "./pages/TrackingPage";
import ChatWidget from "./components/chat/ChatWidget";
import { AboutPage, ContactPage, CGVPage, ReturnsPage } from "./pages/StaticPages";

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout Component
const MainLayout = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <CategoryNav />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Show chat widget for customers, not admins */}
      {!isAdmin && <ChatWidget />}
    </div>
  );
};

// Minimal Layout (for auth pages)
const MinimalLayout = ({ children }) => {
  return <div className="min-h-screen">{children}</div>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes with Main Layout */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />
      <Route
        path="/products"
        element={
          <MainLayout>
            <ProductsPage />
          </MainLayout>
        }
      />
      <Route
        path="/products/:id"
        element={
          <MainLayout>
            <ProductDetailPage />
          </MainLayout>
        }
      />
      <Route
        path="/auctions"
        element={
          <MainLayout>
            <AuctionsPage />
          </MainLayout>
        }
      />
      <Route
        path="/auctions/:id"
        element={
          <MainLayout>
            <AuctionDetailPage />
          </MainLayout>
        }
      />
      <Route
        path="/cart"
        element={
          <MainLayout>
            <CartPage />
          </MainLayout>
        }
      />
      
      {/* Auth Routes - Minimal Layout */}
      <Route
        path="/login"
        element={
          <MinimalLayout>
            <LoginPage />
          </MinimalLayout>
        }
      />
      <Route
        path="/register"
        element={
          <MinimalLayout>
            <RegisterPage />
          </MinimalLayout>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <MinimalLayout>
              <CheckoutPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout/success"
        element={
          <MinimalLayout>
            <CheckoutSuccessPage />
          </MinimalLayout>
        }
      />
      <Route
        path="/checkout/cancel"
        element={
          <MainLayout>
            <CartPage />
          </MainLayout>
        }
      />
      <Route
        path="/paypal/:orderId"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PayPalInstructionsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bank-transfer/:orderId"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BankTransferPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Account Routes */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AccountPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/orders"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OrdersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/orders/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OrdersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/wishlist"
        element={
          <ProtectedRoute>
            <MainLayout>
              <WishlistPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute requireAdmin>
            <AdminProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requireAdmin>
            <AdminOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/chat"
        element={
          <ProtectedRoute requireAdmin>
            <AdminChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/auctions"
        element={
          <ProtectedRoute requireAdmin>
            <AdminAuctionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/offers"
        element={
          <ProtectedRoute requireAdmin>
            <AdminOffersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Public Tracking Page */}
      <Route
        path="/suivi"
        element={
          <MainLayout>
            <TrackingPage />
          </MainLayout>
        }
      />
      <Route
        path="/tracking"
        element={
          <MainLayout>
            <TrackingPage />
          </MainLayout>
        }
      />

      {/* Static Pages */}
      <Route
        path="/about"
        element={
          <MainLayout>
            <AboutPage />
          </MainLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <MainLayout>
            <ContactPage />
          </MainLayout>
        }
      />
      <Route
        path="/cgv"
        element={
          <MainLayout>
            <CGVPage />
          </MainLayout>
        }
      />
      <Route
        path="/returns"
        element={
          <MainLayout>
            <ReturnsPage />
          </MainLayout>
        }
      />
      <Route
        path="/privacy"
        element={
          <MainLayout>
            <CGVPage />
          </MainLayout>
        }
      />

      {/* 404 Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'Manrope, sans-serif'
              }
            }}
          />
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

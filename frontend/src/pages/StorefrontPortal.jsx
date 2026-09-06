import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { SubHeader } from '../components/layout/SubHeader';
import { Footer } from '../components/layout/Footer';
import { Home } from './Home';
import { LocationPickerModal } from '../components/location/LocationPickerModal';
import { AuthModal } from '../components/auth/AuthModal';
import { UploadModal } from '../components/prescription/UploadModal';
import { SearchModal } from '../components/search/SearchModal';
import { RefillModal } from '../components/refill/RefillModal';
import { CartDrawer } from '../components/cart/CartDrawer';
import { CheckoutModal } from '../components/checkout/CheckoutModal';
import { ProductDetailModal } from '../components/products/ProductDetailModal';
import { PharmacistBot } from '../components/chat/PharmacistBot';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';

export const StorefrontPortal = ({ darkMode, setDarkMode }) => {
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenRefill={() => setIsRefillOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Sub Header / Category Bar */}
      <SubHeader
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenRefill={() => setIsRefillOpen(true)}
      />

      {/* Main Storefront */}
      <main className="flex-1">
        <Home
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenRefill={() => setIsRefillOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onQuickView={(prod) => setQuickViewProduct(prod)}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating AI Pharmacist Assistant */}
      <PharmacistBot />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCategories={() => {
          const el = document.getElementById('categories-bar');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToTop={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setSelectedCategory('الكل');
        }}
        currentCategory={selectedCategory}
      />

      {/* Global Store Modals */}
      <LocationPickerModal />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(prod) => setQuickViewProduct(prod)}
      />
      <RefillModal isOpen={isRefillOpen} onClose={() => setIsRefillOpen(false)} />
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
      <ProductDetailModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onSelectAlternative={(alt) => setQuickViewProduct(alt)}
        onBuyNow={() => setIsCheckoutOpen(true)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { SubHeader } from '../components/layout/SubHeader';
import { Footer } from '../components/layout/Footer';
import { LocationPickerModal } from '../components/location/LocationPickerModal';
import { AuthModal } from '../components/auth/AuthModal';
import { UploadModal } from '../components/prescription/UploadModal';
import { SearchModal } from '../components/search/SearchModal';
import { RefillModal } from '../components/refill/RefillModal';
import { InsuranceContractModal } from '../components/insurance/InsuranceContractModal';
import { CartDrawer } from '../components/cart/CartDrawer';
import { OrderTrackingModal } from '../components/tracking/OrderTrackingModal';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';

export const StorefrontPortal = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');

  const handleOpenTracking = (orderId) => {
    setTrackingOrderId(orderId || '');
    setIsTrackingOpen(true);
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

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
        onOpenInsurance={() => setIsInsuranceOpen(true)}
        onOpenTracking={handleOpenTracking}
        onOpenCart={() => navigate('/cart')}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Sub Header / Category Bar (Minimalist & Calm) */}
      <SubHeader
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Storefront Router Outlet */}
      <main className="flex-1">
        <Outlet
          context={{
            selectedCategory,
            setSelectedCategory: handleSelectCategory,
            onOpenUpload: () => setIsUploadOpen(true),
            onOpenRefill: () => setIsRefillOpen(true),
            onOpenInsurance: () => setIsInsuranceOpen(true),
            onOpenSearch: () => setIsSearchOpen(true),
            handleOpenTracking,
          }}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => navigate('/cart')}
        onOpenCategories={() => navigate('/categories')}
        onScrollToTop={() => {
          if (location.pathname !== '/') {
            navigate('/');
          }
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
        onSelectProduct={(prod) => {
          setIsSearchOpen(false);
          navigate(`/product/${prod.id}`);
        }}
      />
      <RefillModal isOpen={isRefillOpen} onClose={() => setIsRefillOpen(false)} />
      <InsuranceContractModal
        isOpen={isInsuranceOpen}
        onClose={() => setIsInsuranceOpen(false)}
      />
      <CartDrawer
        onOpenCheckout={() => navigate('/checkout')}
        onOpenCart={() => navigate('/cart')}
      />
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderId={trackingOrderId}
      />
    </div>
  );
};

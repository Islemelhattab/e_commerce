import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Services et Hooks locaux
import { useAuthStore } from './services/store';
import useWebSocket from './hooks/useWebSocket';
import './styles/main.css';

// Shop Layout locaux
import Navbar from './components/layout/Navbar'; 
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import ChatWidget from './components/chat/ChatWidget';

// Shop Pages locales
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/account/OrdersPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import ProfilePage from './pages/account/ProfilePage';
import WishlistPage from './pages/account/WishlistPage';
import NotificationsPage from './pages/account/NotificationsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import DigitalArtGalleryPage from './pages/DigitalArtGalleryPage';
import FuturisticMarketplacePage from './pages/FuturisticMarketplacePage';
import DemoFuturisticPage from './pages/DemoFuturisticPage';
import LandingPage from './pages/LandingPage';
import NoLayoutDemoPage from './pages/NoLayoutDemoPage';
import SimpleDemoPage from './pages/SimpleDemoPage';
import PureDemoPage from './pages/PureDemoPage';
import BeautifulDemoPage from './pages/BeautifulDemoPage';
import FixedDemoPage from './pages/FixedDemoPage';
import FinalDemoPage from './pages/FinalDemoPage';
import SwipeShopPage from './pages/SwipeShopPage';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import { AdminOrdersPage, AdminUsersPage, AdminProductsPage } from './pages/admin/AdminOrdersUsersProducts';
import { AdminReviewsPage, AdminReturnsPage, AdminCouponsPage, AdminNewsletterPage, AdminBannersPage, AdminReportsPage } from './pages/admin/AdminOtherPages';
import AdminChatbotPage from './pages/admin/AdminChatbotPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } },
});

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to={`/login?redirect=${location.pathname}`} replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login?redirect=/admin" replace />;
  if (!user?.is_staff) return <Navigate to="/" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function ShopLayout({ children }) {
  return (
    <div className="app">
      <Navbar />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

function WSInitializer() {
  useWebSocket();
  return null;
}

export default function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => { if (localStorage.getItem('access_token')) loadUser(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <WSInitializer />
        <Routes>
          {/* ADMIN */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="returns" element={<AdminReturnsPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="newsletter" element={<AdminNewsletterPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="chatbot" element={<AdminChatbotPage />} />
          </Route>
          
          {/* Landing Page - No Layout */}
          <Route path="/landing" element={<LandingPage />} />
          
          {/* No Layout Demo - No Navbar = No 401 Errors */}
          <Route path="/nolayout-demo" element={<NoLayoutDemoPage />} />
          
          {/* Simple Demo - Basic Version */}
          <Route path="/simple-demo" element={<SimpleDemoPage />} />
          
          {/* Pure Demo - ZERO API Calls */}
          <Route path="/pure-demo" element={<PureDemoPage />} />
          
          {/* Beautiful Demo - Blue & White Design */}
          <Route path="/beautiful-demo" element={<BeautifulDemoPage />} />
          
          {/* Fixed Demo - No Errors */}
          <Route path="/fixed-demo" element={<FixedDemoPage />} />
          
          {/* FINAL DEMO - WORKS 100% */}
          <Route path="/final-demo" element={<FinalDemoPage />} />
          
          {/* SHOP */}
          <Route path="/*" element={
            <ShopLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/category/:slug" element={<ProductsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
                <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
                <Route path="/account/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/account/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/account/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/account/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                <Route path="/account/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
                <Route path="/digital-art-gallery" element={<ProtectedRoute><DigitalArtGalleryPage /></ProtectedRoute>} />
                <Route path="/futuristic-marketplace" element={<ProtectedRoute><FuturisticMarketplacePage /></ProtectedRoute>} />
                <Route path="/demo-futuristic" element={<DemoFuturisticPage />} />
                <Route path="/swipe-shop" element={<SwipeShopPage />} />
              </Routes>
            </ShopLayout>
          } />
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', fontSize: '14px' } }} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
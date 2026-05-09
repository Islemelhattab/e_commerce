import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from "./services/store";
import useWebSocket from "./hooks/useWebSocket";
import './styles/main.css';

// Shop Layout
import Navbar from "./components/layouts/Navbar";
import Footer from "./components/layouts/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import ChatWidget from "./components/chat/ChatWidget";

// Shop Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrdersPage from "./pages/account/OrdersPage";
import OrderDetailPage from "./pages/account/OrderDetailPage";
import ProfilePage from "./pages/account/ProfilePage";
import WishlistPage from "./pages/account/WishlistPage";
import NotificationsPage from "./pages/account/NotificationsPage";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import {
  AdminOrdersPage,
  AdminUsersPage,
  AdminProductsPage
} from "./pages/admin/AdminOrdersUsersProducts";

import {
  AdminReviewsPage,
  AdminReturnsPage,
  AdminCouponsPage,
  AdminNewsletterPage,
  AdminBannersPage,
  AdminReportsPage
} from "./pages/admin/AdminOtherPages";

import AdminChatbotPage from "./pages/admin/AdminChatbotPage";

// ERP
import ErpLayout from "./components/erp/ErpLayout";
import ErpDashboard from "./pages/erp/ErpDashboard";

import {
  SuppliersPage,
  PurchaseOrdersPage,
  InvoicesPage
} from "./pages/erp/PurchasingPages";

import {
  AccountingPage,
  BalancePage,
  TVAPage,
  PeriodsPage
} from "./pages/erp/AccountingPages";

import {
  EmployeesPage,
  LeavesPage,
  PayrollPage
} from "./pages/erp/HRPages";

import {
  SupplierLayout,
  SupplierOrdersPage,
  SupplierInvoicesPage
} from "./pages/supplier/SupplierPortal";


const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } },
});

// FIX: Route guards now show a blank loader while the profile is being fetched
// (isLoadingUser = true) instead of immediately redirecting to "/" or "/login".
// This prevents the flash-redirect when the page is refreshed.

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingUser } = useAuthStore();
  const location = useLocation();
  if (isLoadingUser) return null; // wait for profile fetch
  return isAuthenticated ? children : <Navigate to={`/login?redirect=${location.pathname}`} replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoadingUser } = useAuthStore();
  if (isLoadingUser) return null; // wait – don't redirect while fetching
  if (!isAuthenticated) return <Navigate to="/login?redirect=/admin" replace />;
  if (!user?.is_staff) return <Navigate to="/" replace />;
  return children;
};

const ErpRoute = ({ children }) => {
  const { isAuthenticated, user, isLoadingUser } = useAuthStore();
  if (isLoadingUser) return null;
  if (!isAuthenticated) return <Navigate to='/login?redirect=/erp' replace />;
  const groups = user?.groups || [];
  const hasErpAccess = user?.is_staff
    || groups.includes('Comptable')
    || groups.includes('Responsable RH');
  if (!hasErpAccess) return <Navigate to='/' replace />;
  return children;
};

const SupplierRoute = ({ children }) => {
  const { isAuthenticated, user, isLoadingUser } = useAuthStore();
  if (isLoadingUser) return null;
  if (!isAuthenticated) return <Navigate to='/login?redirect=/supplier' replace />;
  const groups = user?.groups || [];
  if (!groups.includes('Fournisseur') && !user?.is_staff)
    return <Navigate to='/' replace />;
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
  useEffect(() => {
    if (localStorage.getItem('access_token')) loadUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <WSInitializer />
        <Routes>
          {/* ADMIN (no shop nav) */}
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

          {/* ERP (Achats + Compta + RH) */}
          <Route path='/erp' element={<ErpRoute><ErpLayout /></ErpRoute>}>
            <Route index           element={<ErpDashboard />} />
            <Route path='purchasing' element={<PurchaseOrdersPage />} />
            <Route path='suppliers'  element={<SuppliersPage />} />
            <Route path='invoices'   element={<InvoicesPage />} />
            <Route path='accounting' element={<AccountingPage />} />
            <Route path='balance'    element={<BalancePage />} />
            <Route path='tva'        element={<TVAPage />} />
            <Route path='periods'    element={<PeriodsPage />} />
            <Route path='employees'  element={<EmployeesPage />} />
            <Route path='leaves'     element={<LeavesPage />} />
            <Route path='payroll'    element={<PayrollPage />} />
          </Route>

          {/* Portail Fournisseur */}
          <Route path='/supplier' element={<SupplierRoute><SupplierLayout /></SupplierRoute>}>
            <Route index           element={<SupplierOrdersPage />} />
            <Route path='invoices' element={<SupplierInvoicesPage />} />
          </Route>

          {/* SHOP (with nav/footer/chatbot) */}
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
              </Routes>
            </ShopLayout>
          } />
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', fontSize: '14px' } }} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

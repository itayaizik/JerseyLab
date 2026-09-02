import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Layouts
import MainLayout from '@/components/MainLayout';
import AdminLayout from '@/components/AdminLayout';
import AdminRoute from '@/components/AdminRoute';

// Auth Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Public Pages (Home/Catalog/ShirtDetail stay eager for the critical path)
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import ShirtDetail from '@/pages/ShirtDetail';
const MysteryBox = lazy(() => import('@/pages/MysteryBox'));
const RequestShirt = lazy(() => import('@/pages/RequestShirt'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const Contact = lazy(() => import('@/pages/Contact'));
const SizeGuide = lazy(() => import('@/pages/SizeGuide'));

// Protected Customer Pages
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const Profile = lazy(() => import('@/pages/Profile'));

// Admin Pages (code-split — only loaded for admins)
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AddShirt = lazy(() => import('@/pages/admin/AddShirt'));
const BulkImportShirts = lazy(() => import('@/pages/admin/BulkImportShirts'));
const ManageShirts = lazy(() => import('@/pages/admin/ManageShirts'));
const EditShirt = lazy(() => import('@/pages/admin/EditShirt'));
const ManageRequests = lazy(() => import('@/pages/admin/ManageRequests'));
const ManageShirtRequests = lazy(() => import('@/pages/admin/ManageShirtRequests'));
const ManageContactMessages = lazy(() => import('@/pages/admin/ManageContactMessages'));
const ManageCategories = lazy(() => import('@/pages/admin/ManageCategories'));
const ManageReviews = lazy(() => import('@/pages/admin/ManageReviews'));
const ManageFAQ = lazy(() => import('@/pages/admin/ManageFAQ'));
const SiteSettings = lazy(() => import('@/pages/admin/SiteSettings'));
const SearchAnalytics = lazy(() => import('@/pages/admin/SearchAnalytics'));
const SalesReport = lazy(() => import('@/pages/admin/SalesReport'));
const ManageHomeSections = lazy(() => import('@/pages/admin/ManageHomeSections'));
const ManageInstagram = lazy(() => import('@/pages/admin/ManageInstagram'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-pitch">
        <div className="text-center">
          <div className="font-heading font-black text-3xl mb-4">
            <span className="text-turf">JERSEY</span>
            <span className="text-chalk">LAB</span>
          </div>
          <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin"></div></div>}>
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public Routes with Main Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/shirt/:id" element={<ShirtDetail />} />
        <Route path="/mystery-box" element={<MysteryBox />} />
        <Route path="/request-shirt" element={<RequestShirt />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/size-guide" element={<SizeGuide />} />

        {/* Protected Customer Routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/add-shirt" element={<AddShirt />} />
          <Route path="/admin/bulk-import" element={<BulkImportShirts />} />
          <Route path="/admin/shirts" element={<ManageShirts />} />
          <Route path="/admin/edit-shirt/:id" element={<EditShirt />} />
          <Route path="/admin/requests" element={<ManageRequests />} />
          <Route path="/admin/shirt-requests" element={<ManageShirtRequests />} />
          <Route path="/admin/contact-messages" element={<ManageContactMessages />} />
          <Route path="/admin/categories" element={<ManageCategories />} />
          <Route path="/admin/reviews" element={<ManageReviews />} />
          <Route path="/admin/faq" element={<ManageFAQ />} />
          <Route path="/admin/settings" element={<SiteSettings />} />
          <Route path="/admin/search-analytics" element={<SearchAnalytics />} />
          <Route path="/admin/sales" element={<SalesReport />} />
          <Route path="/admin/home-sections" element={<ManageHomeSections />} />
          <Route path="/admin/instagram" element={<ManageInstagram />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
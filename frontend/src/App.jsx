import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import ScrollToTop from './components/ScrollToTop';

// Public Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ApartmentDetailPage from './pages/ApartmentDetailPage';
import BookingCheckoutPage from './pages/BookingCheckoutPage';
import InvoicePage from './pages/InvoicePage';
import CheckBookingPage from './pages/CheckBookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages & Guard
import AdminRoute from './components/AdminRoute';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage';
import AdminCitiesPage from './pages/admin/AdminCitiesPage';
import AdminPropertyTypesPage from './pages/admin/AdminPropertyTypesPage';
import AdminPaymentMethodsPage from './pages/admin/AdminPaymentMethodsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminHostexPage from './pages/admin/AdminHostexPage';

export default function App() {
  return (
    <BrowserRouter>
      {/* Auto Scroll To Top on Route Changes */}
      <ScrollToTop />

      <AuthProvider>
        {/* React Hot Toast Provider */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#fff',
              fontSize: '13px',
              borderRadius: '14px',
              padding: '12px 18px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />

        {/* Global Auth Modal for Customer Login / Register */}
        <AuthModal />

        {/* Floating WhatsApp Quick Contact Button */}
        <FloatingWhatsApp />

        <Routes>
          {/* Guest Booking Flow */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/apartment/:id" element={<ApartmentDetailPage />} />
          <Route path="/checkout" element={<BookingCheckoutPage />} />
          <Route path="/invoice/:invoiceNumber" element={<InvoicePage />} />
          <Route path="/check-booking" element={<CheckBookingPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />

          {/* Admin Login Route (Public within Admin Context) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes (Guard with AdminRoute) */}
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookingsPage /></AdminRoute>} />
          <Route path="/admin/properties" element={<AdminRoute><AdminPropertiesPage /></AdminRoute>} />
          <Route path="/admin/cities" element={<AdminRoute><AdminCitiesPage /></AdminRoute>} />
          <Route path="/admin/property-types" element={<AdminRoute><AdminPropertyTypesPage /></AdminRoute>} />
          <Route path="/admin/payment-methods" element={<AdminRoute><AdminPaymentMethodsPage /></AdminRoute>} />
          <Route path="/admin/reviews" element={<AdminRoute><AdminReviewsPage /></AdminRoute>} />
          <Route path="/admin/hostex" element={<AdminRoute><AdminHostexPage /></AdminRoute>} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

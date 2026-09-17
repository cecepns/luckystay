import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import { CardSkeleton, EmptyState } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { FileText, Calendar, MapPin, Building2, CreditCard, ArrowRight, UserCheck, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/ImageWithFallback';

export default function MyBookingsPage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.USER.MY_BOOKINGS);
      if (res.success) {
        setBookings(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar pesanan Anda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Profile Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 text-gray-900 shadow-sm mb-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'G')}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Akun Tamu Terverifikasi</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                  {user?.name || user?.email || 'Guest User'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {user?.email || 'Silakan login untuk mengelola staycation Anda'}
                  {user?.phone && ` • ${user.phone}`}
                </p>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-200">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Total Reservasi</span>
                  <p className="text-2xl font-black text-gray-900">{bookings.length}</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <Link
                  to="/"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                >
                  + Pesan Unit Baru
                </Link>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-sm transition-all hover:scale-105 cursor-pointer"
              >
                Masuk ke Akun Saya
              </button>
            )}
          </div>
        </div>

        {/* Bookings List Section */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm max-w-lg mx-auto">
            <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Anda Belum Masuk</h3>
            <p className="text-sm text-gray-500 mb-6">
              Masuk atau buat akun baru untuk melihat semua riwayat pesanan, status pembayaran invoice, dan konfirmasi otomatis unit.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-xl text-xs hover:bg-gray-800 transition-all"
              >
                Masuk Akun
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-xs hover:bg-orange-600 transition-all"
              >
                Daftar Baru
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum Ada Riwayat Pesanan"
            description="Anda belum memiliki pesanan apartemen atau hotel aktif saat ini. Mulai cari staycation impian Anda sekarang!"
            actionText="Jelajahi Pilihan Properti"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Riwayat Pesanan Anda ({bookings.length})</h2>
              <button
                onClick={fetchMyBookings}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Perbarui Status
              </button>
            </div>

            {bookings.map((b) => {
              const defaultImg =
                b.property_images?.[0] ||
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 w-full lg:w-auto">
                    <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden border border-gray-100 shrink-0">
                      <ImageWithFallback
                        src={defaultImg}
                        alt={b.property_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700">
                          {b.invoice_number}
                        </span>
                        <StatusBadge status={b.payment_status} type="payment" />
                        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold">
                          {b.category || b.type}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base sm:text-lg hover:text-orange-600 transition-colors">
                        <Link to={`/invoice/${b.invoice_number}`}>{b.property_name}</Link>
                      </h3>

                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        <span>{b.building_name ? `${b.building_name}, ` : ''}{b.city}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDateIndo(b.check_in_date)} — {formatDateIndo(b.check_out_date)} ({b.total_nights} Malam)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pricing & Actions */}
                  <div className="w-full lg:w-auto flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-100 shrink-0 gap-3">
                    <div className="text-left lg:text-right">
                      <span className="text-xs text-gray-400 font-medium">Total Pembayaran</span>
                      <p className="text-lg sm:text-xl font-extrabold text-orange-600">
                        {formatRupiah(b.grand_total)}
                      </p>
                    </div>

                    <Link
                      to={`/invoice/${b.invoice_number}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <span>Lihat Invoice & Tiket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { Search, FileText, Calendar, MapPin, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckBookingPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Masukkan nomor invoice atau nomor HP!');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await request.get(API_ENDPOINTS.BOOKINGS.DETAIL(identifier.trim()));
      if (res.success) {
        setBooking(res.data);
      } else {
        setBooking(null);
      }
    } catch (err) {
      setBooking(null);
      toast.error('Pesanan tidak ditemukan. Periksa kembali nomor invoice Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-orange-50 text-orange-600 mb-1">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Cek Status Pesanan & Invoice
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Masukkan Nomor Invoice (misal: <span className="font-mono font-semibold text-gray-700">INV-LS20260910-001</span>) atau nomor HP yang Anda daftarkan saat memesan.
          </p>
        </div>

        {/* Search Input Card */}
        <form onSubmit={handleSearch} className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-lg shadow-gray-200/50 flex gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="Nomor Invoice atau Nomor WhatsApp..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-md shadow-orange-500/25 transition-all shrink-0 cursor-pointer"
          >
            {loading ? 'Mencari...' : 'Cek Status'}
          </button>
        </form>

        {/* Search Result */}
        {searched && (
          <div className="mt-8">
            {booking ? (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nomor Invoice</span>
                    <span className="font-mono text-base font-extrabold text-gray-900">{booking.invoice_number}</span>
                  </div>
                  <div>
                    <StatusBadge status={booking.payment_status} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Nama Tamu</span>
                    <strong className="text-gray-800 text-sm">{booking.guest_name}</strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block mb-0.5">Properti</span>
                    <strong className="text-gray-800 text-sm">{booking.property?.name}</strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block mb-0.5">Periode Menginap</span>
                    <span className="text-gray-800 font-medium">
                      {formatDateIndo(booking.check_in_date)} - {formatDateIndo(booking.check_out_date)} ({booking.total_nights} Malam)
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block mb-0.5">Total Tagihan</span>
                    <strong className="text-orange-600 text-sm">{formatRupiah(booking.grand_total)}</strong>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => navigate(`/invoice/${booking.invoice_number}`)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Buka Rincian Invoice & Bukti Bayar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : !loading && (
              <div className="text-center py-10 bg-white rounded-3xl border border-gray-200">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-gray-800 text-sm">Pesanan Tidak Ditemukan</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Pastikan format nomor invoice sudah tepat seperti INV-LS20260910-001.
                </p>
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

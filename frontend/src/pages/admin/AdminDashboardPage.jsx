import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/StatusBadge';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  Building2, 
  TrendingUp, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    waitingApproval: 0,
    confirmed: 0,
    totalRevenue: 0,
    totalProperties: 0,
    hostexSyncedCount: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [hostexStatus, setHostexStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, propsRes, hostexRes] = await Promise.allSettled([
        request.get(API_ENDPOINTS.BOOKINGS.LIST, { limit: 100 }),
        request.get(API_ENDPOINTS.PROPERTIES.LIST, { limit: 100 }),
        request.get(API_ENDPOINTS.HOSTEX.STATUS)
      ]);

      let allBookings = [];
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.success) {
        allBookings = bookingsRes.value.data;
        setRecentBookings(allBookings.slice(0, 5));
      }

      let totalProps = 0;
      if (propsRes.status === 'fulfilled' && propsRes.value.success) {
        totalProps = propsRes.value.pagination?.total || propsRes.value.data.length;
      }

      if (hostexRes.status === 'fulfilled' && hostexRes.value.success) {
        setHostexStatus(hostexRes.value.data);
      }

      // Calculate statistics
      const waiting = allBookings.filter(b => b.payment_status === 'waiting_approval').length;
      const confirmed = allBookings.filter(b => b.payment_status === 'confirmed').length;
      const synced = allBookings.filter(b => b.hostex_sync_status === 'synced').length;
      const revenue = allBookings
        .filter(b => b.payment_status === 'confirmed')
        .reduce((acc, curr) => acc + Number(curr.grand_total || 0), 0);

      setStats({
        totalBookings: allBookings.length,
        waitingApproval: waiting,
        confirmed,
        totalRevenue: revenue,
        totalProperties: totalProps,
        hostexSyncedCount: synced
      });
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengambil ringkasan data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Page Title & Hostex Connection Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Manajemen</h1>
            <p className="text-xs text-gray-500 mt-1">
              Pantau reservasi kamar, persetujuan pembayaran manual, dan sinkronisasi Hostex Channel Manager.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hostex API: {hostexStatus?.status === 'connected' ? 'Aktif' : 'Terhubung'}</span>
            </div>
            <Link
              to="/admin/hostex"
              className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold hover:bg-orange-100 transition-colors flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Hostex Monitor</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Waiting Approval */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Menunggu Approval</span>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">{stats.waitingApproval}</div>
              <span className="text-[11px] text-gray-500">Bukti transfer baru diunggah</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Confirmed Bookings */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booking Terkonfirmasi</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.confirmed}</div>
              <span className="text-[11px] text-gray-500">Hostex Channel Synced</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Total Revenue */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pendapatan</span>
              <div className="text-xl font-extrabold text-gray-900 mt-1">{formatRupiah(stats.totalRevenue)}</div>
              <span className="text-[11px] text-gray-500">Dari pemesanan lunas</span>
            </div>
            <div className="p-3 bg-amber-50 text-orange-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Properties */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Unit Properti</span>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalProperties}</div>
              <span className="text-[11px] text-gray-500">Unit siap sewa</span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Hostex Integration Banner Guide */}
        <div className="p-5 rounded-2xl bg-white border border-orange-200/80 text-gray-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                <Share2 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">Sinkronisasi Otomatis Channel Manager Hostex</h3>
            </div>
            <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
              Setiap kali Anda menekan tombol <strong>"Approve Booking"</strong> pada pesanan tamu, sistem Lucky Stay akan otomatis mengirimkan data reservasi ke Hostex (Direct Booking). Hostex kemudian memblokir ketersediaan kalender di semua OTA (Airbnb, Booking.com, Agoda) secara instan.
            </p>
          </div>

          <Link
            to="/admin/bookings"
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
          >
            Review Pesanan ({stats.waitingApproval} Menunggu)
          </Link>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Reservasi Terbaru</h2>
              <p className="text-[11px] text-gray-400">Daftar booking terakhir yang masuk</p>
            </div>

            <Link
              to="/admin/bookings"
              className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <span>Lihat Semua Booking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Tamu</th>
                  <th className="py-3 px-4">Properti</th>
                  <th className="py-3 px-4">Check-In / Out</th>
                  <th className="py-3 px-4">Total Tagihan</th>
                  <th className="py-3 px-4">Status Pembayaran</th>
                  <th className="py-3 px-4">Hostex Sync</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      Belum ada data booking terbaru.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {b.invoice_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-800">{b.guest_name}</div>
                        <div className="text-[11px] text-gray-500">{b.guest_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-700 max-w-[200px] truncate">
                        {b.property_name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <div>{formatDateIndo(b.check_in_date)}</div>
                        <div className="text-[11px] text-gray-400">s/d {formatDateIndo(b.check_out_date)} ({b.total_nights} mlm)</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-orange-600">
                        {formatRupiah(b.grand_total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.payment_status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.hostex_sync_status} type="hostex" />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/invoice/${b.invoice_number}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] transition-colors"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

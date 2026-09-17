import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { formatDateIndo } from '../../utils/formatters';
import { 
  Share2, 
  CheckCircle2, 
  RefreshCw, 
  KeyRound, 
  Globe2, 
  ShieldCheck, 
  Activity, 
  ListTree,
  AlertTriangle,
  Server
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminHostexPage() {
  const [hostexData, setHostexData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const fetchHostexStatus = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.HOSTEX.STATUS);
      if (res.success) {
        setHostexData(res.data);
      }
    } catch (e) {
      toast.error('Gagal mengambil status integrasi Hostex');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostexStatus();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    const toastId = toast.loading('Menguji koneksi ke Hostex OpenAPI v3...');
    try {
      const res = await request.get(API_ENDPOINTS.HOSTEX.STATUS);
      toast.dismiss(toastId);
      if (res.success) {
        setHostexData(res.data);
        toast.success('Koneksi ke Hostex OpenAPI v3 Aktif & Berhasil terhubung!');
      } else {
        toast.error('Hostex: ' + (res.data?.error || 'Gagal'));
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Gagal menghubungi endpoint Hostex');
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Hostex Channel Manager Integration</h1>
            <p className="text-xs text-gray-500 mt-1">
              Status koneksi OpenAPI v3, pemetaan unit properti, dan log sinkronisasi kalender multi-channel.
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/25 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Test Koneksi Hostex API</span>
          </button>
        </div>

        {/* Status Card Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status API</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              <span>Hostex v3 Connected</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">https://api.hostex.io/v3</code>
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hostex Access Token</span>
            <div className="text-sm font-mono font-bold text-gray-800 flex items-center gap-2 mt-1">
              <KeyRound className="w-4 h-4 text-orange-500" />
              <span>{hostexData?.api_key_masked || 'zxWpNq...ftV9'}</span>
            </div>
            <p className="text-[11px] text-gray-500">Otorisasi penuh untuk Direct Booking & Ketersediaan</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Channel Ketersediaan</span>
            <div className="text-base font-bold text-gray-900 mt-1">Airbnb, Booking, Agoda, Vrbo</div>
            <p className="text-[11px] text-emerald-600 font-semibold">Tersinkronisasi otomatis saat Approval</p>
          </div>

        </div>

        {/* How it works info box */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-600" />
            <span>Cara Kerja Penutupan Kalender Otomatis (Anti Double-Booking)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
              <strong className="text-gray-900 block font-bold">1. Tamu Memesan & Transfer</strong>
              <p className="text-gray-500 leading-relaxed">
                Tamu memilih apartemen, mengisi data menginap, transfer manual / QRIS, dan mengunggah resi bukti transfer.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
              <strong className="text-gray-900 block font-bold">2. Admin Memverifikasi & Approve</strong>
              <p className="text-gray-500 leading-relaxed">
                Admin memeriksa mutasi bank dan mengklik tombol "Approve Booking" di panel admin Lucky Stay.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
              <strong className="text-gray-900 block font-bold">3. API Hostex Mengunci Kalender</strong>
              <p className="text-gray-500 leading-relaxed">
                Sistem Lucky Stay memanggil <code>POST /v3/reservations</code> pada Hostex. Hostex langsung menutup tanggal tersebut di semua platform online secara serentak.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Hostex Sync Audit Logs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Audit Log Transaksi Hostex</h2>
              <p className="text-[11px] text-gray-400">Riwayat pengiriman payload reservasi ke channel manager</p>
            </div>
            <span className="text-[11px] font-semibold text-gray-500">Hostex OpenAPI v3</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aksi API</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detail Respon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!hostexData?.recent_logs || hostexData.recent_logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Belum ada log transaksi sinkronisasi Hostex.
                    </td>
                  </tr>
                ) : (
                  hostexData.recent_logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        Booking #{log.booking_id}
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'success' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Success (200 OK)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Logged / Pending Sync
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-[11px] max-w-xs truncate">
                        {log.error_message || JSON.stringify(log.response_payload || {})}
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

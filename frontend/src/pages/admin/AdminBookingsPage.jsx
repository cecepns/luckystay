import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { TableRowSkeleton, EmptyState } from '../../components/Skeleton';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  Search, 
  CalendarCheck, 
  Eye, 
  Check, 
  X, 
  RefreshCw, 
  ExternalLink, 
  FileText, 
  Filter,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '../../components/ImageWithFallback';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350); // Debounce >= 300ms
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state from Backend API
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit Booking Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    number_of_guests: 1,
    check_in_date: '',
    check_out_date: '',
    payment_status: 'pending_payment',
    payment_method: 'bank_transfer',
    special_requests: '',
    admin_notes: '',
    grand_total: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchBookings = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const res = await request.get(API_ENDPOINTS.BOOKINGS.LIST, params);
      if (res.success) {
        setBookings(res.data);
        setPagination(res.pagination || { page, limit, total: res.data.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar pemesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1, pagination.limit);
  }, [debouncedSearch, statusFilter]);

  // Handle Approve Booking -> Calls Hostex API to sync & close dates!
  const handleApprove = async (booking) => {
    if (!window.confirm(`Yakin ingin menyetujui pemesanan ${booking.invoice_number}? Kalender di Hostex Channel Manager akan otomatis ditutup.`)) {
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading('Menyetujui booking & menyinkronkan ke Hostex Channel Manager...');

    try {
      const res = await request.put(API_ENDPOINTS.BOOKINGS.APPROVE(booking.id), {
        admin_notes: 'Disetujui oleh admin Lucky Stay. Kalender Hostex tertutup.'
      });

      toast.dismiss(loadingToast);

      if (res.success) {
        if (res.hostex?.success) {
          toast.success(`Booking disetujui & disinkronkan ke Hostex! (Kode: ${res.data.hostex_reservation_code})`, { duration: 5000 });
        } else {
          toast.success('Booking disetujui secara lokal! Respon Hostex telah dicatat.');
        }
        fetchBookings(pagination.page, pagination.limit);
        if (showProofModal) setShowProofModal(false);
      } else {
        toast.error(res.message || 'Gagal menyetujui booking');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.customMessage || 'Terjadi kesalahan saat approve');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject Booking
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setIsProcessing(true);
    try {
      const res = await request.put(API_ENDPOINTS.BOOKINGS.REJECT(selectedBooking.id), {
        reason: rejectReason || 'Bukti transfer tidak valid atau unit tidak tersedia'
      });

      if (res.success) {
        toast.success('Booking berhasil ditolak');
        setShowRejectModal(false);
        setRejectReason('');
        fetchBookings(pagination.page, pagination.limit);
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal menolak booking');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Manual Retry Sync to Hostex
  const handleHostexSync = async (bookingId) => {
    const loadingToast = toast.loading('Menyinkronkan ke Hostex...');
    try {
      const res = await request.post(API_ENDPOINTS.BOOKINGS.SYNC_HOSTEX(bookingId));
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success('Sinkronisasi ke Hostex berhasil! Kalender OTA telah tertutup.');
        fetchBookings(pagination.page, pagination.limit);
      } else {
        toast.error('Hostex: ' + (res.message || 'Gagal'));
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Gagal menghubungi server Hostex');
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (booking) => {
    setEditingBooking(booking);
    setEditFormData({
      guest_name: booking.guest_name || '',
      guest_email: booking.guest_email || '',
      guest_phone: booking.guest_phone || '',
      number_of_guests: booking.number_of_guests || 1,
      check_in_date: typeof booking.check_in_date === 'string' ? booking.check_in_date.slice(0, 10) : '',
      check_out_date: typeof booking.check_out_date === 'string' ? booking.check_out_date.slice(0, 10) : '',
      payment_status: booking.payment_status || 'pending_payment',
      payment_method: booking.payment_method || 'bank_transfer',
      special_requests: booking.special_requests || '',
      admin_notes: booking.admin_notes || '',
      grand_total: booking.grand_total || ''
    });
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.guest_name.trim() || !editFormData.guest_phone.trim()) {
      toast.error('Nama dan nomor WhatsApp tamu wajib diisi!');
      return;
    }
    if (!editFormData.check_in_date || !editFormData.check_out_date) {
      toast.error('Tanggal check-in dan check-out wajib diisi!');
      return;
    }
    if (new Date(editFormData.check_out_date) <= new Date(editFormData.check_in_date)) {
      toast.error('Tanggal check-out harus setelah tanggal check-in!');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await request.put(API_ENDPOINTS.BOOKINGS.UPDATE(editingBooking.id), editFormData);
      if (res.success) {
        toast.success('Data pemesanan berhasil diperbarui!');
        setShowEditModal(false);
        fetchBookings(pagination.page, pagination.limit);
      } else {
        toast.error(res.message || 'Gagal memperbarui pemesanan');
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal memperbarui pemesanan');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Delete Booking with Confirm Toast
  const handleDeleteBooking = (booking) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>Hapus Pemesanan #{booking.invoice_number}?</span>
        </div>
        <p className="text-xs text-gray-500">
          Tamu: <span className="font-semibold text-gray-700">{booking.guest_name}</span> ({booking.property_name || 'Properti'}). Data akan dihapus secara permanen.
        </p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading('Menghapus pemesanan...');
              try {
                const res = await request.delete(API_ENDPOINTS.BOOKINGS.DELETE(booking.id));
                toast.dismiss(loadingToast);
                if (res.success) {
                  toast.success(`Pemesanan ${booking.invoice_number} berhasil dihapus!`);
                  fetchBookings(pagination.page, pagination.limit);
                } else {
                  toast.error(res.message || 'Gagal menghapus');
                }
              } catch (err) {
                toast.dismiss(loadingToast);
                toast.error(err.customMessage || 'Gagal menghapus pemesanan');
              }
            }}
            className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Kelola Pemesanan & Approval</h1>
            <p className="text-xs text-gray-500 mt-1">
              Verifikasi bukti transfer manual dan otomatis sinkronkan penutupan kalender ke Hostex Channel Manager.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchBookings(pagination.page, pagination.limit)}
              className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Filter & Realtime Debounced Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Realtime Debounce Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari realtime: Nomor invoice, nama tamu, no. HP, properti... (Debounce 350ms)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="all">Semua Status</option>
              <option value="waiting_approval">Menunggu Approval (Verifikasi)</option>
              <option value="pending_payment">Menunggu Pembayaran</option>
              <option value="confirmed">Terkonfirmasi (Lunas)</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Invoice</th>
                  <th className="py-3.5 px-4">Data Tamu</th>
                  <th className="py-3.5 px-4">Unit Properti</th>
                  <th className="py-3.5 px-4">Jadwal Menginap</th>
                  <th className="py-3.5 px-4">Tagihan</th>
                  <th className="py-3.5 px-4">Status Bayar</th>
                  <th className="py-3.5 px-4">Hostex Sync</th>
                  <th className="py-3.5 px-4 text-center">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={8} />
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Tidak ada data booking yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                      
                      {/* Invoice */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-gray-900 block">{b.invoice_number}</span>
                        <span className="text-[10px] text-gray-400">{formatDateIndo(b.created_at)}</span>
                      </td>

                      {/* Guest Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-800">{b.guest_name}</div>
                        <div className="text-[11px] text-gray-500">{b.guest_phone}</div>
                        <div className="text-[10px] text-gray-400">{b.number_of_guests} Tamu</div>
                      </td>

                      {/* Property */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-semibold text-gray-800 truncate" title={b.property_name}>
                          {b.property_name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">{b.property_location}</div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 text-gray-600">
                        <div className="font-medium text-gray-800">{formatDateIndo(b.check_in_date)}</div>
                        <div className="text-[11px] text-gray-400">s/d {formatDateIndo(b.check_out_date)} ({b.total_nights} mlm)</div>
                      </td>

                      {/* Grand total */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-orange-600">{formatRupiah(b.grand_total)}</div>
                        <div className="text-[10px] text-gray-400 capitalize">{b.payment_method.replace('_', ' ')}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.payment_status} />
                      </td>

                      {/* Hostex */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.hostex_sync_status} type="hostex" />
                        {b.hostex_reservation_code && (
                          <div className="font-mono text-[10px] text-gray-500 mt-0.5">{b.hostex_reservation_code}</div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Bukti Transfer Review Button */}
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setShowProofModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            title="Lihat Bukti Transfer & Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Approve (with Hostex Sync) */}
                          {b.payment_status === 'waiting_approval' && (
                            <button
                              onClick={() => handleApprove(b)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 transition-colors"
                              title="Setujui & Sync Hostex"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Quick Reject */}
                          {b.payment_status === 'waiting_approval' && (
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setShowRejectModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Tolak Booking"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {/* Hostex Re-sync button if confirmed but sync_failed */}
                          {b.payment_status === 'confirmed' && b.hostex_sync_status !== 'synced' && (
                            <button
                              onClick={() => handleHostexSync(b.id)}
                              className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-semibold flex items-center gap-1"
                              title="Coba Sinkronkan Ulang ke Hostex"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Sync Hostex</span>
                            </button>
                          )}

                          {/* Invoice Link */}
                          <Link
                            to={`/invoice/${b.invoice_number}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Cetak Invoice Resmi"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>

                          {/* Edit Booking Button */}
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                            title="Edit Data Pemesanan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Booking Button */}
                          <button
                            onClick={() => handleDeleteBooking(b)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Pemesanan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Reusable Pagination matching AGENTS.md rules */}
          {!loading && bookings.length > 0 && (
            <div className="p-4 bg-gray-50/50">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={(page) => fetchBookings(page, pagination.limit)}
                onLimitChange={(limit) => fetchBookings(1, limit)}
              />
            </div>
          )}
        </div>

        {/* MODAL: BUKTI TRANSFER & REVIEW DETAIL */}
        <Modal
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
          title={`Detail Reservasi: ${selectedBooking?.invoice_number || ''}`}
        >
          {selectedBooking && (
            <div className="space-y-6 text-xs">
              
              {/* Summary Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 block">Tamu</span>
                  <strong className="text-gray-900 text-sm">{selectedBooking.guest_name}</strong>
                  <div className="text-gray-500 mt-0.5">{selectedBooking.guest_phone}</div>
                </div>
                <div>
                  <span className="text-gray-400 block">Unit</span>
                  <strong className="text-gray-900 text-sm">{selectedBooking.property_name}</strong>
                  <div className="text-gray-500 mt-0.5">{selectedBooking.total_nights} Malam ({formatDateIndo(selectedBooking.check_in_date)} - {formatDateIndo(selectedBooking.check_out_date)})</div>
                </div>
              </div>

              {/* Tagihan */}
              <div className="flex justify-between items-center p-3 bg-orange-50/60 border border-orange-200 rounded-xl">
                <span className="font-semibold text-orange-900">Total Pembayaran Diperlukan:</span>
                <span className="text-base font-extrabold text-orange-600">{formatRupiah(selectedBooking.grand_total)}</span>
              </div>

              {/* Bukti Transfer Image */}
              <div>
                <label className="font-bold text-gray-800 block mb-2">Foto Bukti Transfer Tamu:</label>
                {selectedBooking.payment_proof_image ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-80 flex items-center justify-center p-2">
                    <div className="max-h-80 w-full overflow-hidden rounded-xl">
                      <ImageWithFallback
                        src={selectedBooking.payment_proof_image}
                        alt="Bukti Transfer"
                        className="max-h-80 object-contain w-full rounded-xl"
                        showText={true}
                        fallbackText="Bukti Transfer Tidak Dapat Dimuat"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-100 rounded-2xl text-gray-400 border border-dashed border-gray-300">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                    <span>Tamu belum mengunggah bukti transfer.</span>
                  </div>
                )}
              </div>

              {/* Hostex status info */}
              <div className="p-3.5 rounded-xl bg-gray-100 border border-gray-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-gray-600">
                  <strong className="text-gray-800 block">Integrasi Hostex Channel Manager:</strong>
                  Saat disetujui, sistem akan memanggil API Hostex untuk membuat Direct Booking dan memblokir kalender Airbnb, Booking.com, dan platform lainnya agar tidak terjadi double booking.
                </div>
              </div>

              {/* Action buttons in modal */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProofModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-semibold"
                >
                  Tutup
                </button>

                {selectedBooking.payment_status === 'waiting_approval' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProofModal(false);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold"
                    >
                      Tolak Booking
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(selectedBooking)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                    >
                      {isProcessing ? 'Memproses...' : 'Setujui & Sync Hostex'}
                    </button>
                  </>
                )}
              </div>

            </div>
          )}
        </Modal>

        {/* MODAL: TOLAK BOOKING */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Tolak Pemesanan"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Alasan Penolakan:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Bukti transfer tidak terbaca / dana belum masuk mutasi bank..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Menolak...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL: EDIT BOOKING */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit Pemesanan #${editingBooking?.invoice_number || ''}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Info Tamu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Tamu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.guest_name}
                  onChange={(e) => setEditFormData({ ...editFormData, guest_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nomor Telepon / WA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.guest_phone}
                  onChange={(e) => setEditFormData({ ...editFormData, guest_phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Tamu
                </label>
                <input
                  type="email"
                  value={editFormData.guest_email}
                  onChange={(e) => setEditFormData({ ...editFormData, guest_email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Jumlah Tamu
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editFormData.number_of_guests}
                  onChange={(e) => setEditFormData({ ...editFormData, number_of_guests: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Tanggal Reservasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-orange-50/40 rounded-xl border border-orange-100">
              <div>
                <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
                  Check-in Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editFormData.check_in_date}
                  onChange={(e) => setEditFormData({ ...editFormData, check_in_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
                  Check-out Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editFormData.check_out_date}
                  onChange={(e) => setEditFormData({ ...editFormData, check_out_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Status & Metode Pembayaran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Status Pembayaran
                </label>
                <select
                  value={editFormData.payment_status}
                  onChange={(e) => setEditFormData({ ...editFormData, payment_status: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                >
                  <option value="pending_payment">Menunggu Pembayaran</option>
                  <option value="waiting_approval">Menunggu Verifikasi (Bukti Diunggah)</option>
                  <option value="confirmed">Dikonfirmasi (Lunas)</option>
                  <option value="completed">Selesai (Checkout)</option>
                  <option value="rejected">Ditolak</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={editFormData.payment_method}
                  onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                >
                  <option value="bank_transfer">Transfer Bank Manual</option>
                  <option value="qris">QRIS Digital</option>
                  <option value="cash">Bayar di Tempat (Cash)</option>
                </select>
              </div>
            </div>

            {/* Grand Total */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Total Biaya Pemesanan (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.grand_total}
                onChange={(e) => setEditFormData({ ...editFormData, grand_total: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
              />
            </div>

            {/* Special Request & Admin Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Permintaan Khusus Tamu
              </label>
              <textarea
                rows={2}
                value={editFormData.special_requests}
                onChange={(e) => setEditFormData({ ...editFormData, special_requests: e.target.value })}
                placeholder="Contoh: Late check-in pukul 21:00..."
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Catatan Internal Admin
              </label>
              <textarea
                rows={2}
                value={editFormData.admin_notes}
                onChange={(e) => setEditFormData({ ...editFormData, admin_notes: e.target.value })}
                placeholder="Catatan admin (misal: tamu langganan, diskon khusus)..."
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </AdminLayout>
  );
}

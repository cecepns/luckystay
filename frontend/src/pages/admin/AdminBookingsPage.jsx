import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import MonthlyGanttTimeline from '../../components/MonthlyGanttTimeline';
import { TableRowSkeleton, EmptyState } from '../../components/Skeleton';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { formatRupiah, formatDateIndo, formatLocalDateString, getImageUrl } from '../../utils/formatters';
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
  Trash2,
  Plus,
  Table as TableIcon,
  Calendar,
  DollarSign,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '../../components/ImageWithFallback';
import Select from 'react-select';

export default function AdminBookingsPage() {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' (default) | 'table'
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
  const [propertiesList, setPropertiesList] = useState([]);

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
    rental_type: 'harian',
    check_in_date: '',
    check_out_date: '',
    payment_status: 'pending_payment',
    down_payment_amount: 0,
    payment_method: 'bank_transfer',
    special_requests: '',
    admin_notes: '',
    grand_total: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Create Booking Modal State ("Input Sewa Baru")
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    property_id: '',
    rental_type: 'harian',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    number_of_guests: 1,
    check_in_date: '',
    check_out_date: '',
    payment_status: 'pending_payment',
    down_payment_amount: 0,
    payment_method: 'bank_transfer',
    grand_total: 0,
    special_requests: '',
    admin_notes: ''
  });

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

  // Fetch properties for Direct Booking create form
  const fetchProperties = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.PROPERTIES.LIST, { limit: 100 });
      if (res.success && res.data) {
        setPropertiesList(res.data);
      }
    } catch (err) {
      console.error('Failed to load properties for booking form:', err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchBookings(1, pagination.limit);
  }, [debouncedSearch, statusFilter]);

  // Calculate price helper for direct admin booking
  const calculateBookingPrice = (propertyId, checkIn, checkOut, type) => {
    if (!propertyId || !checkIn || !checkOut) return 0;
    const prop = propertiesList.find(p => String(p.id) === String(propertyId));
    if (!prop) return 0;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    if (type === 'tahunan') {
      if (Number(prop.price_per_year) > 0) {
        const years = Math.max(1, nights / 365);
        return Math.round(Number(prop.price_per_year) * years);
      }
      const dailyPrice = Number(prop.final_price || prop.price_per_night || 0);
      const disc = Number(prop.yearly_discount_percent !== undefined ? prop.yearly_discount_percent : 25);
      return Math.round(dailyPrice * nights * (1 - disc / 100));
    } else if (type === 'bulanan') {
      if (Number(prop.price_per_month) > 0) {
        const months = Math.max(1, nights / 30);
        return Math.round(Number(prop.price_per_month) * months);
      }
      const dailyPrice = Number(prop.final_price || prop.price_per_night || 0);
      const disc = Number(prop.monthly_discount_percent !== undefined ? prop.monthly_discount_percent : 15);
      return Math.round(dailyPrice * nights * (1 - disc / 100));
    } else {
      const dailyPrice = Number(prop.final_price || prop.price_per_night || 0);
      return Math.round(dailyPrice * nights);
    }
  };

  // Open Create Booking Modal ("Input Sewa Baru")
  const handleOpenCreateModal = (initialData = {}) => {
    const propId = initialData.property_id || (propertiesList[0]?.id || '');
    const checkIn = initialData.check_in_date || new Date().toISOString().slice(0, 10);
    let checkOut = initialData.check_out_date;
    if (!checkOut) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + 1);
      checkOut = d.toISOString().slice(0, 10);
    }
    const rentalType = initialData.rental_type || 'harian';
    const total = calculateBookingPrice(propId, checkIn, checkOut, rentalType);

    setCreateFormData({
      property_id: propId,
      rental_type: rentalType,
      guest_name: initialData.guest_name || '',
      guest_email: initialData.guest_email || '',
      guest_phone: initialData.guest_phone || '',
      number_of_guests: 1,
      check_in_date: checkIn,
      check_out_date: checkOut,
      payment_status: initialData.payment_status || 'pending_payment',
      down_payment_amount: 0,
      payment_method: 'bank_transfer',
      grand_total: total,
      special_requests: '',
      admin_notes: ''
    });
    setShowCreateModal(true);
  };

  // Handle Create Booking Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createFormData.property_id) {
      toast.error('Pilih unit properti!');
      return;
    }
    if (!createFormData.guest_name.trim() || !createFormData.guest_phone.trim()) {
      toast.error('Nama dan nomor WhatsApp tamu wajib diisi!');
      return;
    }
    if (!createFormData.check_in_date || !createFormData.check_out_date) {
      toast.error('Tanggal check-in dan check-out wajib diisi!');
      return;
    }
    if (new Date(createFormData.check_out_date) <= new Date(createFormData.check_in_date)) {
      toast.error('Tanggal check-out harus setelah tanggal check-in!');
      return;
    }
    if (createFormData.payment_status === 'dp_paid' && (!createFormData.down_payment_amount || Number(createFormData.down_payment_amount) <= 0)) {
      toast.error('Harap masukkan nominal DP untuk status "Sudah DP"!');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const res = await request.post(API_ENDPOINTS.BOOKINGS.ADMIN_CREATE, createFormData);
      if (res.success) {
        toast.success(`Booking baru berhasil dibuat! (Invoice: ${res.data?.invoice_number || ''})`);
        setShowCreateModal(false);
        setTimelineRefreshKey(prev => prev + 1);
        fetchBookings(pagination.page, pagination.limit);
      } else {
        toast.error(res.message || 'Gagal membuat booking');
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal membuat booking');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

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
        setTimelineRefreshKey(prev => prev + 1);
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
        setTimelineRefreshKey(prev => prev + 1);
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
        setTimelineRefreshKey(prev => prev + 1);
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
      rental_type: booking.rental_type || 'harian',
      check_in_date: formatLocalDateString(booking.check_in_date),
      check_out_date: formatLocalDateString(booking.check_out_date),
      payment_status: booking.payment_status || 'pending_payment',
      down_payment_amount: booking.down_payment_amount || 0,
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
    if (editFormData.payment_status === 'dp_paid' && (!editFormData.down_payment_amount || Number(editFormData.down_payment_amount) <= 0)) {
      toast.error('Harap masukkan nominal DP untuk status "Sudah DP"!');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await request.put(API_ENDPOINTS.BOOKINGS.UPDATE(editingBooking.id), editFormData);
      if (res.success) {
        toast.success('Data pemesanan berhasil diperbarui!');
        setShowEditModal(false);
        setTimelineRefreshKey(prev => prev + 1);
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
                  setTimelineRefreshKey(prev => prev + 1);
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
              Timeline status okupansi unit, verifikasi bukti transfer, dan sinkronisasi otomatis kalender Hostex.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Timeline Bulanan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Daftar Tabel ({pagination.total})</span>
              </button>
            </div>

            {/* Input Sewa Baru Button */}
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Sewa Baru</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => {
                setTimelineRefreshKey(prev => prev + 1);
                fetchBookings(pagination.page, pagination.limit);
              }}
              className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Muat Ulang Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* View Mode: Timeline Gantt vs Table */}
        {viewMode === 'timeline' ? (
          <MonthlyGanttTimeline
            refreshKey={timelineRefreshKey}
            onOpenCreateBooking={(initialData) => handleOpenCreateModal(initialData)}
            onViewBookingDetail={(booking) => {
              setSelectedBooking(booking);
              setShowProofModal(true);
            }}
            onEditBooking={(booking) => handleOpenEditModal(booking)}
          />
        ) : (
          <>
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
                  <option value="pending_payment">Menunggu Pembayaran (Belum DP)</option>
                  <option value="dp_paid">Sudah DP (Down Payment)</option>
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
                            {b.rental_type && b.rental_type !== 'harian' && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 capitalize">
                                Sewa {b.rental_type}
                              </span>
                            )}
                          </td>

                          {/* Grand total */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-orange-600">{formatRupiah(b.grand_total)}</div>
                            {b.payment_status === 'dp_paid' && (
                              <div className="text-[10px] text-amber-700 font-semibold">
                                DP: {formatRupiah(b.down_payment_amount || 0)}
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400 capitalize">{b.payment_method?.replace('_', ' ')}</div>
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
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                                title="Lihat Bukti Transfer & Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Quick Approve (with Hostex Sync) */}
                              {b.payment_status === 'waiting_approval' && (
                                <button
                                  onClick={() => handleApprove(b)}
                                  disabled={isProcessing}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
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
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                  title="Tolak Booking"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              {/* Hostex Re-sync button if confirmed but sync_failed */}
                              {b.payment_status === 'confirmed' && b.hostex_sync_status !== 'synced' && (
                                <button
                                  onClick={() => handleHostexSync(b.id)}
                                  className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
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
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
          </>
        )}

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
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-gray-800">Foto Bukti Transfer Tamu:</label>
                  {selectedBooking.payment_proof_image && (
                    <a
                      href={getImageUrl(selectedBooking.payment_proof_image)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 font-bold text-xs flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Ukuran Penuh</span>
                    </a>
                  )}
                </div>
                {selectedBooking.payment_proof_image ? (
                  <a
                    href={getImageUrl(selectedBooking.payment_proof_image)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-80 cursor-pointer shadow-xs hover:border-orange-400 transition-all"
                    title="Klik untuk membuka bukti transfer ukuran penuh"
                  >
                    <div className="max-h-80 w-full overflow-hidden rounded-xl flex items-center justify-center p-2">
                      <ImageWithFallback
                        src={selectedBooking.payment_proof_image}
                        alt="Bukti Transfer"
                        className="max-h-80 object-contain w-full rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
                        showText={true}
                        fallbackText="Bukti Transfer Tidak Dapat Dimuat"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                      <ExternalLink className="w-4 h-4" />
                      <span>Klik untuk membuka foto asli / download</span>
                    </div>
                  </a>
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

            {/* Tipe Sewa */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Tipe Sewa Unit
              </label>
              <select
                value={editFormData.rental_type}
                onChange={(e) => setEditFormData({ ...editFormData, rental_type: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium capitalize"
              >
                <option value="harian">Sewa Harian</option>
                <option value="bulanan">Sewa Bulanan</option>
                <option value="tahunan">Sewa Tahunan</option>
              </select>
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
                  <option value="pending_payment">Belum Lunas (Menunggu Pembayaran)</option>
                  <option value="waiting_approval">Menunggu Verifikasi Admin</option>
                  <option value="confirmed">Lunas (Terkonfirmasi)</option>
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

        {/* MODAL: INPUT SEWA BARU (DIRECT BOOKING) */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Input Sewa Unit Baru (Direct Booking)"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            
            {/* Unit Selection with React Select */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Pilih Unit Properti <span className="text-red-500">*</span>
                </label>
                {createFormData.property_id && (
                  <span className="text-[10px] text-orange-600 font-semibold">
                    ID #{createFormData.property_id}
                  </span>
                )}
              </div>
              <Select
                options={propertiesList.map((p) => ({
                  value: p.id,
                  label: `${p.name} ${p.unit_number ? `(No. ${p.unit_number})` : ''} - ${p.building_name || p.city}`,
                  property: p
                }))}
                value={
                  createFormData.property_id
                    ? (() => {
                        const prop = propertiesList.find((p) => String(p.id) === String(createFormData.property_id));
                        return prop
                          ? {
                              value: prop.id,
                              label: `${prop.name} ${prop.unit_number ? `(No. ${prop.unit_number})` : ''} - ${prop.building_name || prop.city}`,
                              property: prop
                            }
                          : null;
                      })()
                    : null
                }
                onChange={(selected) => {
                  const newPropId = selected ? selected.value : '';
                  const newTotal = calculateBookingPrice(
                    newPropId,
                    createFormData.check_in_date,
                    createFormData.check_out_date,
                    createFormData.rental_type
                  );
                  setCreateFormData({
                    ...createFormData,
                    property_id: newPropId,
                    grand_total: newTotal
                  });
                }}
                placeholder="-- Ketik & Cari Unit Apartemen / Villa --"
                isSearchable
                isClearable
                noOptionsMessage={() => "Unit properti tidak ditemukan"}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: '#f9fafb',
                    borderColor: state.isFocused ? '#f97316' : '#e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '2px',
                    fontSize: '0.75rem',
                    boxShadow: state.isFocused ? '0 0 0 2px rgba(249, 115, 22, 0.2)' : 'none',
                    '&:hover': {
                      borderColor: '#f97316'
                    }
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                    zIndex: 99999
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected 
                      ? '#ea580c' 
                      : state.isFocused 
                        ? '#fff7ed' 
                        : 'white',
                    color: state.isSelected ? 'white' : '#1f2937',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '8px 12px'
                  })
                }}
                formatOptionLabel={(option) => {
                  const p = option.property;
                  if (!p) return option.label;
                  return (
                    <div className="flex items-center gap-2.5 py-0.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        <ImageWithFallback
                          src={p.images?.[0]}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          icon={Home}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate text-xs text-gray-900">
                          {p.name} {p.unit_number ? <span className="text-orange-600 font-semibold">• No. {p.unit_number}</span> : ''}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate flex items-center gap-1.5">
                          <span className="font-medium text-gray-600">{p.building_name || p.city}</span>
                          <span>•</span>
                          <span className="font-bold text-orange-600">{formatRupiah(p.final_price || p.price_per_night)}/mlm</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            {/* Skema Rental Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Skema Durasi Sewa
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'harian', label: 'Harian' },
                  { id: 'bulanan', label: 'Bulanan' },
                  { id: 'tahunan', label: 'Tahunan' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      const newTotal = calculateBookingPrice(createFormData.property_id, createFormData.check_in_date, createFormData.check_out_date, type.id);
                      setCreateFormData({
                        ...createFormData,
                        rental_type: type.id,
                        grand_total: newTotal
                      });
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      createFormData.rental_type === type.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Sewa {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamu Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Tamu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={createFormData.guest_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, guest_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp / HP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={createFormData.guest_phone}
                  onChange={(e) => setCreateFormData({ ...createFormData, guest_phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Tamu (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={createFormData.guest_email}
                  onChange={(e) => setCreateFormData({ ...createFormData, guest_email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
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
                  value={createFormData.number_of_guests}
                  onChange={(e) => setCreateFormData({ ...createFormData, number_of_guests: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Tanggal Reservasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
              <div>
                <label className="block text-xs font-bold text-orange-950 uppercase tracking-wider mb-1">
                  Tanggal Check-in <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={createFormData.check_in_date}
                  onChange={(e) => {
                    const newCheckIn = e.target.value;
                    const newTotal = calculateBookingPrice(createFormData.property_id, newCheckIn, createFormData.check_out_date, createFormData.rental_type);
                    setCreateFormData({
                      ...createFormData,
                      check_in_date: newCheckIn,
                      grand_total: newTotal
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-950 uppercase tracking-wider mb-1">
                  Tanggal Check-out <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={createFormData.check_out_date}
                  onChange={(e) => {
                    const newCheckOut = e.target.value;
                    const newTotal = calculateBookingPrice(createFormData.property_id, createFormData.check_in_date, newCheckOut, createFormData.rental_type);
                    setCreateFormData({
                      ...createFormData,
                      check_out_date: newCheckOut,
                      grand_total: newTotal
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
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
                  value={createFormData.payment_status}
                  onChange={(e) => setCreateFormData({ ...createFormData, payment_status: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                >
                  <option value="pending_payment">Belum Lunas (Menunggu Pembayaran)</option>
                  <option value="confirmed">Lunas (Terkonfirmasi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={createFormData.payment_method}
                  onChange={(e) => setCreateFormData({ ...createFormData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                >
                  <option value="bank_transfer">Transfer Bank Manual</option>
                  <option value="qris">QRIS Digital</option>
                  <option value="cash">Bayar di Tempat (Cash)</option>
                </select>
              </div>
            </div>

            {/* Total Tarif */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Total Tarif (Rp) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const recalculated = calculateBookingPrice(
                      createFormData.property_id,
                      createFormData.check_in_date,
                      createFormData.check_out_date,
                      createFormData.rental_type
                    );
                    setCreateFormData({ ...createFormData, grand_total: recalculated });
                    toast.success(`Dihitung otomatis: ${formatRupiah(recalculated)}`);
                  }}
                  className="text-[10px] text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
                >
                  Hitung Ulang
                </button>
              </div>
              <input
                type="number"
                min="0"
                required
                value={createFormData.grand_total}
                onChange={(e) => setCreateFormData({ ...createFormData, grand_total: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Catatan Internal Admin / Permintaan Khusus
              </label>
              <textarea
                rows={2}
                value={createFormData.admin_notes}
                onChange={(e) => setCreateFormData({ ...createFormData, admin_notes: e.target.value })}
                placeholder="Catatan admin (misal: reservasi via WhatsApp, sewa bulanan khusus, dll)..."
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingCreate}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingCreate ? 'Menyimpan...' : '+ Buat Booking Unit'}
              </button>
            </div>

          </form>
        </Modal>

      </div>
    </AdminLayout>
  );
}

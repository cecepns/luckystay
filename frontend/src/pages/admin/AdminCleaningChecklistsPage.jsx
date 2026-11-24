import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { TableRowSkeleton, EmptyState } from '../../components/Skeleton';
import { request } from '../../utils/request';
import { API_ENDPOINTS, getUploadUrl } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  ClipboardCheck, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  ShieldCheck, 
  Image as ImageIcon, 
  Video, 
  Filter,
  CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const CHECKLIST_SECTIONS = [
  {
    id: 'kamar_tidur',
    title: 'Kamar Tidur',
    items: [
      'Tempat tidur rapi dan bersih',
      'Sprei dan sarung bantal bersih',
      'Lantai sudah disapu dan dipel',
      'Meja dan lemari bersih',
      'AC dan remote berfungsi',
    ],
  },
  {
    id: 'kamar_mandi',
    title: 'Kamar Mandi',
    items: [
      'Closet bersih',
      'Wastafel dan cermin bersih',
      'Shower berfungsi normal',
      'Lantai dan saluran air bersih',
      'Sabun dan sampo tersedia',
      'Tidak ada kebocoran air',
    ],
  },
  {
    id: 'ruang_tamu',
    title: 'Ruang Tamu',
    items: [
      'Sofa dan meja bersih',
      'TV dan remote berfungsi',
      'Lantai sudah dipel',
      'Jendela dan kaca bersih',
      'AC dan remote berfungsi',
    ],
  },
  {
    id: 'dapur',
    title: 'Dapur',
    items: [
      'Kompor dan kitchen set bersih',
      'Piring dan peralatan makan bersih',
      'Kulkas bersih',
      'Tempat sampah kosong',
      'Tidak ada sisa makanan',
    ],
  },
  {
    id: 'inventaris_final',
    title: 'Inventaris & Final Check',
    items: [
      'Handuk tersedia dan bersih',
      'Tisu tersedia',
      'Air mineral tersedia (jika disediakan)',
      'Lampu dan stop kontak normal',
      'Pintu dan kunci berfungsi',
      'Unit wangi dan siap ditempati',
    ],
  },
];

export default function AdminCleaningChecklistsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Quick stats
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    ready: 0,
    needs_repair: 0,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Detail Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    unit_status: 'Siap Huni',
    damage_notes: '',
    additional_notes: '',
    admin_notes: '',
    verified_by: 'Admin Ops',
    is_verified: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox for photos
  const [activePhoto, setActivePhoto] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter && statusFilter !== 'all') params.unit_status = statusFilter;
      if (verifiedFilter && verifiedFilter !== 'all') params.is_verified = verifiedFilter;
      if (dateFilter) params.start_date = dateFilter;

      const res = await request.get(API_ENDPOINTS.CLEANING_CHECKLISTS.LIST, params);
      if (res?.success) {
        setReports(res.data || []);
        if (res.pagination) {
          setPagination(prev => ({
            ...prev,
            page: res.pagination.page,
            limit: res.pagination.limit,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
          }));
        }
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Fetch cleaning checklists error:', err);
      toast.error('Gagal memuat data laporan ceklis');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, verifiedFilter, dateFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Copy public form link to clipboard
  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/cleaning-checklist`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success('Link public laporan ceklis berhasil disalin!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Open Edit Modal
  const handleOpenEdit = (report) => {
    setEditForm({
      id: report.id,
      unit_status: report.unit_status || 'Siap Huni',
      damage_notes: report.damage_notes || '',
      additional_notes: report.additional_notes || '',
      admin_notes: report.admin_notes || '',
      verified_by: report.verified_by || 'Admin Ops',
      is_verified: !!report.is_verified,
    });
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;

    setIsUpdating(true);
    const toastId = toast.loading('Menyimpan perubahan laporan...');
    try {
      const res = await request.put(API_ENDPOINTS.CLEANING_CHECKLISTS.UPDATE(editForm.id), {
        unit_status: editForm.unit_status,
        damage_notes: editForm.damage_notes,
        additional_notes: editForm.additional_notes,
        admin_notes: editForm.admin_notes,
        verified_by: editForm.verified_by,
        is_verified: editForm.is_verified ? 1 : 0,
      });

      if (res?.success) {
        toast.success('Laporan ceklis berhasil diperbarui!', { id: toastId });
        setIsEditOpen(false);
        if (selectedReport?.id === editForm.id) {
          setSelectedReport(res.data);
        }
        fetchReports();
      } else {
        throw new Error(res?.message || 'Gagal memperbarui');
      }
    } catch (err) {
      console.error('Update report error:', err);
      toast.error(err.customMessage || err.message || 'Gagal menyimpan perubahan', { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const toastId = toast.loading('Menghapus laporan ceklis...');
    try {
      const res = await request.delete(API_ENDPOINTS.CLEANING_CHECKLISTS.DELETE(deleteTarget.id));
      if (res?.success) {
        toast.success('Laporan ceklis berhasil dihapus!', { id: toastId });
        setDeleteTarget(null);
        if (selectedReport?.id === deleteTarget.id) {
          setIsDetailOpen(false);
          setSelectedReport(null);
        }
        fetchReports();
      } else {
        throw new Error(res?.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.customMessage || err.message || 'Gagal menghapus laporan', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status, hasDamage) => {
    if (status === 'Siap Huni' && !hasDamage) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Siap Huni
        </span>
      );
    }
    if (status === 'Perlu Perbaikan' || hasDamage) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {status === 'Perlu Perbaikan' ? 'Perlu Perbaikan' : 'Ada Kerusakan'}
        </span>
      );
    }
    if (status === 'Menunggu Linen') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Menunggu Linen
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {status || 'Proses'}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <ClipboardCheck className="w-7 h-7 text-orange-500" />
              Laporan Ceklis Kebersihan Harian
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pantau laporan inspeksi kebersihan unit harian dari tim housekeeping
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyPublicLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 font-semibold text-xs transition-colors shadow-sm"
              title="Salin Link Form Publik untuk Housekeeping"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Publik'}</span>
            </button>

            <a
              href="/cleaning-checklist"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors shadow-md shadow-orange-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Form Publik</span>
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Total Laporan</div>
              <div className="text-xl font-bold text-gray-900">{stats.total}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Laporan Hari Ini</div>
              <div className="text-xl font-bold text-gray-900">{stats.today}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Unit Siap Huni</div>
              <div className="text-xl font-bold text-gray-900">{stats.ready}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Perlu Perbaikan</div>
              <div className="text-xl font-bold text-gray-900">{stats.needs_repair}</div>
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari petugas, apartemen, kode, unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              >
                <option value="all">Semua Status Unit</option>
                <option value="Siap Huni">Siap Huni</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Menunggu Linen">Menunggu Linen</option>
                <option value="Dalam Pembersihan">Dalam Pembersihan</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div>
              <select
                value={verifiedFilter}
                onChange={(e) => {
                  setVerifiedFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              >
                <option value="all">Semua Verifikasi</option>
                <option value="1">Sudah Diverifikasi</option>
                <option value="0">Belum Diverifikasi</option>
              </select>
            </div>

            {/* Date Filter & Refresh */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={fetchReports}
                className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
              </button>
            </div>

          </div>
        </div>

        {/* Table & Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <TableRowSkeleton rows={5} />
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={ClipboardCheck}
                title="Belum Ada Laporan Ceklis"
                description={
                  searchTerm || statusFilter !== 'all' || dateFilter
                    ? 'Tidak ada laporan yang sesuai dengan filter pencarian.'
                    : 'Belum ada tim housekeeping yang mengirim laporan kebersihan. Bagikan link publik ke tim Anda.'
                }
                actionLabel={searchTerm || statusFilter !== 'all' ? 'Reset Filter' : 'Buka Form Publik'}
                onAction={
                  searchTerm || statusFilter !== 'all'
                    ? () => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setVerifiedFilter('all');
                        setDateFilter('');
                      }
                    : () => window.open('/cleaning-checklist', '_blank')
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Laporan & Tanggal</th>
                      <th className="py-3 px-4">Unit Apartemen</th>
                      <th className="py-3 px-4">Petugas & Waktu</th>
                      <th className="py-3 px-4">Progress Ceklis</th>
                      <th className="py-3 px-4">Status & Kondisi</th>
                      <th className="py-3 px-4">Verifikasi</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {reports.map((report) => {
                      const hasDamage = !!report.damage_notes;
                      return (
                        <tr key={report.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Laporan & Tanggal */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-orange-600 block">
                              {report.report_code}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {report.cleaning_date}
                            </span>
                          </td>

                          {/* Unit Apartemen */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900 truncate max-w-[200px]">
                              {report.property_name}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">
                              {report.unit_number}
                            </div>
                          </td>

                          {/* Petugas & Waktu */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-gray-800 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span>{report.cleaner_name}</span>
                            </div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>
                                {report.start_time || '-'} s/d {report.end_time || '-'}
                              </span>
                            </div>
                          </td>

                          {/* Progress Ceklis */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${report.completion_percent || 0}%` }}
                                />
                              </div>
                              <span className="font-bold text-gray-800 text-[11px]">
                                {report.completion_percent}%
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {report.completed_items || 0} dari {report.total_items || 27} item
                            </div>
                          </td>

                          {/* Status & Kondisi */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div>{getStatusBadge(report.unit_status, hasDamage)}</div>
                              {hasDamage && (
                                <div className="text-[10px] text-rose-600 font-medium truncate max-w-[150px] flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{report.damage_notes}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Verifikasi */}
                          <td className="py-3.5 px-4">
                            {report.is_verified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                Diverifikasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
                                <Circle className="w-3 h-3 text-gray-300" />
                                Menunggu
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setIsDetailOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Lihat Detail & Foto"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(report)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                title="Edit Status / Verifikasi"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(report)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus Laporan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  limit={pagination.limit}
                  onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                  onLimitChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))}
                />
              </div>
            </>
          )}
        </div>

      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedReport ? `Detail Laporan - ${selectedReport.report_code}` : 'Detail Laporan'}
        maxWidth="max-w-4xl"
      >
        {selectedReport && (
          <div className="space-y-6">
            
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Unit Apartemen:</span>
                <span className="font-bold text-gray-900 text-sm">{selectedReport.property_name}</span>
                <span className="text-gray-500 block">{selectedReport.unit_number}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Petugas & Tanggal:</span>
                <span className="font-bold text-gray-800">{selectedReport.cleaner_name}</span>
                <span className="text-gray-500 block">
                  {selectedReport.cleaning_date} ({selectedReport.start_time || '-'} s/d {selectedReport.end_time || '-'})
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Status Unit:</span>
                <div className="mt-1">{getStatusBadge(selectedReport.unit_status, !!selectedReport.damage_notes)}</div>
              </div>
            </div>

            {/* Checklist Progress Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Hasil Pengecekan Checklist ({selectedReport.completion_percent}% Selesai)
                </h4>
                <span className="text-xs text-gray-500 font-medium">
                  {selectedReport.completed_items || 0} / {selectedReport.total_items || 27} Selesai
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CHECKLIST_SECTIONS.map((section) => {
                  const sectionData = selectedReport.checklist_items?.[section.id] || {};
                  const customKeys = Object.keys(sectionData).filter((k) => !section.items.includes(k));
                  const totalCount = section.items.length + customKeys.length;
                  const doneCount = Object.values(sectionData).filter(Boolean).length;

                  return (
                    <div key={section.id} className="p-3.5 rounded-xl border border-gray-100 bg-white">
                      <div className="font-bold text-xs text-gray-900 mb-2 pb-1.5 border-b border-gray-100 flex items-center justify-between">
                        <span>{section.title}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {doneCount}/{totalCount}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {/* Standard items */}
                        {section.items.map((item) => {
                          const isDone = !!sectionData[item];
                          return (
                            <div key={item} className="flex items-center gap-2">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                              )}
                              <span className={isDone ? 'text-gray-700' : 'text-gray-400'}>
                                {item}
                              </span>
                            </div>
                          );
                        })}

                        {/* Custom Manual items */}
                        {customKeys.map((customKey) => {
                          const isDone = !!sectionData[customKey];
                          return (
                            <div key={customKey} className="flex items-center gap-2 pt-1 border-t border-dashed border-gray-100">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                              )}
                              <span className={isDone ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                                {customKey}{' '}
                                <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200/60 px-1.5 py-0.5 rounded-full font-semibold">
                                  Manual
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Damage Notes Banner if present */}
            {selectedReport.damage_notes && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                <div className="flex items-center gap-2 text-rose-800 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>KONDISI KHUSUS / KERUSAKAN TERDETEKSI:</span>
                </div>
                <p className="text-rose-900 leading-relaxed font-medium">
                  {selectedReport.damage_notes}
                </p>
              </div>
            )}

            {/* Additional Notes if present */}
            {selectedReport.additional_notes && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
                <span className="text-blue-800 font-bold block mb-1">Catatan Tambahan Petugas:</span>
                <p className="text-blue-900 leading-relaxed">
                  {selectedReport.additional_notes}
                </p>
              </div>
            )}

            {/* Photos & Video Documentation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                <span>Foto & Video Dokumentasi</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Kamar Tidur', url: selectedReport.photo_bedroom },
                  { label: 'Kamar Mandi', url: selectedReport.photo_bathroom },
                  { label: 'Ruang Tamu', url: selectedReport.photo_living_room },
                  { label: 'Dapur', url: selectedReport.photo_kitchen },
                  { label: 'Keseluruhan Unit', url: selectedReport.photo_overview },
                ].map((photo, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex flex-col">
                    <div className="text-[10px] font-bold text-gray-600 p-2 bg-gray-100/60 border-b border-gray-100">
                      {photo.label}
                    </div>
                    {photo.url ? (
                      <div
                        onClick={() => setActivePhoto(getUploadUrl(photo.url))}
                        className="aspect-video relative group cursor-pointer overflow-hidden bg-black/5"
                      >
                        <img
                          src={getUploadUrl(photo.url)}
                          alt={photo.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                          <Eye className="w-5 h-5 mr-1" /> Perbesar
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center text-[10px] text-gray-400">
                        Tidak ada foto
                      </div>
                    )}
                  </div>
                ))}

                {/* Video */}
                <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex flex-col">
                  <div className="text-[10px] font-bold text-gray-600 p-2 bg-gray-100/60 border-b border-gray-100 flex items-center justify-between">
                    <span>Video Kondisi Akhir</span>
                    <Video className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  {selectedReport.video_url ? (
                    <div className="aspect-video bg-black flex items-center justify-center p-2">
                      {selectedReport.video_url.endsWith('.mp4') || selectedReport.video_url.endsWith('.mov') || selectedReport.video_url.endsWith('.webm') ? (
                        <video src={getUploadUrl(selectedReport.video_url)} controls className="w-full h-full object-contain" />
                      ) : (
                        <a
                          href={selectedReport.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink className="w-4 h-4" /> Buka Link Video
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center text-[10px] text-gray-400">
                      Tidak ada video
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Verification Section */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-gray-800 block">Status Verifikasi Admin:</span>
                <span className="text-gray-500">
                  {selectedReport.is_verified
                    ? `Sudah diverifikasi oleh ${selectedReport.verified_by || 'Admin Ops'}`
                    : 'Belum diverifikasi oleh tim operasional'}
                </span>
                {selectedReport.admin_notes && (
                  <p className="text-gray-700 mt-1 italic">"{selectedReport.admin_notes}"</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenEdit(selectedReport);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  Edit / Verifikasi Laporan
                </button>
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Edit / Update Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit & Verifikasi Laporan Ceklis"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status Unit</label>
            <select
              value={editForm.unit_status}
              onChange={(e) => setEditForm({ ...editForm, unit_status: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
            >
              <option value="Siap Huni">✅ Siap Huni (Clean & Ready to Check-In)</option>
              <option value="Perlu Perbaikan">⚠️ Perlu Perbaikan (Ada Kerusakan)</option>
              <option value="Menunggu Linen">🧺 Menunggu Linen</option>
              <option value="Dalam Pembersihan">🧹 Dalam Pembersihan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Kerusakan / Khusus</label>
            <textarea
              rows={2}
              value={editForm.damage_notes}
              onChange={(e) => setEditForm({ ...editForm, damage_notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              placeholder="Catatan barang rusak, hilang, dsb..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Admin Review</label>
            <textarea
              rows={2}
              value={editForm.admin_notes}
              onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              placeholder="Catatan dari tim operasional..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Verifikator</label>
            <input
              type="text"
              value={editForm.verified_by}
              onChange={(e) => setEditForm({ ...editForm, verified_by: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.is_verified}
              onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
            />
            <span className="text-xs font-semibold text-gray-800">
              Tandai Telah Diverifikasi oleh Admin
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Laporan"
        maxWidth="max-w-sm"
      >
        <div className="text-xs text-gray-600 space-y-3">
          <p>
            Apakah Anda yakin ingin menghapus laporan ceklis{' '}
            <strong className="text-gray-900">{deleteTarget?.report_code}</strong> untuk unit{' '}
            <strong className="text-gray-900">{deleteTarget?.property_name} ({deleteTarget?.unit_number})</strong>?
          </p>
          <p className="text-rose-600 font-medium">
            Tindakan ini tidak dapat dibatalkan dan seluruh file foto dokumentasi akan ikut dihapus.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Photo Lightbox Preview */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 p-2">
            <img src={activePhoto} alt="Preview Foto Dokumentasi" className="max-h-[85vh] w-auto object-contain mx-auto rounded-xl" />
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

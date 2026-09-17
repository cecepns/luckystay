import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { TableRowSkeleton, EmptyState } from '../../components/Skeleton';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Star, 
  MessageSquareQuote, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'approved', 'pending'
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    user_name: '',
    user_role_label: '',
    rating: 5,
    comment: '',
    is_approved: 1
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      const res = await request.get(API_ENDPOINTS.REVIEWS.ADMIN_LIST, { params });
      if (res.success) {
        setReviews(res.data || []);
        if (res.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages
          }));
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal memuat ulasan pelanggan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditMode(true);
    setEditingId(item.id);
    setFormData({
      user_name: item.user_name || '',
      user_role_label: item.user_role_label || '',
      rating: item.rating || 5,
      comment: item.comment || '',
      is_approved: item.is_approved ? 1 : 0
    });
    setIsModalOpen(true);
  };

  const handleToggleApproval = async (item) => {
    const nextStatus = item.is_approved ? 0 : 1;
    try {
      const res = await request.put(API_ENDPOINTS.REVIEWS.UPDATE(item.id), {
        is_approved: nextStatus
      });
      if (res.success) {
        toast.success(nextStatus ? 'Ulasan disetujui & tampil di website!' : 'Ulasan disembunyikan!');
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal mengubah status ulasan');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_name.trim() || !formData.comment.trim()) {
      toast.error('Nama tamu dan isi ulasan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const res = await request.put(API_ENDPOINTS.REVIEWS.UPDATE(editingId), formData);
        if (res.success) {
          toast.success('Ulasan berhasil diperbarui!');
          setIsModalOpen(false);
          fetchReviews();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.REVIEWS.ADMIN_CREATE, formData);
        if (res.success) {
          toast.success('Ulasan baru berhasil ditambahkan!');
          setIsModalOpen(false);
          fetchReviews();
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal menyimpan ulasan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Hapus Ulasan dari "{item.user_name}"?
        </div>
        <p className="text-xs text-gray-500">
          Ulasan ini akan dihapus secara permanen dari sistem dan slider beranda.
        </p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.REVIEWS.DELETE(item.id));
                if (res.success) {
                  toast.success('Ulasan berhasil dihapus!');
                  fetchReviews();
                }
              } catch (err) {
                toast.error(err.customMessage || 'Gagal menghapus ulasan');
              }
            }}
            className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
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
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <MessageSquareQuote className="w-7 h-7 text-orange-500" />
              Kelola Ulasan Pelanggan
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Moderasi ulasan tamu dan tambahkan testimoni pelanggan untuk ditampilkan pada slider beranda.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Ulasan Manual</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama tamu, kata kunci ulasan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => { setStatusFilter('all'); setPagination(p => ({ ...p, page: 1 })); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Semua
              </button>
              <button
                onClick={() => { setStatusFilter('approved'); setPagination(p => ({ ...p, page: 1 })); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'approved' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Disetujui
              </button>
              <button
                onClick={() => { setStatusFilter('pending'); setPagination(p => ({ ...p, page: 1 })); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Pending
              </button>
            </div>

            <button
              onClick={fetchReviews}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tamu & Label</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Isi Ulasan</th>
                  <th className="py-3.5 px-4 text-center">Status Tayang</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={5} />
                  ))
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12">
                      <EmptyState
                        icon={MessageSquareQuote}
                        title="Belum ada ulasan ditemukan"
                        description={searchTerm ? 'Tidak ada hasil untuk pencarian ini' : 'Tambahkan ulasan atau tunggu tamu mengirim review.'}
                      />
                    </td>
                  </tr>
                ) : (
                  reviews.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.user_name}</div>
                        <div className="text-xs text-orange-600 font-medium">
                          {item.user_role_label || 'Tamu Terverifikasi'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${
                                idx < item.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {item.rating}.0
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 max-w-md">
                        <p className="line-clamp-2 text-xs leading-relaxed">
                          "{item.comment}"
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleApproval(item)}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                            item.is_approved
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Klik untuk ubah status tayang"
                        >
                          {item.is_approved ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Disetujui</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Ulasan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Ulasan"
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

          {/* Pagination */}
          {!loading && reviews.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
              onLimitChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))}
            />
          )}
        </div>

        {/* Modal Create / Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? 'Edit Ulasan Pelanggan' : 'Tambah Ulasan Baru'}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Nama Tamu / Pelanggan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                placeholder="Contoh: Aditya Rahardian"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Keterangan / Label Properti
              </label>
              <input
                type="text"
                value={formData.user_role_label}
                onChange={(e) => setFormData({ ...formData, user_role_label: e.target.value })}
                placeholder="Contoh: Tamu Bisnis • Casa Grande Jakarta"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Rating Bintang
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= formData.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200 hover:text-amber-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-bold text-gray-800 ml-2">
                  {formData.rating} dari 5 Bintang
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Isi Ulasan Tamu <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Tulis ulasan pengalaman menginap..."
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.is_approved === 1}
                  onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked ? 1 : 0 })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Setujui Ulasan (Langsung tampil di slider beranda)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 mt-5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Ulasan')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

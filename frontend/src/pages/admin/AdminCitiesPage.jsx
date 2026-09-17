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
  MapPin, 
  Sparkles, 
  RefreshCw, 
  Check, 
  X,
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCitiesPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    name: '',
    province: '',
    is_popular: 1,
    is_active: 1
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      };
      const res = await request.get(API_ENDPOINTS.CITIES.LIST, { params });
      if (res.success) {
        setCities(res.data || []);
        if (res.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages
          }));
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal memuat data kota');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (city) => {
    setIsEditMode(true);
    setEditingId(city.id);
    setFormData({
      name: city.name,
      province: city.province || '',
      is_popular: city.is_popular ? 1 : 0,
      is_active: city.is_active ? 1 : 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama kota wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const res = await request.put(API_ENDPOINTS.CITIES.UPDATE(editingId), formData);
        if (res.success) {
          toast.success('Kota berhasil diperbarui!');
          setIsModalOpen(false);
          fetchCities();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.CITIES.CREATE, formData);
        if (res.success) {
          toast.success('Kota berhasil ditambahkan!');
          setIsModalOpen(false);
          fetchCities();
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal menyimpan data kota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (city) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Hapus Kota "{city.name}"?
        </div>
        <p className="text-xs text-gray-500">
          Tindakan ini permanen. Pastikan tidak ada properti aktif di kota ini.
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
                const res = await request.delete(API_ENDPOINTS.CITIES.DELETE(city.id));
                if (res.success) {
                  toast.success('Kota berhasil dihapus!');
                  fetchCities();
                }
              } catch (err) {
                toast.error(err.customMessage || 'Gagal menghapus kota');
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
              <MapPin className="w-7 h-7 text-orange-500" />
              Kelola Kota & Destinasi
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Atur daftar kota tujuan untuk pencarian tamu dan pilihan lokasi properti baru.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kota</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama kota atau provinsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchCities}
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
                  <th className="py-3.5 px-4">Nama Kota</th>
                  <th className="py-3.5 px-4">Provinsi</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4 text-center">Destinasi Populer</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))
                ) : cities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState
                        icon={MapPin}
                        title="Tidak ada kota ditemukan"
                        description={searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan kota baru.'}
                      />
                    </td>
                  </tr>
                ) : (
                  cities.map((city) => (
                    <tr key={city.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {city.name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {city.province || 'Indonesia'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-400">
                        {city.slug}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {city.is_popular ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <Sparkles className="w-3 h-3" />
                            Populer
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-medium">Biasa</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {city.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            <X className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(city)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Kota"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(city)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Kota"
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
          {!loading && cities.length > 0 && (
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
          title={isEditMode ? 'Edit Kota / Destinasi' : 'Tambah Kota Baru'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Nama Kota <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Jakarta Selatan, Bandung, Bali..."
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Provinsi / Wilayah
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Contoh: DKI Jakarta, Jawa Barat..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.is_popular === 1}
                  onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked ? 1 : 0 })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Tampilkan Populer</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Status Aktif</span>
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
                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Kota')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

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
  Layers, 
  RefreshCw, 
  Check, 
  X,
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPropertyTypesPage() {
  const [types, setTypes] = useState([]);
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
    description: '',
    is_active: 1
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      };
      const res = await request.get(API_ENDPOINTS.PROPERTY_TYPES.LIST, { params });
      if (res.success) {
        setTypes(res.data || []);
        if (res.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages
          }));
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal memuat tipe unit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [pagination.page, pagination.limit, debouncedSearch]);

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
      name: item.name,
      description: item.description || '',
      is_active: item.is_active ? 1 : 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama tipe unit wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const res = await request.put(API_ENDPOINTS.PROPERTY_TYPES.UPDATE(editingId), formData);
        if (res.success) {
          toast.success('Tipe unit berhasil diperbarui!');
          setIsModalOpen(false);
          fetchTypes();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.PROPERTY_TYPES.CREATE, formData);
        if (res.success) {
          toast.success('Tipe unit berhasil ditambahkan!');
          setIsModalOpen(false);
          fetchTypes();
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal menyimpan tipe unit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Hapus Tipe "{item.name}"?
        </div>
        <p className="text-xs text-gray-500">
          Tindakan ini permanen. Pastikan tidak ada properti yang masih menggunakan tipe ini.
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
                const res = await request.delete(API_ENDPOINTS.PROPERTY_TYPES.DELETE(item.id));
                if (res.success) {
                  toast.success('Tipe unit berhasil dihapus!');
                  fetchTypes();
                }
              } catch (err) {
                toast.error(err.customMessage || 'Gagal menghapus tipe unit');
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
              <Layers className="w-7 h-7 text-orange-500" />
              Kelola Tipe Unit
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Atur tipe unit kamar/properti seperti Studio, 1BR, 2BR, Penthouse, atau Villa.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tipe Unit</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tipe unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchTypes}
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
                  <th className="py-3.5 px-4">Nama Tipe</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={4} />
                  ))
                ) : types.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12">
                      <EmptyState
                        icon={Layers}
                        title="Tidak ada tipe unit ditemukan"
                        description={searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan tipe unit baru.'}
                      />
                    </td>
                  </tr>
                ) : (
                  types.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <div className="inline-flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-orange-100/80 text-orange-800 rounded-lg text-xs font-bold">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {item.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.is_active ? (
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
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Tipe Unit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Tipe Unit"
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
          {!loading && types.length > 0 && (
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
          title={isEditMode ? 'Edit Tipe Unit' : 'Tambah Tipe Unit Baru'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Nama Tipe Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Studio, 1BR, 2BR, Penthouse, Villa..."
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Keterangan / Deskripsi Singkat
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Contoh: 2 Kamar Tidur dengan balkon dan dapur..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Status Aktif (Ditampilkan pada formulir)</span>
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
                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Tipe Unit')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

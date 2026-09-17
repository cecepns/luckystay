import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { TableRowSkeleton, EmptyState } from '../../components/Skeleton';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import ImageWithFallback from '../../components/ImageWithFallback';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Upload, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPaymentMethodsPage() {
  const [accounts, setAccounts] = useState([]);
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

  // QR Image Preview Modal
  const [previewQrUrl, setPreviewQrUrl] = useState(null);

  // Form State
  const initialForm = {
    bank_name: '',
    account_number: '',
    account_holder: '',
    instructions: '',
    is_qris: false,
    is_active: 1
  };
  const [formData, setFormData] = useState(initialForm);
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);
  const [existingQrisImage, setExistingQrisImage] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = {
        admin: 'true',
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      };
      const res = await request.get(API_ENDPOINTS.PAYMENTS.BANK_ACCOUNTS, { params });
      if (res.success) {
        setAccounts(res.data || []);
        if (res.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages
          }));
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal memuat rekening bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(initialForm);
    setQrisFile(null);
    setQrisPreview(null);
    setExistingQrisImage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditMode(true);
    setEditingId(item.id);
    const isQris = Boolean(item.qris_image || item.bank_name?.toLowerCase().includes('qris'));
    setFormData({
      bank_name: item.bank_name || '',
      account_number: item.account_number || '',
      account_holder: item.account_holder || '',
      instructions: item.instructions || '',
      is_qris: isQris,
      is_active: item.is_active ? 1 : 0
    });
    setQrisFile(null);
    setQrisPreview(null);
    setExistingQrisImage(item.qris_image || null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrisFile(file);
      setQrisPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bank_name.trim() || !formData.account_number.trim() || !formData.account_holder.trim()) {
      toast.error('Nama Bank, Nomor Rekening, dan Pemilik Rekening wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('bank_name', formData.bank_name);
      data.append('account_number', formData.account_number);
      data.append('account_holder', formData.account_holder);
      data.append('instructions', formData.instructions || '');
      data.append('is_active', formData.is_active);
      data.append('is_qris', formData.is_qris ? '1' : '0');

      if (qrisFile) {
        data.append('qris_image', qrisFile);
      }

      if (isEditMode) {
        const res = await request.put(API_ENDPOINTS.PAYMENTS.UPDATE(editingId), data);
        if (res.success) {
          toast.success('Metode pembayaran berhasil diperbarui!');
          setIsModalOpen(false);
          fetchAccounts();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.PAYMENTS.CREATE, data);
        if (res.success) {
          toast.success('Metode pembayaran berhasil ditambahkan!');
          setIsModalOpen(false);
          fetchAccounts();
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal menyimpan data pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Hapus "{item.bank_name}"?
        </div>
        <p className="text-xs text-gray-500">
          Tindakan ini permanen dan metode pembayaran ini tidak akan lagi muncul untuk tamu.
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
                const res = await request.delete(API_ENDPOINTS.PAYMENTS.DELETE(item.id));
                if (res.success) {
                  toast.success('Metode pembayaran berhasil dihapus!');
                  fetchAccounts();
                }
              } catch (err) {
                toast.error(err.customMessage || 'Gagal menghapus');
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
              <CreditCard className="w-7 h-7 text-orange-500" />
              Kelola Rekening Bank & QRIS
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Atur daftar nomor rekening bank dan gambar QRIS yang ditampilkan kepada tamu saat checkout dan cek invoice.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rekening / QRIS</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari bank, nomor rekening, atas nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchAccounts}
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
                  <th className="py-3.5 px-4">Nama Bank / Metode</th>
                  <th className="py-3.5 px-4">Nomor Rekening / NMID</th>
                  <th className="py-3.5 px-4">Atas Nama</th>
                  <th className="py-3.5 px-4 text-center">Gambar QRIS</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState
                        icon={CreditCard}
                        title="Belum ada rekening pembayaran"
                        description={searchTerm ? 'Tidak ada hasil untuk pencarian ini' : 'Tambahkan rekening atau QRIS sekarang.'}
                      />
                    </td>
                  </tr>
                ) : (
                  accounts.map((item) => {
                    const hasQris = Boolean(item.qris_image);
                    return (
                      <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            {hasQris ? (
                              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                                <QrCode className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                                <CreditCard className="w-4 h-4" />
                              </span>
                            )}
                            <div>
                              <div>{item.bank_name}</div>
                              {item.instructions && (
                                <div className="text-[11px] text-gray-400 font-normal line-clamp-1 max-w-xs">
                                  {item.instructions}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-gray-800">
                          {item.account_number}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 font-medium">
                          {item.account_holder}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.qris_image ? (
                            <button
                              type="button"
                              onClick={() => setPreviewQrUrl(item.qris_image)}
                              className="inline-flex items-center gap-1.5 text-xs text-purple-700 font-semibold px-2.5 py-1 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat QR</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
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
                              title="Edit Rekening"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Rekening"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && accounts.length > 0 && (
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
          title={isEditMode ? 'Edit Metode Pembayaran' : 'Tambah Rekening / QRIS Baru'}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Nama Bank / Layanan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Contoh: BCA, Bank Mandiri, QRIS Lucky Stay..."
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nomor Rekening / NMID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="Contoh: 8720198822"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Atas Nama Pemilik <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account_holder}
                  onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  placeholder="PT LUCKY STAY INDONESIA"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* QRIS Toggle & Upload */}
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_qris}
                  onChange={(e) => setFormData({ ...formData, is_qris: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-purple-600" />
                  Ini adalah Pembayaran QRIS (Unggah Barcode/QR)
                </span>
              </label>

              {formData.is_qris && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-medium text-purple-800">
                    Pilih File Gambar QRIS (PNG/JPG)
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-100/50 shadow-xs transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{qrisFile ? 'Ganti File Gambar' : 'Pilih Gambar QRIS'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {(qrisPreview || existingQrisImage) && (
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-purple-200 bg-white">
                          <ImageWithFallback
                            src={qrisPreview || existingQrisImage}
                            alt="QR Preview"
                            className="w-full h-full object-contain p-0.5"
                          />
                        </div>
                        <span className="text-[11px] text-gray-500">Preview QR Aktif</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Petunjuk Pembayaran (Opsional)
              </label>
              <textarea
                rows={2}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Contoh: Cantumkan kode invoice pada berita transfer, simpan struk transfer..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Status Aktif (Ditampilkan pada formulir checkout)</span>
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
                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Rekening')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal QR Code Preview */}
        <Modal
          isOpen={Boolean(previewQrUrl)}
          onClose={() => setPreviewQrUrl(null)}
          title="Preview Barcode QRIS"
          maxWidth="max-w-sm"
        >
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="w-64 h-64 bg-white p-2 rounded-2xl border border-gray-200 shadow-md mb-4 flex items-center justify-center">
              <ImageWithFallback
                src={previewQrUrl}
                alt="QRIS Lucky Stay"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs text-gray-500">
              Gambar barcode QRIS ini akan dipindai oleh tamu saat melakukan pembayaran digital.
            </p>
            <button
              onClick={() => setPreviewQrUrl(null)}
              className="mt-5 px-5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Tutup Preview
            </button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

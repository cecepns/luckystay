import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { TableRowSkeleton, EmptyState } from '../../components/Skeleton';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { formatRupiah } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Building2, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  Check, 
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
  Tag,
  Percent
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import ImageWithFallback from '../../components/ImageWithFallback';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
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

  // Multi-Image Upload states
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Dynamic Options for City & Unit Types
  const [availableCities, setAvailableCities] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [hostexProperties, setHostexProperties] = useState([]);

  // Form State
  const initialForm = {
    name: '',
    building_name: '',
    unit_number: '',
    location: '',
    city: 'Jakarta Selatan',
    address: '',
    type: 'Studio',
    price_per_night: '',
    original_price: '',
    discount_percent: 0,
    cleaning_fee: '50000',
    security_deposit: '200000',
    max_guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    size_sqm: 35,
    description: '',
    house_rules: 'Dilarang merokok. Jam hening pukul 22:00 - 07:00.',
    amenities: 'High Speed WiFi, Air Conditioner, Smart TV, Kolam Renang, Kitchen Set, Water Heater',
    hostex_property_id: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchProperties = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch
      };
      const res = await request.get(API_ENDPOINTS.PROPERTIES.LIST, params);
      if (res.success) {
        setProperties(res.data);
        setPagination(res.pagination || { page, limit, total: res.data.length, totalPages: 1 });
      }
    } catch (err) {
      toast.error('Gagal mengambil daftar properti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(1, pagination.limit);
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [citiesRes, typesRes] = await Promise.all([
          request.get(API_ENDPOINTS.CITIES.ALL),
          request.get(API_ENDPOINTS.PROPERTY_TYPES.ALL)
        ]);
        if (citiesRes.success && citiesRes.data) {
          setAvailableCities(citiesRes.data);
        }
        if (typesRes.success && typesRes.data) {
          setAvailableTypes(typesRes.data);
        }
      } catch (err) {
        console.error('Error fetching cities/types for dropdown:', err);
      }

      try {
        const hostexRes = await request.get(API_ENDPOINTS.HOSTEX.STATUS);
        if (hostexRes.success && Array.isArray(hostexRes.data?.hostex_properties)) {
          setHostexProperties(hostexRes.data.hostex_properties);
        }
      } catch (hErr) {
        // Non-blocking if Hostex API is unreachable
      }
    };
    fetchOptions();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(initialForm);
    setExistingImages([]);
    setNewImageFiles([]);
    setPreviewUrls([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prop) => {
    setIsEditMode(true);
    setEditingId(prop.id);
    setFormData({
      name: prop.name || '',
      building_name: prop.building_name || '',
      unit_number: prop.unit_number || '',
      location: prop.location || '',
      city: prop.city || 'Jakarta Selatan',
      address: prop.address || '',
      type: prop.type || 'Studio',
      price_per_night: prop.price_per_night || '',
      original_price: prop.original_price || '',
      discount_percent: prop.discount_percent || 0,
      cleaning_fee: prop.cleaning_fee || '50000',
      security_deposit: prop.security_deposit || '200000',
      max_guests: prop.max_guests || 2,
      bedrooms: prop.bedrooms ? prop.bedrooms : ((prop.type?.toLowerCase().includes('2') || prop.type?.toLowerCase().includes('two')) ? 2 : 1),
      beds: prop.beds ? prop.beds : ((prop.type?.toLowerCase().includes('2') || prop.type?.toLowerCase().includes('two')) ? 2 : 1),
      bathrooms: prop.bathrooms || 1,
      size_sqm: prop.size_sqm || 35,
      description: prop.description || '',
      house_rules: prop.house_rules || '',
      amenities: Array.isArray(prop.amenities) ? prop.amenities.join(', ') : (prop.amenities || ''),
      hostex_property_id: prop.hostex_property_id || ''
    });
    setExistingImages(Array.isArray(prop.images) ? prop.images : []);
    setNewImageFiles([]);
    setPreviewUrls([]);
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType) => {
    let updatedBedrooms = formData.bedrooms;
    let updatedBeds = formData.beds;
    const lower = (newType || '').toLowerCase();

    if (lower.includes('2') || lower.includes('two')) {
      updatedBedrooms = 2;
      if (Number(formData.beds) <= 1) updatedBeds = 2;
    } else if (lower.includes('3') || lower.includes('three')) {
      updatedBedrooms = 3;
      if (Number(formData.beds) <= 1) updatedBeds = 3;
    } else if (lower.includes('4') || lower.includes('four')) {
      updatedBedrooms = 4;
      if (Number(formData.beds) <= 1) updatedBeds = 4;
    } else if (lower.includes('studio') || lower.includes('1') || lower.includes('one')) {
      updatedBedrooms = 1;
      if (Number(formData.beds) <= 1) updatedBeds = 1;
    }

    setFormData(prev => ({
      ...prev,
      type: newType,
      bedrooms: updatedBedrooms,
      beds: updatedBeds
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const totalCount = existingImages.length + newImageFiles.length + files.length;
    if (totalCount > 20) {
      toast.error('Maksimal 20 foto per unit apartemen');
      return;
    }
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setNewImageFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    if (previewUrls[index]) URL.revokeObjectURL(previewUrls[index]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.price_per_night) {
      toast.error('Nama unit, lokasi, dan tarif sewa per malam wajib diisi!');
      return;
    }

    if (existingImages.length === 0 && newImageFiles.length === 0) {
      toast.error('Wajib mengunggah minimal 1 foto untuk unit apartemen!');
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('building_name', formData.building_name || '');
      fd.append('unit_number', formData.unit_number || '');
      fd.append('location', formData.location);
      fd.append('city', formData.city);
      fd.append('address', formData.address || `${formData.location}, ${formData.city}`);
      fd.append('type', formData.type);
      fd.append('price_per_night', Number(formData.price_per_night));
      fd.append('original_price', formData.original_price ? Number(formData.original_price) : '');
      fd.append('discount_percent', Number(formData.discount_percent) || 0);
      fd.append('cleaning_fee', Number(formData.cleaning_fee) || 0);
      fd.append('security_deposit', Number(formData.security_deposit) || 0);
      fd.append('max_guests', Number(formData.max_guests) || 2);
      fd.append('bedrooms', Number(formData.bedrooms) || 1);
      fd.append('beds', Number(formData.beds) || 1);
      fd.append('bathrooms', Number(formData.bathrooms) || 1);
      fd.append('size_sqm', Number(formData.size_sqm) || 35);
      fd.append('description', formData.description || '');
      fd.append('house_rules', formData.house_rules || '');
      fd.append('hostex_property_id', formData.hostex_property_id || '');

      const amenitiesArray = formData.amenities.split(',').map(s => s.trim()).filter(Boolean);
      fd.append('amenities', JSON.stringify(amenitiesArray));
      fd.append('existing_images', JSON.stringify(existingImages));

      newImageFiles.forEach((file) => {
        fd.append('images', file);
      });

      let res;
      if (isEditMode) {
        res = await request.uploadPut(API_ENDPOINTS.PROPERTIES.UPDATE(editingId), fd);
      } else {
        res = await request.upload(API_ENDPOINTS.PROPERTIES.CREATE, fd);
      }

      if (res.success) {
        toast.success(isEditMode ? 'Properti berhasil diperbarui!' : 'Properti baru berhasil ditambahkan!');
        setIsModalOpen(false);
        fetchProperties(pagination.page, pagination.limit);
      } else {
        toast.error(res.message || 'Gagal menyimpan properti');
      }
    } catch (err) {
      toast.error(err.customMessage || 'Terjadi kesalahan saat menyimpan properti');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (prop) => {
    if (!window.confirm(`Hapus unit apartemen "${prop.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await request.delete(API_ENDPOINTS.PROPERTIES.DELETE(prop.id));
      if (res.success) {
        toast.success(`Unit ${prop.name} berhasil dihapus!`);
        fetchProperties(pagination.page, pagination.limit);
      } else {
        toast.error(res.message || 'Gagal menghapus properti');
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal menghapus properti');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Kelola Unit Apartemen & Villa</h1>
            <p className="text-xs text-gray-500 mt-1">
              Tambahkan unit baru, edit fasilitas, tarif, dan hubungkan dengan ID properti Hostex Channel Manager.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Unit Apartemen</span>
            </button>
          </div>
        </div>

        {/* Realtime Debounced Search */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari realtime nama unit, gedung, lokasi, atau kota... (Debounce 350ms)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button
            onClick={() => fetchProperties(pagination.page, pagination.limit)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
            title="Muat Ulang"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Foto & Nama Unit</th>
                  <th className="py-3.5 px-4">Tipe & Kapasitas</th>
                  <th className="py-3.5 px-4">Lokasi & Kota</th>
                  <th className="py-3.5 px-4">Tarif Sewa / Malam</th>
                  <th className="py-3.5 px-4">Deposit</th>
                  <th className="py-3.5 px-4">Hostex ID</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                ) : properties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Tidak ada data unit apartemen ditemukan.
                    </td>
                  </tr>
                ) : (
                  properties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-gray-50/80 transition-colors">
                      
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                            <ImageWithFallback
                              src={prop.images?.[0]}
                              alt={prop.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 line-clamp-1 max-w-[240px]">{prop.name}</div>
                            <div className="text-[11px] text-gray-500">{prop.building_name} {prop.unit_number ? `(${prop.unit_number})` : ''}</div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800 block">{prop.type}</span>
                        <span className="text-[11px] text-gray-500">{prop.max_guests} Tamu • {prop.bedrooms} Kamar</span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800">{prop.city}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[150px]">{prop.location}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        {prop.discount_percent > 0 && prop.original_price ? (
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="line-through text-gray-400 text-[10px]">
                                {formatRupiah(prop.original_price)}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">
                                {prop.discount_percent}% OFF
                              </span>
                            </div>
                            <div className="font-bold text-red-600 text-xs">
                              {formatRupiah(prop.price_per_night)}
                            </div>
                          </div>
                        ) : (
                          <div className="font-bold text-orange-600">
                            {formatRupiah(prop.price_per_night)}
                          </div>
                        )}
                      </td>

                      {/* Deposit */}
                      <td className="py-3 px-4 text-gray-600">
                        {formatRupiah(prop.security_deposit || 200000)}
                      </td>

                      {/* Hostex ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {prop.hostex_property_id || '-'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(prop)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            title="Edit Unit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prop)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Hapus Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          {!loading && properties.length > 0 && (
            <div className="p-4 bg-gray-50/50">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={(page) => fetchProperties(page, pagination.limit)}
                onLimitChange={(limit) => fetchProperties(1, limit)}
              />
            </div>
          )}
        </div>

        {/* MODAL: CREATE / EDIT PROPERTY */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? 'Edit Unit Apartemen' : 'Tambah Unit Apartemen Baru'}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1">
                  Nama Lengkap Properti / Listing <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Luxury Studio Casa Grande Residence"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nama Gedung / Kompleks</label>
                <input
                  type="text"
                  placeholder="Contoh: Casa Grande Residence"
                  value={formData.building_name}
                  onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nomor Unit / Tower</label>
                <input
                  type="text"
                  placeholder="Contoh: Tower Chianti 22A"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Kota Tujuan <span className="text-rose-500">*</span>
                </label>
                <Select
                  options={availableCities.map(c => ({
                    value: c.name,
                    label: `${c.name} ${c.province ? `(${c.province})` : ''}`
                  }))}
                  value={
                    formData.city 
                      ? { 
                          value: formData.city, 
                          label: availableCities.find(c => c.name === formData.city) 
                            ? `${formData.city} (${availableCities.find(c => c.name === formData.city)?.province || 'Indonesia'})` 
                            : formData.city 
                        } 
                      : null
                  }
                  onChange={(selected) => setFormData({ ...formData, city: selected?.value || '' })}
                  placeholder="Ketik & cari kota tujuan..."
                  isSearchable
                  noOptionsMessage={() => "Kota tidak ditemukan"}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: '#f9fafb',
                      borderColor: state.isFocused ? '#f97316' : '#e5e7eb',
                      borderRadius: '0.75rem',
                      padding: '1px',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(249, 115, 22, 0.2)' : 'none',
                      '&:hover': {
                        borderColor: '#f97316'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 9999
                    })
                  }}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Kawasan / Lokasi Area <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kota Kasablanka, Tebet"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Jl. Raya Casablanca No. 88..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tipe Unit</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium"
                >
                  {availableTypes.length > 0 ? (
                    availableTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} {t.description ? `(${t.description})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Studio">Studio</option>
                      <option value="1BR">1BR (1 Kamar)</option>
                      <option value="2BR">2BR (2 Kamar)</option>
                      <option value="3BR">3BR (3 Kamar)</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Villa">Villa</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 flex items-center justify-between">
                  <span>Hostex Property (Channel Sync)</span>
                  <span className="text-[11px] font-normal text-gray-400">ID Unit Hostex</span>
                </label>
                {hostexProperties.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={formData.hostex_property_id || ''}
                      onChange={(e) => setFormData({ ...formData, hostex_property_id: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                      <option value="">-- Pilih dari Daftar Properti Hostex --</option>
                      {hostexProperties.map((hp) => (
                        <option key={hp.id} value={hp.id}>
                          {hp.title || hp.name} (ID: {hp.id})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">Atau ID manual:</span>
                      <input
                        type="text"
                        placeholder="Contoh: 12528642"
                        value={formData.hostex_property_id}
                        onChange={(e) => setFormData({ ...formData, hostex_property_id: e.target.value })}
                        className="flex-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: 12528642"
                    value={formData.hostex_property_id}
                    onChange={(e) => setFormData({ ...formData, hostex_property_id: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono"
                  />
                )}
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Pilih unit Hostex agar reservasi otomatis memblokir kalender Airbnb, Agoda, & Booking.com.
                </span>
              </div>

              <div className="col-span-1 md:col-span-2 p-4 bg-orange-50/50 border border-orange-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-orange-600" />
                    Skema Harga & Promo Diskon
                  </span>
                  {Number(formData.discount_percent) > 0 && (
                    <span className="text-xs font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                      Hemat {formData.discount_percent}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Tarif Bayar Final (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 3140000"
                      value={formData.price_per_night}
                      onChange={(e) => {
                        const val = e.target.value;
                        const orig = Number(formData.original_price);
                        let disc = formData.discount_percent;
                        if (orig && Number(val) > 0 && orig > Number(val)) {
                          disc = Math.round(((orig - Number(val)) / orig) * 100);
                        }
                        setFormData({ ...formData, price_per_night: val, discount_percent: disc });
                      }}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-mono font-black text-red-600 focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Harga riil yang dibayar tamu</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Harga Normal / Coret (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 3290000"
                      value={formData.original_price}
                      onChange={(e) => {
                        const origVal = e.target.value;
                        const curr = Number(formData.price_per_night);
                        let disc = 0;
                        if (Number(origVal) > 0 && curr > 0 && Number(origVal) > curr) {
                          disc = Math.round(((Number(origVal) - curr) / Number(origVal)) * 100);
                        }
                        setFormData({ ...formData, original_price: origVal, discount_percent: disc });
                      }}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-mono focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Dicoret jika &gt; harga bayar</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Diskon Label (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="Contoh: 5"
                      value={formData.discount_percent || ''}
                      onChange={(e) => {
                        const discVal = Number(e.target.value) || 0;
                        let newPrice = formData.price_per_night;
                        const orig = Number(formData.original_price);
                        if (orig > 0 && discVal > 0) {
                          newPrice = Math.round(orig * (1 - discVal / 100));
                        }
                        setFormData({ ...formData, discount_percent: discVal, price_per_night: newPrice });
                      }}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-emerald-700 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Badge "Hemat X%" pada card</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Security Deposit Jaminan (Rp)</label>
                <input
                  type="number"
                  placeholder="200000"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Biaya Kebersihan (Cleaning Fee)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={formData.cleaning_fee}
                  onChange={(e) => setFormData({ ...formData, cleaning_fee: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono"
                />
              </div>

              {/* Unit Specifications & Capacity Grid */}
              <div className="sm:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-3">
                  Spesifikasi & Kapasitas Unit
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Kamar Tidur</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Tempat Tidur</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.beds}
                      onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Kamar Mandi</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Luas (m²)</label>
                    <input
                      type="number"
                      min="10"
                      value={formData.size_sqm}
                      onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Maks Tamu</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.max_guests}
                      onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Image File Upload Zone */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-700 block">
                    Upload Foto Unit Apartemen <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {existingImages.length + newImageFiles.length} / 20 Foto (Maks 10MB/file)
                  </span>
                </div>

                {/* Dropzone / Upload Trigger */}
                <label className="border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50/70 hover:bg-orange-50/30 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <div className="w-11 h-11 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-800 mb-0.5">
                    Klik untuk memilih foto atau seret file ke sini
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Mendukung format JPG, PNG, WEBP. Dapat memilih beberapa foto sekaligus.
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {/* Thumbnails Gallery Preview */}
                {(existingImages.length > 0 || previewUrls.length > 0) && (
                  <div className="mt-3.5 grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {/* Existing Images */}
                    {existingImages.map((imgUrl, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-100 shadow-xs"
                      >
                        <ImageWithFallback
                          src={imgUrl}
                          alt={`Existing ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                            Foto Utama
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-gray-900/80 hover:bg-rose-600 text-white rounded-full transition-colors opacity-80 group-hover:opacity-100"
                          title="Hapus foto ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Newly Selected Images */}
                    {previewUrls.map((pUrl, idx) => {
                      const isOverallFirst = existingImages.length === 0 && idx === 0;
                      return (
                        <div
                          key={`new-${idx}`}
                          className="relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-400 group bg-emerald-50 shadow-xs"
                        >
                          <img
                            src={pUrl}
                            alt={`New Upload ${idx}`}
                            className="w-full h-full object-cover"
                          />
                          {isOverallFirst ? (
                            <span className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                              Foto Utama
                            </span>
                          ) : (
                            <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              Baru
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-gray-900/80 hover:bg-rose-600 text-white rounded-full transition-colors opacity-80 group-hover:opacity-100"
                            title="Hapus foto ini"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Fasilitas (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="High Speed WiFi, AC, Smart TV, Kolam Renang..."
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Deskripsi Unit</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-600/25"
              >
                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Buat Unit Properti')}
              </button>
            </div>

          </form>
        </Modal>

      </div>
    </AdminLayout>
  );
}
